'use client';

import { motion, useReducedMotion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

// 1. Respect User Preferences - Reduced Motion
export const MotionWrapper = ({ 
  children, 
  ...motionProps 
}: { 
  children: React.ReactNode;
  [key: string]: any;
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div {...motionProps}>{children}</div>;
  }

  return <motion.div {...motionProps}>{children}</motion.div>;
};

// 2. Performance-optimized Animation Component
export const OptimizedMotion = ({ 
  children, 
  className = "",
  ...props 
}: { 
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => {
  return (
    <motion.div
      className={className}
      style={{
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        perspective: 1000
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// 3. Conditional Animation Hook
export const useConditionalAnimation = (condition: boolean, animation: any, fallback: any = {}) => {
  const shouldReduceMotion = useReducedMotion();
  
  if (shouldReduceMotion || !condition) {
    return fallback;
  }
  
  return animation;
};

// 4. Animation Presets
export const animationPresets = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  },
  
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: [0.25, 0.25, 0.25, 0.75] }
  },
  
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3, ease: [0.25, 0.25, 0.25, 0.75] }
  },
  
  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.3, ease: [0.25, 0.25, 0.25, 0.75] }
  },
  
  // Slide animations
  slideInLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 },
    transition: { duration: 0.3, ease: [0.25, 0.25, 0.25, 0.75] }
  },
  
  slideInRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
    transition: { duration: 0.3, ease: [0.25, 0.25, 0.25, 0.75] }
  },
  
  // Hover effects
  hoverScale: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { duration: 0.2 }
  },
  
  hoverLift: {
    whileHover: { y: -4, scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.2 }
  }
};

// 5. Preset Animation Components
export const FadeIn = ({ children, delay = 0, ...props }: { 
  children: React.ReactNode; 
  delay?: number;
  [key: string]: any;
}) => (
  <MotionWrapper
    {...animationPresets.fadeIn}
    transition={{ ...animationPresets.fadeIn.transition, delay }}
    {...props}
  >
    {children}
  </MotionWrapper>
);

export const FadeInUp = ({ children, delay = 0, ...props }: { 
  children: React.ReactNode; 
  delay?: number;
  [key: string]: any;
}) => (
  <MotionWrapper
    {...animationPresets.fadeInUp}
    transition={{ ...animationPresets.fadeInUp.transition, delay }}
    {...props}
  >
    {children}
  </MotionWrapper>
);

export const ScaleIn = ({ children, delay = 0, ...props }: { 
  children: React.ReactNode; 
  delay?: number;
  [key: string]: any;
}) => (
  <MotionWrapper
    {...animationPresets.scaleIn}
    transition={{ ...animationPresets.scaleIn.transition, delay }}
    {...props}
  >
    {children}
  </MotionWrapper>
);

// 6. Stagger Container
export const StaggerContainer = ({ 
  children, 
  staggerDelay = 0.1,
  className = ""
}: { 
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1
      }
    }
  };

  return (
    <MotionWrapper
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </MotionWrapper>
  );
};

// 7. Stagger Item
export const StaggerItem = ({ 
  children, 
  className = ""
}: { 
  children: React.ReactNode;
  className?: string;
}) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.25, 0.25, 0.75]
      }
    }
  };

  return (
    <MotionWrapper
      variants={itemVariants}
      className={className}
    >
      {children}
    </MotionWrapper>
  );
};

// 8. Loading States
export const SkeletonLoader = ({ 
  width = "100%", 
  height = "20px",
  className = ""
}: { 
  width?: string;
  height?: string;
  className?: string;
}) => (
  <motion.div
    className={`bg-gray-200 rounded ${className}`}
    style={{ width, height }}
    animate={{
      opacity: [0.5, 1, 0.5]
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

// 9. Pulse Animation
export const Pulse = ({ 
  children, 
  duration = 2,
  className = ""
}: { 
  children: React.ReactNode;
  duration?: number;
  className?: string;
}) => (
  <motion.div
    className={className}
    animate={{
      scale: [1, 1.05, 1]
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    {children}
  </motion.div>
);

// 10. Bounce Animation
export const Bounce = ({ 
  children, 
  className = ""
}: { 
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    className={className}
    animate={{
      y: [0, -10, 0]
    }}
    transition={{
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    {children}
  </motion.div>
);
