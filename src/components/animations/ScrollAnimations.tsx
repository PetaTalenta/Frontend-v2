'use client';

import { motion } from 'framer-motion';
import { useScrollAnimation, useStaggeredScrollAnimation, useScrollProgress } from '../../hooks/useScrollAnimation';

// 1. Basic Scroll Reveal Component
export const ScrollReveal = ({ 
  children, 
  direction = 'up',
  delay = 0,
  className = ""
}: { 
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  className?: string;
}) => {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
    triggerOnce: true,
    delay
  });

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0,
      x: direction === 'left' ? 50 : direction === 'right' ? -50 : 0,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.25, 0.25, 0.75]
      }
    }
  };

  return (
    <motion.div
      ref={elementRef}
      variants={variants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 2. Staggered List Animation
export const StaggeredScrollList = ({ 
  items,
  className = ""
}: { 
  items: React.ReactNode[];
  className?: string;
}) => {
  const { containerRef, visibleItems } = useStaggeredScrollAnimation(items.length, {
    threshold: 0.1,
    staggerDelay: 150,
    triggerOnce: true
  });

  return (
    <div ref={containerRef} className={`space-y-4 ${className}`}>
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={visibleItems[index] ? {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              duration: 0.5,
              ease: [0.25, 0.25, 0.25, 0.75]
            }
          } : {}}
          className="transform-gpu"
        >
          {item}
        </motion.div>
      ))}
    </div>
  );
};

// 3. Scroll Progress Indicator
export const ScrollProgressBar = ({ className = "" }: { className?: string }) => {
  const progress = useScrollProgress();

  return (
    <motion.div
      className={`fixed top-0 left-0 h-1 bg-blue-600 z-50 ${className}`}
      style={{
        width: `${progress}%`,
        transformOrigin: '0%'
      }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.1 }}
    />
  );
};

// 4. Counter Animation on Scroll
export const ScrollCounter = ({ 
  end, 
  duration = 2000,
  prefix = "",
  suffix = "",
  className = ""
}: { 
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) => {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.5,
    triggerOnce: true
  });

  return (
    <div ref={elementRef} className={className}>
      <motion.span
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
      >
        {prefix}
        <motion.span
          initial={{ textContent: "0" }}
          animate={isVisible ? { textContent: end.toString() } : {}}
          transition={{
            duration: duration / 1000,
            ease: "easeOut"
          }}
          onUpdate={(latest) => {
            if (elementRef.current) {
              const currentValue = Math.floor(latest.textContent as number);
              elementRef.current.textContent = `${prefix}${currentValue.toLocaleString()}${suffix}`;
            }
          }}
        />
        {suffix}
      </motion.span>
    </div>
  );
};

// 5. Image Reveal Animation
export const ImageReveal = ({ 
  src, 
  alt, 
  className = "",
  overlayColor = "bg-gray-900"
}: { 
  src: string;
  alt: string;
  className?: string;
  overlayColor?: string;
}) => {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.3,
    triggerOnce: true
  });

  return (
    <div ref={elementRef} className={`relative overflow-hidden ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        initial={{ scale: 1.2 }}
        animate={isVisible ? { scale: 1 } : {}}
        transition={{ duration: 1, ease: [0.25, 0.25, 0.25, 0.75] }}
      />
      <motion.div
        className={`absolute inset-0 ${overlayColor}`}
        initial={{ x: "0%" }}
        animate={isVisible ? { x: "100%" } : {}}
        transition={{ duration: 0.8, ease: [0.25, 0.25, 0.25, 0.75] }}
      />
    </div>
  );
};

// 6. Text Reveal Animation
export const TextReveal = ({ 
  children, 
  className = "",
  delay = 0
}: { 
  children: string;
  className?: string;
  delay?: number;
}) => {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.5,
    triggerOnce: true,
    delay
  });

  const words = children.split(' ');

  return (
    <div ref={elementRef} className={className}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          className="inline-block mr-2"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.5,
              delay: index * 0.1,
              ease: [0.25, 0.25, 0.25, 0.75]
            }
          } : {}}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};
