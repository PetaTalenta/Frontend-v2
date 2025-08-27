'use client';

import { motion } from 'framer-motion';

// Simple test component to verify framer-motion is working
export const TestAnimation = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 bg-blue-100 rounded-lg border border-blue-200"
    >
      <h3 className="text-lg font-semibold text-blue-800">
        ✅ Framer Motion Test
      </h3>
      <p className="text-blue-600">
        If you can see this animated component, framer-motion is working correctly!
      </p>
    </motion.div>
  );
};

export default TestAnimation;
