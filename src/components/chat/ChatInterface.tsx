'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AssessmentResult } from '../../data/dummy-assessment-data';
import type { ChatMessage } from '../../types/chat-types';

import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { Loader2, AlertCircle } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import PersonaProfileFull from '../results/PersonaProfileFull';
import { cn } from '../../lib/utils';

// Inline Alert components
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseClasses = "relative w-full rounded-lg border p-4";
    const variants = {
      default: "bg-white text-gray-900 border-gray-200",
      destructive: "border-red-200 text-red-800 bg-red-50",
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(baseClasses, variants[variant], className)}
        {...props}
      />
    );
  }
);
Alert.displayName = "Alert";

const AlertDescription = React.forwardRef<HTMLDivElement, AlertDescriptionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm leading-relaxed", className)}
      {...props}
    />
  )
);
AlertDescription.displayName = "AlertDescription";

interface ChatInterfaceProps {
  assessmentResult: AssessmentResult;
  onBack: () => void;
}

export default function ChatInterface({ assessmentResult, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: `Halo! Saya adalah AI Konselor Karir Anda. Saya siap membantu Anda menjelajahi hasil assessment Anda dan memberikan panduan karir yang bermanfaat. Berdasarkan profil Anda sebagai ${assessmentResult.persona_profile?.title || 'Professional'}, saya dapat membantu Anda dengan pertanyaan tentang karir, kekuatan, dan area pengembangan.

Apa yang ingin Anda tanyakan hari ini?`,
      timestamp: new Date().toISOString(),
      resultId: assessmentResult.id
    };
    setMessages([welcomeMessage]);
  }, [assessmentResult.id, assessmentResult.persona_profile?.title]);

  // Dummy response generator
  const generateDummyResponse = (userMessage: string): string => {
    const responses = [
      "Terima kasih atas pertanyaan Anda. Berdasarkan hasil assessment Anda, saya melihat bahwa Anda memiliki potensi besar dalam bidang ini. Apakah Anda ingin saya jelaskan lebih detail?",
      "Ini adalah pertanyaan yang sangat baik. Profil Anda menunjukkan bahwa Anda cocok dengan berbagai jenis peran. Mari kita bahas lebih lanjut tentang preferensi Anda.",
      "Saya mengerti kekhawatiran Anda. Berdasarkan kepribadian Anda, ada beberapa jalur karir yang bisa sangat sesuai. Mari kita eksplorasi bersama.",
      "Pertanyaan yang menarik! Dari hasil assessment Anda, saya dapat melihat beberapa kekuatan utama yang bisa Anda kembangkan lebih lanjut.",
      "Saya senang Anda bertanya tentang ini. Profil Anda menunjukkan adanya keselarasan antara minat dan kemampuan. Mari kita bahas strategi pengembangannya.",
      "Berdasarkan analisis hasil assessment Anda, ada beberapa rekomendasi karir yang bisa saya berikan. Apakah Anda ingin mendengar yang paling sesuai?",
      "Ini adalah area penting untuk dikembangkan. Saya melihat dari profil Anda bahwa dengan sedikit pengembangan, Anda bisa sangat sukses di bidang ini.",
      "Saya mengerti apa yang Anda tanyakan. Mari kita lihat bagaimana kepribadian dan minat Anda selaras dengan berbagai pilihan karir yang tersedia."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async (messageContent: string) => {
    if (isSending) return;

    try {
      setIsSending(true);
      setError(null);

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: 'user-' + Date.now(),
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

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Remove typing indicator and add AI response
      setTypingMessage(null);
      
      const aiResponse: ChatMessage = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: generateDummyResponse(messageContent),
        timestamp: new Date().toISOString(),
        resultId: assessmentResult.id
      };

      setMessages(prev => [...prev, aiResponse]);

    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Gagal mengirim pesan. Silakan coba lagi.');
      setTypingMessage(null);
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
