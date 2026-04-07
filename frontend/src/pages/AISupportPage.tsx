import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { Button } from '../components/common/Button';
import type { ApiResponse } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SESSION_KEY = 'ai_conversation';

const AISupportPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Persist to session storage
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      let convId = conversationId;
      if (!convId) {
        const res = await apiClient.post<ApiResponse<{ conversationId: string }>>('/ai-support/conversation');
        convId = res.data.data.conversationId;
        setConversationId(convId);
      }
      const res = await apiClient.post<ApiResponse<{ message: string }>>('/ai-support/message', {
        conversationId: convId,
        message,
      });
      return res.data.data.message;
    },
    onSuccess: (reply) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm sorry, I'm having trouble connecting. Please try again." },
      ]);
    },
  });

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || sendMutation.isPending) return;
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setInput('');
    sendMutation.mutate(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-4rem)]">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Support</h1>

      {/* Message list */}
      <div
        className="flex-1 overflow-y-auto space-y-3 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
        aria-live="polite"
        aria-label="Conversation"
      >
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">
            Ask me anything about real estate or Estate Bridge!
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sendMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-400 animate-pulse">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Enter to send)"
          rows={2}
          aria-label="Message input"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button onClick={handleSend} loading={sendMutation.isPending} disabled={!input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default AISupportPage;
