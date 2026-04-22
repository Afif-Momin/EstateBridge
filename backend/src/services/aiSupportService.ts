import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { getFirebaseFirestore } from '../config/firebase';
import { COLLECTIONS } from '../constants';
import { ChatMessage, AIResponse } from '../types';
import { logger } from '../utils/logger';

// ─── Gemini setup ────────────────────────────────────────────────────────────
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!config.ai.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
  }
  return genAI;
}

// ─── Circuit breaker ─────────────────────────────────────────────────────────
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
interface CircuitBreaker {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
}

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT_MS = 60_000;
const HALF_OPEN_SUCCESS_THRESHOLD = 2;

const circuitBreaker: CircuitBreaker = {
  state: 'CLOSED',
  failureCount: 0,
  lastFailureTime: 0,
  successCount: 0,
};

function isCircuitOpen(): boolean {
  if (circuitBreaker.state === 'OPEN') {
    if (Date.now() - circuitBreaker.lastFailureTime >= CIRCUIT_BREAKER_TIMEOUT_MS) {
      circuitBreaker.state = 'HALF_OPEN';
      circuitBreaker.successCount = 0;
      logger.info('AI circuit breaker transitioning to HALF_OPEN');
      return false;
    }
    return true;
  }
  return false;
}

function recordSuccess(): void {
  if (circuitBreaker.state === 'HALF_OPEN') {
    circuitBreaker.successCount += 1;
    if (circuitBreaker.successCount >= HALF_OPEN_SUCCESS_THRESHOLD) {
      circuitBreaker.state = 'CLOSED';
      circuitBreaker.failureCount = 0;
      logger.info('AI circuit breaker CLOSED after recovery');
    }
  } else {
    circuitBreaker.failureCount = 0;
  }
}

function recordFailure(): void {
  circuitBreaker.failureCount += 1;
  circuitBreaker.lastFailureTime = Date.now();
  if (circuitBreaker.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreaker.state = 'OPEN';
    logger.warn('AI circuit breaker OPENED due to repeated failures');
  }
}

// ─── Property search (Firebase) ───────────────────────────────────────────────
interface PropertySummary {
  id: string;
  title: string;
  type: string;
  price: number;
  currency: string;
  city: string;
  state: string;
  country: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  status: string;
  description?: string;
}

/**
 * Searches Firestore properties based on extracted criteria from user query.
 * Returns a compact summary string to inject into the Gemini prompt.
 */
async function searchProperties(query: string): Promise<string> {
  try {
    const db = getFirebaseFirestore();
    const queryLower = query.toLowerCase();

    // Start with all available properties (limit to prevent huge context)
    let firestoreQuery: FirebaseFirestore.Query = db
      .collection(COLLECTIONS.PROPERTIES)
      .where('status', '==', 'available')
      .limit(15);

    // Filter by type keywords
    if (queryLower.includes('apartment')) {
      firestoreQuery = firestoreQuery.where('type', '==', 'apartment');
    } else if (queryLower.includes('house') || queryLower.includes('villa')) {
      firestoreQuery = firestoreQuery.where('type', '==', 'house');
    } else if (queryLower.includes('condo')) {
      firestoreQuery = firestoreQuery.where('type', '==', 'condo');
    } else if (queryLower.includes('commercial') || queryLower.includes('office') || queryLower.includes('shop')) {
      firestoreQuery = firestoreQuery.where('type', '==', 'commercial');
    } else if (queryLower.includes('land') || queryLower.includes('plot')) {
      firestoreQuery = firestoreQuery.where('type', '==', 'land');
    }

    const snap = await firestoreQuery.get();

    if (snap.empty) {
      // Fallback: return any available properties without type filter
      const fallback = await db
        .collection(COLLECTIONS.PROPERTIES)
        .where('status', '==', 'available')
        .limit(10)
        .get();

      if (fallback.empty) {
        return 'No properties are currently listed on Estate Bridge.';
      }
      snap.docs.push(...fallback.docs);
    }

    const properties: PropertySummary[] = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        title: d.title || 'Untitled',
        type: d.type || 'property',
        price: d.price || 0,
        currency: d.currency || 'USD',
        city: d.city || d.location?.city || '',
        state: d.state || d.location?.state || '',
        country: d.country || d.location?.country || '',
        bedrooms: d.bedrooms,
        bathrooms: d.bathrooms,
        area: d.area,
        status: d.status || 'available',
        description: d.description?.substring(0, 120),
      };
    });

    // Format compact summary for Gemini context
    const summary = properties
      .map((p, i) => {
        const location = [p.city, p.state, p.country].filter(Boolean).join(', ');
        const details = [
          p.bedrooms ? `${p.bedrooms} bed` : null,
          p.bathrooms ? `${p.bathrooms} bath` : null,
          p.area ? `${p.area} sqft` : null,
        ]
          .filter(Boolean)
          .join(', ');
        return `${i + 1}. [${p.id}] ${p.title} | ${p.type} | ${p.currency} ${p.price.toLocaleString()} | ${location}${details ? ` | ${details}` : ''}${p.description ? ` | "${p.description}..."` : ''}`;
      })
      .join('\n');

    return `Current available properties on Estate Bridge (${properties.length} results):\n${summary}`;
  } catch (error: any) {
    logger.error('Property search for AI failed', { error: error.message });
    return 'Unable to fetch property listings at this time.';
  }
}

// ─── Detect if query needs property data ─────────────────────────────────────
function needsPropertySearch(message: string): boolean {
  const keywords = [
    'property', 'properties', 'listing', 'listings', 'house', 'apartment',
    'condo', 'land', 'commercial', 'buy', 'rent', 'available', 'price',
    'bedroom', 'bathroom', 'show me', 'find', 'search', 'look for',
    'any house', 'any flat', 'any property', 'how much', 'affordable',
    'expensive', 'cheap', 'budget', 'sqft', 'area', 'location', 'city',
  ];
  const lower = message.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

// ─── Gemini call ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are EstateBot, a smart and friendly real estate assistant for Estate Bridge — a premium property marketplace.

Your capabilities:
- Answer questions about properties listed on Estate Bridge from the data provided to you
- Give real estate advice (buying, selling, investing, mortgages, negotiations)
- Help users understand property types, pricing, and locations
- Assist sellers with listing tips
- Explain the Estate Bridge platform features

Rules:
- Always be concise, helpful, and professional
- When recommending properties, reference specific details from the property data
- If the user asks about a property not in the data, tell them to browse the full listings
- Format prices clearly with currency symbols
- Use bullet points for lists of properties
- Never make up property data — only use what is provided`;

async function callGemini(
  history: ChatMessage[],
  userMessage: string,
  propertyContext: string
): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Build full prompt with property context injected
  const contextInjection = propertyContext
    ? `\n\n[LIVE PROPERTY DATA FROM FIREBASE]\n${propertyContext}\n[END OF PROPERTY DATA]\n`
    : '';

  // Convert history to Gemini chat format
  const geminiHistory = history.slice(-10).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: 'model',
        parts: [{ text: 'Understood! I\'m EstateBot, ready to help with Estate Bridge properties and real estate questions.' }],
      },
      ...geminiHistory,
    ],
    generationConfig: {
      maxOutputTokens: 600,
      temperature: 0.7,
    },
  });

  const fullMessage = contextInjection
    ? `${userMessage}\n${contextInjection}`
    : userMessage;

  const result = await chat.sendMessage(fullMessage);
  return result.response.text();
}

const FALLBACK_MESSAGE =
  "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or browse our property listings directly.";

// ─── Public service ───────────────────────────────────────────────────────────
export const aiSupportService = {
  /**
   * Send a message and get a Gemini-powered AI response.
   * Automatically injects live Firebase property data when relevant.
   */
  async sendMessage(
    conversationId: string,
    userId: string,
    userMessage: string
  ): Promise<AIResponse> {
    const db = getFirebaseFirestore();
    const convRef = db.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId);

    // Load existing history
    const convSnap = await convRef.get();
    const history: ChatMessage[] = convSnap.exists
      ? ((convSnap.data()?.messages as ChatMessage[]) ?? [])
      : [];

    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    let assistantContent: string;

    if (isCircuitOpen()) {
      logger.warn('AI circuit breaker is OPEN, returning fallback');
      assistantContent = FALLBACK_MESSAGE;
    } else {
      try {
        // Inject property data if the query is property-related
        let propertyContext = '';
        if (needsPropertySearch(userMessage)) {
          logger.info('Fetching property context for AI query', { userId, conversationId });
          propertyContext = await searchProperties(userMessage);
        }

        assistantContent = await callGemini(history, userMessage, propertyContext);
        recordSuccess();
        logger.info('Gemini response generated', { conversationId, userId });
      } catch (error: any) {
        logger.error('Gemini AI call failed', { error: error?.message });
        recordFailure();
        assistantContent = FALLBACK_MESSAGE;
      }
    }

    const assistantMsg: ChatMessage = {
      id: `${Date.now()}-assistant`,
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date(),
    };

    // Persist updated history
    const updatedMessages = [...history, userMsg, assistantMsg];
    await convRef.set(
      {
        userId,
        messages: updatedMessages.map((m) => ({
          ...m,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
        })),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return {
      message: assistantContent,
      conversationId,
      timestamp: assistantMsg.timestamp,
    };
  },

  /** Create a new conversation document */
  async createConversation(userId: string): Promise<string> {
    const db = getFirebaseFirestore();
    const ref = await db.collection(COLLECTIONS.CONVERSATIONS).add({
      userId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return ref.id;
  },

  /** Retrieve conversation history */
  async getConversation(conversationId: string, userId: string): Promise<ChatMessage[]> {
    const db = getFirebaseFirestore();
    const snap = await db.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId).get();

    if (!snap.exists) return [];

    const data = snap.data()!;
    if (data.userId !== userId) return [];

    return ((data.messages ?? []) as any[]).map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  },

  // Expose for testing
  _getCircuitBreaker: () => ({ ...circuitBreaker }),
  _resetCircuitBreaker: () => {
    circuitBreaker.state = 'CLOSED';
    circuitBreaker.failureCount = 0;
    circuitBreaker.lastFailureTime = 0;
    circuitBreaker.successCount = 0;
  },
};
