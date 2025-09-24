'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AssessmentResult } from '../../types/assessment-results';
import type { ChatMessage, ChatConversation } from '../../services/helpers/chat-types';

import apiService from '../../services/apiService';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { Card } from '../ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface ChatInterfaceProps {
  assessmentResult: AssessmentResult;
  onBack: () => void;
}

export default function ChatInterface({ assessmentResult, onBack }: ChatInterfaceProps) {
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingMessage, setTypingMessage] = useState<ChatMessage | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingMessage]);

  // Initialize chat conversation
  useEffect(() => {
    initializeChat();
  }, [assessmentResult.id]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to get existing conversation first
      let existing = await apiService.getChatConversation(assessmentResult.id);

      if (existing?.success && existing.data) {
        setConversation(existing.data);
        setMessages(Array.isArray(existing.data.messages) ? existing.data.messages : []);
        try {
          localStorage.setItem(
            `chat-${assessmentResult.id}`,
            JSON.stringify({ id: existing.data.id, assessmentContext: assessmentResult })
          );
        } catch {}
      } else {
        // Start new conversation via ApiService
        const created = await apiService.startChatConversation({
          resultId: assessmentResult.id,
          assessmentContext: assessmentResult,
        });
        if (created?.success && created.data) {
          setConversation(created.data);
          setMessages(Array.isArray(created.data.messages) ? created.data.messages : []);
          try {
            localStorage.setItem(
              `chat-${assessmentResult.id}`,
              JSON.stringify({ id: created.data.id, assessmentContext: assessmentResult })
            );
          } catch {}
        } else {
          throw new Error('Failed to create conversation');
        }
      }
    } catch (err) {
      console.error('Failed to initialize chat:', err);

      // Provide more specific error messages
      let errorMessage = 'Gagal memulai percakapan. ';

      if (err.message.includes('Authentication required')) {
        errorMessage += 'Silakan login ulang untuk melanjutkan.';
      } else if (err.message.includes('Network error')) {
        errorMessage += 'Periksa koneksi internet Anda dan coba lagi.';
      } else if (err.message.includes('not available')) {
        errorMessage += 'Layanan chatbot sedang tidak tersedia. Coba lagi nanti.';
      } else {
        errorMessage += 'Silakan coba lagi atau hubungi support jika masalah berlanjut.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (messageContent: string) => {
    if (!conversation || isSending) return;


      // Generate a temporary ID for this user message so we can clean it up on error
      const tempUserId = 'temp-user-' + Date.now();

    try {
      setIsSending(true);
      setError(null);

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: tempUserId,
        role: 'user',
        content: messageContent,
        timestamp: new Date().toISOString(),
        resultId: assessmentResult.id
      };

      setMessages(prev => [...prev, userMessage]);

      // Show typing indicator
      const typingMsg: ChatMessage = {
        id: 'typing',
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        resultId: assessmentResult.id
      };
      setTypingMessage(typingMsg);

      // Send message via ApiService
      const apiResp = await apiService.sendChatMessage({
        conversationId: conversation.id,
        resultId: assessmentResult.id,
        message: messageContent,
      });
      if (!apiResp?.success || !apiResp.data?.message) {
        throw new Error('Failed to send message');
      }
      const aiResponse = apiResp.data.message;

      // Remove typing indicator and add AI response
      setTypingMessage(null);
      setMessages(prev => {
        // Remove the temporary user message and add both final messages
        const withoutTemp = prev.filter(msg => msg.id !== tempUserId);
        return [...withoutTemp,
          { ...userMessage, id: 'user-' + Date.now() },
          aiResponse
        ];
      });

    } catch (err) {
      console.error('Failed to send message:', err);

      // Provide more specific error messages
      let errorMessage = 'Gagal mengirim pesan. ';

      if (err.message.includes('Authentication required')) {
        errorMessage += 'Silakan login ulang untuk melanjutkan.';
      } else if (err.message.includes('Network error')) {
        errorMessage += 'Periksa koneksi internet Anda dan coba lagi.';
      } else if (err.message.includes('Conversation not found')) {
        errorMessage += 'Percakapan tidak ditemukan. Silakan mulai percakapan baru.';
      } else if (err.message.includes('Server error')) {
        errorMessage += 'Terjadi kesalahan server. Coba lagi nanti.';
      } else {
        errorMessage += 'Silakan coba lagi.';
      }

      setError(errorMessage);
      setTypingMessage(null);

      // Remove the temporary user message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserId));
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memulai percakapan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <ChatHeader assessmentResult={assessmentResult} onBack={onBack} />

      {/* Error Alert */}
      {error && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2">
                  <a
                    href="/debug-chatbot"
                    target="_blank"
                    className="text-sm underline hover:no-underline"
                  >
                    🔧 Debug Chatbot API
                  </a>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <div className="max-w-4xl mx-auto">
          {/* Messages */}
          {messages && messages.length > 0 ? (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>Belum ada pesan. Mulai percakapan dengan mengirim pesan!</p>
            </div>
          )}

          {/* Typing Indicator */}
          {typingMessage && (
            <MessageBubble message={typingMessage} isTyping={true} />
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isSending}
            placeholder={isSending ? "Mengirim pesan..." : "Tanyakan tentang hasil assessment Anda..."}
          />
        </div>
      </div>
    </div>
  );
}
