'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AssessmentResult } from '../../types/assessment-results';
import type { ChatMessage, ChatConversation } from '../../services/helpers/chat-types';

import apiService from '../../services/apiService';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import PersonaProfileFull from '../results/PersonaProfileFull';

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
  const [showPersona, setShowPersona] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingMessage]);

  // Build minimal context: persona profile only
  const buildPersonaContext = () => {
    try {
      const persona = assessmentResult?.persona_profile || {};
      return {
        type: 'persona_profile',
        resultId: assessmentResult.id,
        createdAt: assessmentResult.createdAt,
        persona,
      };
    } catch {
      return { type: 'persona_profile', resultId: assessmentResult.id, persona: {} };
    }
  };

  // Initialize chat conversation
  useEffect(() => {
    initializeChat();
  }, [assessmentResult.id]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.info('[AI Chat] Init start', { resultId: assessmentResult.id });

      // 0) Load any locally cached messages first so UI isn't empty on refresh
      let localMessages: ChatMessage[] = [];
      try {
        const cached = typeof window !== 'undefined'
          ? localStorage.getItem(`chat:${assessmentResult.id}:messages`)
          : null;
        if (cached) {
          localMessages = JSON.parse(cached);
          // Do not set typing message into cache; just set messages state
          setMessages(localMessages);
          console.info('[AI Chat] Loaded local cached messages', { count: localMessages.length });
        }
      } catch {}

      // Helper to merge messages by id and sort by timestamp
      const mergeMessages = (a: ChatMessage[], b: ChatMessage[]) => {
        const map = new Map<string, ChatMessage>();
        [...a, ...b].forEach((m) => {
          if (m && m.id && m.id !== 'typing') {
            map.set(m.id, m);
          }
        });
        return Array.from(map.values()).sort((m1, m2) => {
          const t1 = new Date(m1.timestamp || 0).getTime();
          const t2 = new Date(m2.timestamp || 0).getTime();
          return t1 - t2;
        });
      };

      // Try to get existing conversation first (server + local pointer)
      console.info('[AI Chat] Checking existing conversation on server', { resultId: assessmentResult.id });
      let existing = await apiService.getChatConversation(assessmentResult.id);

      if (existing?.success && existing.data) {
        setConversation(existing.data);
        const serverMessages = Array.isArray(existing.data.messages) ? existing.data.messages : [];
        const merged = mergeMessages(localMessages, serverMessages);
        setMessages(merged);
        try {
          localStorage.setItem(
            `chat-${assessmentResult.id}`,
            JSON.stringify({ id: existing.data.id, assessmentContext: buildPersonaContext() })
          );
          localStorage.setItem(
            `chat:${assessmentResult.id}:messages`,
            JSON.stringify(merged)
          );
        } catch {}
        console.info('[AI Chat] Found existing conversation', { conversationId: existing.data.id, serverMessages: serverMessages.length, mergedCount: merged.length });
      } else {
        // Start new conversation via ApiService
        const ctx = buildPersonaContext();
        console.info('[AI Chat] Starting new conversation with assessment context', ctx);
        const created = await apiService.startChatConversation({
          resultId: assessmentResult.id,
          assessmentContext: ctx,
        });
        if (created?.success && created.data) {
          setConversation(created.data);
          const serverMessages = Array.isArray(created.data.messages) ? created.data.messages : [];
          const merged = mergeMessages(localMessages, serverMessages);
          setMessages(merged);
          try {
            localStorage.setItem(
              `chat-${assessmentResult.id}`,
              JSON.stringify({ id: created.data.id, assessmentContext: buildPersonaContext() })
            );
            localStorage.setItem(
              `chat:${assessmentResult.id}:messages`,
              JSON.stringify(merged)
            );
          } catch {}
          console.info('[AI Chat] Conversation created', { conversationId: created.data.id, serverMessages: serverMessages.length, mergedCount: merged.length, hasSuggestions: !!created.data.suggestions });
        } else {
          throw new Error('Failed to create conversation');
        }
      }
    } catch (err: any) {
      console.error('Failed to initialize chat:', err);

      // Provide more specific error messages
      let errorMessage = 'Gagal memulai percakapan. ';

      if (typeof err?.message === 'string' && err.message.includes('Authentication required')) {
        errorMessage += 'Silakan login ulang untuk melanjutkan.';
      } else if (typeof err?.message === 'string' && err.message.includes('Network error')) {
        errorMessage += 'Periksa koneksi internet Anda dan coba lagi.';
      } else if (typeof err?.message === 'string' && err.message.includes('not available')) {
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
        const next = [...withoutTemp,
          { ...userMessage, id: 'user-' + Date.now() },
          aiResponse
        ];
        try {
          localStorage.setItem(
            `chat:${assessmentResult.id}:messages`,
            JSON.stringify(next)
          );
        } catch {}
        return next;
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
      setMessages(prev => {
        const next = prev.filter(msg => msg.id !== tempUserId);
        try {
          localStorage.setItem(
            `chat:${assessmentResult.id}:messages`,
            JSON.stringify(next)
          );
        } catch {}
        return next;
      });
    } finally {
      setIsSending(false);
      // Persist messages after each send attempt
      try {
        localStorage.setItem(
          `chat:${assessmentResult.id}:messages`,
          JSON.stringify(messages)
        );
      } catch {}
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <ChatHeader
        assessmentResult={assessmentResult}
        onBack={onBack}
        onTogglePersona={() => setShowPersona((v) => !v)}
        isPersonaOpen={showPersona}
      />

      {/* Error Alert */}
      {error && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content: Split view when persona open */}
      {showPersona ? (
        <PanelGroup direction="horizontal" className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          <Panel defaultSize={60} minSize={30}>
            <div className="h-full flex flex-col border-r border-gray-200" style={{ minHeight: 0 }}>
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                <div className="max-w-2xl mx-auto">
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

              {/* Input - sticky to bottom of viewport */}
              <div className="border-t border-gray-200 sticky bottom-0 bg-white">
                <div className="max-w-2xl mx-auto px-4 py-2">
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    disabled={isSending}
                    placeholder={isSending ? "Mengirim pesan..." : "Tanyakan tentang hasil assessment Anda..."}
                  />
                </div>
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize" />

          <Panel defaultSize={40} minSize={25}>
            <div className="h-full overflow-y-auto p-4 bg-white">
              <div className="space-y-4">
                <PersonaProfileFull result={assessmentResult} />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      ) : (
        <div className="flex-1 overflow-hidden flex" style={{ minHeight: 0 }}>
          <div className="w-full flex flex-col relative" style={{ minHeight: 0 }}>
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

            {/* Input - sticky to bottom of viewport */}
            <div className="border-t border-gray-200 sticky bottom-0 bg-white">
              <div className="max-w-4xl mx-auto px-4 py-2">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  disabled={isSending}
                  placeholder={isSending ? "Mengirim pesan..." : "Tanyakan tentang hasil assessment Anda..."}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
