'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatInterface from '../../../../components/chat/ChatInterface';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { getDummyAssessmentResult } from '../../../../data/dummy-assessment-data';
import { cn } from '../../../../lib/utils';

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

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;

  // Use dummy data instead of API calls
  const dummyResult = getDummyAssessmentResult();
  const isLoading = false;
  const error = null;

  const handleBack = () => {
    router.push(`/results/${resultId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Memuat Data Assessment
          </h2>
          <p className="text-gray-600">
            Sedang menyiapkan chatbot konselor karir Anda...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !dummyResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              {error || 'Terjadi kesalahan yang tidak diketahui.'}
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Tidak Dapat Mengakses Chatbot
            </h2>
            <p className="text-gray-600">
              Untuk menggunakan fitur chatbot, Anda perlu menyelesaikan assessment terlebih dahulu.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Dashboard
              </Button>
              
              <Button
                onClick={() => router.push('/assessment')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Mulai Assessment
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="h-screen flex flex-col">
      <ChatInterface
        assessmentResult={{
          ...dummyResult,
          // Force ChatInterface context building to focus on persona profile only
          assessment_data: dummyResult.assessment_data, // untouched
          persona_profile: dummyResult.persona_profile,
        }}
        onBack={handleBack}
      />
    </div>
  );
}
