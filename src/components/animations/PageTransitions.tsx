'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

// 1. Basic Page Transition Wrapper
export const PageTransition = ({ 
  children,
  className = ""
}: { 
  children: ReactNode;
  className?: string;
}) => {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.25, 0.25, 0.75]
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// 2. Slide Transition
export const SlideTransition = ({ 
  children,
  direction = 'right',
  className = ""
}: { 
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  className?: string;
}) => {
  const pathname = usePathname();

  const variants = {
    initial: {
      x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
      y: direction === 'up' ? -100 : direction === 'down' ? 100 : 0,
      opacity: 0
    },
    animate: {
      x: 0,
      y: 0,
      opacity: 1
    },
    exit: {
      x: direction === 'left' ? 100 : direction === 'right' ? -100 : 0,
      y: direction === 'up' ? 100 : direction === 'down' ? -100 : 0,
      opacity: 0
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: 0.4,
          ease: [0.25, 0.25, 0.25, 0.75]
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// 3. Scale Transition
export const ScaleTransition = ({ 
  children,
  className = ""
}: { 
  children: ReactNode;
  className?: string;
}) => {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.05, opacity: 0 }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.25, 0.25, 0.75]
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// 4. Curtain Transition
export const CurtainTransition = ({ 
  children,
  className = ""
}: { 
  children: ReactNode;
  className?: string;
}) => {
  const pathname = usePathname();

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={className}
        >
          {children}
        </motion.div>
      </AnimatePresence>
      
      {/* Curtain overlay */}
      <AnimatePresence>
        <motion.div
          key={`curtain-${pathname}`}
          className="fixed inset-0 bg-white z-50 pointer-events-none"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 0 }}
          exit={{ scaleY: 1 }}
          transition={{
            duration: 0.5,
            ease: [0.25, 0.25, 0.25, 0.75],
            transformOrigin: 'top'
          }}
          onAnimationComplete={() => {
            // Remove curtain after animation
          }}
        />
      </AnimatePresence>
    </div>
  );
};

// 5. Loading Transition dengan Progress
export const LoadingTransition = ({ 
  children,
  isLoading = false,
  className = ""
}: { 
  children: ReactNode;
  isLoading?: boolean;
  className?: string;
}) => {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-center min-h-screen"
        >
          <div className="text-center">
            <motion.div
              className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-600"
            >
              Loading...
            </motion.p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.25, 0.25, 0.75]
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 6. Route-specific Transitions
export const RouteTransition = ({ 
  children,
  className = ""
}: { 
  children: ReactNode;
  className?: string;
}) => {
  const pathname = usePathname();

  // Define different transitions for different routes
  const getTransitionConfig = (path: string) => {
    if (path.includes('/dashboard')) {
      return {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 }
      };
    }
    
    if (path.includes('/assessment')) {
      return {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
      };
    }

    // Default transition
    return {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.05 }
    };
  };

  const transitionConfig = getTransitionConfig(pathname);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={transitionConfig.initial}
        animate={transitionConfig.animate}
        exit={transitionConfig.exit}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.25, 0.25, 0.75]
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
