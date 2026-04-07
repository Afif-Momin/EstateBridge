import { config } from '../config';
import { getFirebaseFirestore } from '../config/firebase';
import { COLLECTIONS } from '../constants';
import { ChatMessage, AIResponse } from '../types';
import { logger } from '../utils/logger';

// Circuit breaker states
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreaker {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
}

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT_MS = 60_000; // 1 minute
const HALF_OPEN_SUCCESS_THRESHOLD = 2;
const AI_REQUEST_TIMEOUT_MS = 10_000; // 10 seconds

const circuitBreaker: CircuitBreaker = {
  state: 'CLOSED',
  failureCount: 0,
  lastFailureTime: 0,
  successCount: 0,
};

function isCircuitOpen(): boolean {
  if (circuitBreaker.state === 'OPEN') {
    const elapsed = Date.now() - circuitBreaker.lastFailureTime;
    if (elapsed >= CIRCUIT_BREAKER_TIMEOUT_MS) {
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

/** Calls the OpenAI chat completions endpoint with a timeout */
async function callAIAPI(messages: Array<{ role: string; content: string }>): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.ai.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.ai.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful real estate assistant for Estate Bridge. Help users with property listings, buying/selling advice, and general real estate questions.',
          },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`AI API responded with status ${response.status}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message?.content ?? 'I could not generate a response.';
  } finally {
    clearTimeout(timeoutId);
  }
}

const FALLBACK_MESSAGE =
  "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or contact our support team for assistance.";

export const aiSupportService = {
  /**
   * Send a message and get an AI response.
   * Stores the exchange in Firestore under the given conversationId.
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
      ? (convSnap.data()?.messages as ChatMessage[]) ?? []
      : [];

    // Build the new user message
    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    let assistantContent: string;

    if (isCircuitOpen()) {
      logger.warn('AI circuit breaker is OPEN, returning fallback message');
      assistantContent = FALLBACK_MESSAGE;
    } else {
      try {
        const apiMessages = [...history, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));
        assistantContent = await callAIAPI(apiMessages);
        recordSuccess();
      } catch (error: any) {
        const isTimeout = error?.name === 'AbortError';
        logger.error('AI API call failed', { error: error?.message, isTimeout });
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

  /** Create a new conversation document and return its ID */
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

    if (!snap.exists) {
      return [];
    }

    const data = snap.data()!;
    // Ensure the conversation belongs to the requesting user
    if (data.userId !== userId) {
      return [];
    }

    const messages: ChatMessage[] = (data.messages ?? []).map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));

    return messages;
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
