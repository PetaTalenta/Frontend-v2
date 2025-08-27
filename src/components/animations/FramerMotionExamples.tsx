'use client';

import { motion, AnimatePresence, useInView, useAnimation } from 'framer-motion';
import { useRef, useEffect } from 'react';

// 1. Staggered Animation untuk List Items
export const StaggeredList = ({ items }: { items: string[] }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {items.map((item, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          className="p-4 bg-white rounded-lg shadow-sm border"
          whileHover={{ 
            scale: 1.02,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.98 }}
        >
          {item}
        </motion.div>
      ))}
    </motion.div>
  );
};

// 2. Micro-interaction Button dengan Hover Effects
export const AnimatedButton = ({ 
  children, 
  onClick, 
  variant = 'primary' 
}: { 
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={`
        px-6 py-3 rounded-lg font-medium relative overflow-hidden
        ${variant === 'primary' 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 text-gray-800'
        }
      `}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ scale: 0, opacity: 0 }}
        whileHover={{ 
          scale: 1, 
          opacity: 0.1,
          transition: { duration: 0.3 }
        }}
        style={{ borderRadius: 'inherit' }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

// 3. Scroll-triggered Animation dengan Intersection Observer
export const ScrollReveal = ({ 
  children, 
  direction = 'up',
  delay = 0 
}: { 
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: true, 
    margin: "-100px 0px" 
  });

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0,
      x: direction === 'left' ? 50 : direction === 'right' ? -50 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.6,
        delay,
        ease: [0.25, 0.25, 0.25, 0.75]
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
};

// 4. Card dengan Hover Animation
export const AnimatedCard = ({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      className={`
        bg-white rounded-xl shadow-sm border p-6 cursor-pointer
        ${className}
      `}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
};

// 5. Loading Spinner dengan Framer Motion
export const LoadingSpinner = () => {
  return (
    <motion.div
      className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
};

// 6. Page Transition Wrapper
export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.25, 0.25, 0.75]
      }}
    >
      {children}
    </motion.div>
  );
};

// 7. Shared Layout Animation Example
export const SharedLayoutExample = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const items = [
    { id: '1', title: 'Item 1', content: 'Content for item 1' },
    { id: '2', title: 'Item 2', content: 'Content for item 2' },
    { id: '3', title: 'Item 3', content: 'Content for item 3' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {items.map(item => (
        <motion.div
          key={item.id}
          layoutId={item.id}
          onClick={() => setSelectedId(item.id)}
          className="bg-white rounded-lg p-4 cursor-pointer shadow-sm border"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.h3 layoutId={`title-${item.id}`} className="font-semibold">
            {item.title}
          </motion.h3>
          <motion.p layoutId={`content-${item.id}`} className="text-gray-600 text-sm">
            {item.content}
          </motion.p>
        </motion.div>
      ))}

      <AnimatePresence>
        {selectedId && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              layoutId={selectedId}
              className="bg-white rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {items.find(item => item.id === selectedId) && (
                <>
                  <motion.h3
                    layoutId={`title-${selectedId}`}
                    className="font-semibold text-xl mb-4"
                  >
                    {items.find(item => item.id === selectedId)?.title}
                  </motion.h3>
                  <motion.p
                    layoutId={`content-${selectedId}`}
                    className="text-gray-600 mb-4"
                  >
                    {items.find(item => item.id === selectedId)?.content}
                  </motion.p>
                  <motion.button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    onClick={() => setSelectedId(null)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Close
                  </motion.button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
