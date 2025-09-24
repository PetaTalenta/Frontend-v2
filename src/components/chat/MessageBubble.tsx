'use client';

import React from 'react';
import type { ChatMessage } from '../../services/helpers/chat-types';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Card, CardContent } from '../ui/card';
import { Bot, User } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MessageBubbleProps {
  message: ChatMessage;
  isTyping?: boolean;
}

export default function MessageBubble({ message, isTyping = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      {/* Avatar - only show for assistant */}
      {isAssistant && (
        <Avatar className="w-8 h-8 mt-1">
          <AvatarFallback className="bg-blue-100 text-blue-600">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Content */}
      <div className={cn(
        "max-w-[80%] space-y-1",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Message Bubble */}
        <Card className={cn(
          "shadow-sm border-0",
          isUser 
            ? "bg-blue-600 text-white" 
            : "bg-white border border-gray-200"
        )}>
          <CardContent className="p-3">
            {isTyping ? (
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">AI sedang mengetik...</span>
              </div>
            ) : (
              <div className={cn(
                "text-sm leading-relaxed whitespace-pre-wrap",
                isUser ? "text-white" : "text-gray-800"
              )}>
                {message.content}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timestamp */}
        <div className={cn(
          "text-xs text-gray-500 px-1",
          isUser ? "text-right" : "text-left"
        )}>
          {new Date(message.timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {/* Avatar - only show for user */}
      {isUser && (
        <Avatar className="w-8 h-8 mt-1">
          <AvatarFallback className="bg-gray-100 text-gray-600">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
