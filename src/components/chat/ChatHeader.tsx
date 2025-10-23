'use client';

import React from 'react';
import { ArrowLeft, Bot, MessageCircle, UserSquare2 } from 'lucide-react';
import { AssessmentResult } from '../../data/dummy-assessment-data';
import { cn } from '../../lib/utils';

// Inline Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-700",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      outline: "border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
      ghost: "hover:bg-gray-100 hover:text-gray-900",
      link: "text-blue-600 underline-offset-4 hover:underline",
    };
    
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    };

    return (
      <button
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// Inline Avatar components
interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}
interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
);
Avatar.displayName = "Avatar";

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-gray-100",
        className
      )}
      {...props}
    />
  )
);
AvatarFallback.displayName = "AvatarFallback";

interface ChatHeaderProps {
  assessmentResult: AssessmentResult;
  onBack: () => void;
  onTogglePersona?: () => void;
  isPersonaOpen?: boolean;
}

export default function ChatHeader({ assessmentResult, onBack, onTogglePersona, isPersonaOpen }: ChatHeaderProps) {
  const persona = assessmentResult.persona_profile;

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali
        </Button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300" />

        {/* Bot Avatar */}
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-blue-100 text-blue-600">
            <Bot className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>

        {/* Chat Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-gray-900">AI Konselor Karir</h1>
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Online
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Konsultasi untuk profil: <span className="font-medium">{persona?.title || 'Tidak Diketahui'}</span>
          </p>
        </div>

        {/* Persona Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onTogglePersona}
          className="ml-auto"
        >
          <UserSquare2 className="w-4 h-4 mr-2" />
          {isPersonaOpen ? 'Tutup Profil Persona' : 'Cek Profil Persona'}
        </Button>
      </div>

      {/* Assessment Context Info */}
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bot className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              Konteks Assessment Anda
            </h3>
            <p className="text-xs text-blue-700 leading-relaxed">
              Saya memiliki akses ke hasil assessment lengkap Anda termasuk profil kepribadian, 
              kekuatan, dan rekomendasi karir. Silakan bertanya tentang apapun yang ingin Anda ketahui!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
