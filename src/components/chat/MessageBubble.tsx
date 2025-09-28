'use client';

import React from 'react';

// Minimal, safe Markdown renderer for assistant messages (no HTML injection)
function SafeMarkdown({ content }: { content: string }) {
  // Very small URL sanitizer: allow only http(s), mailto, tel
  const sanitizeUrl = (url: string): string | null => {
    try {
      const trimmed = url.trim();
      if (/^(javascript:|data:|vbscript:)/i.test(trimmed)) return null;
      if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
      // If looks like domain without protocol, prefix https
      if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return `https://${trimmed}`;
      return null;
    } catch {
      return null;
    }
  };

  const renderInline = (text: string, keyPrefix: string) => {
    // Handle code spans first: `code`
    const codeSplit = text.split(/`([^`]+)`/g);
    const nodes: React.ReactNode[] = [];
    codeSplit.forEach((chunk, i) => {
      if (i % 2 === 1) {
        nodes.push(
          <code key={`${keyPrefix}-code-${i}`} className="px-1 py-0.5 rounded bg-gray-100 text-gray-800">
            {chunk}
          </code>
        );
      } else {
        // Links: [text](url)
        let lastIndex = 0;
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let m: RegExpExecArray | null;
        while ((m = linkRegex.exec(chunk)) !== null) {
          const before = chunk.slice(lastIndex, m.index);
          if (before) nodes.push(<span key={`${keyPrefix}-t-${i}-${lastIndex}`}>{before}</span>);
          const label = m[1];
          const href = sanitizeUrl(m[2]);
          if (href) {
            nodes.push(
              <a key={`${keyPrefix}-a-${i}-${m.index}`} href={href} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-700">
                {label}
              </a>
            );
          } else {
            nodes.push(<span key={`${keyPrefix}-t2-${i}-${m.index}`}>{label}</span>);
          }
          lastIndex = m.index + m[0].length;
        }
        const rest = chunk.slice(lastIndex);
        if (rest) {
          // Bold: **text** or __text__ ; Italic: *text* or _text_
          // Process bold first
          const boldSplit = rest.split(/\*\*([^*]+)\*\*|__([^_]+)__/g);
          boldSplit.forEach((b, bi) => {
            if (bi % 3 === 2 || bi % 3 === 1) {
              nodes.push(<strong key={`${keyPrefix}-b-${i}-${bi}`} className="font-semibold">{b}</strong>);
            } else if (b) {
              // Italic
              const itSplit = b.split(/\*([^*]+)\*|_([^_]+)_/g);
              itSplit.forEach((it, ii) => {
                if (ii % 3 === 2 || ii % 3 === 1) {
                  nodes.push(<em key={`${keyPrefix}-i-${i}-${bi}-${ii}`} className="italic">{it}</em>);
                } else if (it) {
                  nodes.push(<span key={`${keyPrefix}-s-${i}-${bi}-${ii}`}>{it}</span>);
                }
              });
            }
          });
        }
      }
    });
    return nodes;
  };

  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block ```
    if (/^```/.test(line)) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      // Skip closing ```
      if (i < lines.length && /^```/.test(lines[i])) i++;
      elements.push(
        <pre key={`pre-${key++}`} className="bg-gray-900 text-gray-100 text-xs rounded-md p-3 overflow-auto">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Headings #, ##, ### -> render bold paragraph
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      elements.push(
        <p key={`h-${key++}`} className="font-semibold text-gray-900">
          {renderInline(heading[2], `h-${key}`)}
        </p>
      );
      i++;
      continue;
    }

    // List blocks - unordered
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${key++}`} className="list-disc pl-5 space-y-1">
          {items.map((it, idx) => (
            <li key={`li-${idx}`}>{renderInline(it, `ul-${key}-${idx}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${key++}`} className="list-decimal pl-5 space-y-1">
          {items.map((it, idx) => (
            <li key={`oli-${idx}`}>{renderInline(it, `ol-${key}-${idx}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph (accumulate consecutive non-empty lines)
    if (line.trim().length > 0) {
      const paraLines: string[] = [line];
      i++;
      while (i < lines.length && lines[i].trim().length > 0 && !/^```/.test(lines[i])) {
        // Stop on list or heading starts
        if (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]) || /^(#{1,6})\s+/.test(lines[i])) break;
        paraLines.push(lines[i]);
        i++;
      }
      const paraText = paraLines.join(' ');
      elements.push(
        <p key={`p-${key++}`} className="text-gray-800">
          {renderInline(paraText, `p-${key}`)}
        </p>
      );
      continue;
    }

    // Empty line -> spacing
    i++;
  }

  return <div className="space-y-2">{elements}</div>;
}
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
                "text-sm leading-relaxed",
                isUser ? "text-white" : "text-gray-800"
              )}>
                {isAssistant ? (
                  <SafeMarkdown content={message.content} />
                ) : (
                  <span className="whitespace-pre-wrap">{message.content}</span>
                )}
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
