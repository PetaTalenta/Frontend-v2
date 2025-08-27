'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TestAnimation } from '../../components/animations/TestAnimation';
import { AnimatedButton, AnimatedCard, StaggeredList, ScrollReveal } from '../../components/animations/FramerMotionExamples';
import { FadeInUp, ScaleIn, StaggerContainer, StaggerItem } from '../../components/animations/AnimationUtils';

export default function AnimationTestPage() {
  const [showModal, setShowModal] = useState(false);
  const [counter, setCounter] = useState(0);

  const listItems = [
    'Item pertama dengan animasi stagger',
    'Item kedua muncul setelah delay',
    'Item ketiga melengkapi sequence',
    'Item keempat sebagai penutup'
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <FadeInUp>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎨 Animation Test Page
            </h1>
            <p className="text-lg text-gray-600">
              Testing Framer Motion animations for performance and user experience
            </p>
          </div>
        </FadeInUp>

        {/* Test Component */}
        <ScaleIn delay={0.2}>
          <TestAnimation />
        </ScaleIn>

        {/* Animated Buttons */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Animated Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <AnimatedButton 
              onClick={() => setCounter(counter + 1)}
              variant="primary"
            >
              Click Me! ({counter})
            </AnimatedButton>
            
            <AnimatedButton 
              onClick={() => setShowModal(true)}
              variant="secondary"
            >
              Open Modal
            </AnimatedButton>
          </div>
        </div>

        {/* Staggered List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Staggered Animation</h2>
          <StaggerContainer staggerDelay={0.15}>
            {listItems.map((item, index) => (
              <StaggerItem key={index}>
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                  {item}
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* Animated Cards */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Hover Effects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((num) => (
              <AnimatedCard key={num}>
                <h3 className="text-lg font-semibold mb-2">Card {num}</h3>
                <p className="text-gray-600">
                  Hover over this card to see the smooth animation effect.
                  The card will lift and scale slightly.
                </p>
              </AnimatedCard>
            ))}
          </div>
        </div>

        {/* Scroll Reveal */}
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold text-gray-800">Scroll Reveal</h2>
          
          <ScrollReveal direction="up" delay={0}>
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-xl font-semibold text-blue-800 mb-2">
                This appears from bottom
              </h3>
              <p className="text-blue-600">
                This content animates in when you scroll to it using Intersection Observer.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="left" delay={0.2}>
            <div className="p-6 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                This slides from left
              </h3>
              <p className="text-green-600">
                Different direction and delay for variety in the animation sequence.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={0.4}>
            <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="text-xl font-semibold text-purple-800 mb-2">
                This slides from right
              </h3>
              <p className="text-purple-600">
                Each element can have its own animation direction and timing.
              </p>
            </div>
          </ScrollReveal>
        </div>

        {/* Performance Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="p-6 bg-yellow-50 rounded-lg border border-yellow-200"
        >
          <h3 className="text-xl font-semibold text-yellow-800 mb-2">
            ⚡ Performance Notes
          </h3>
          <ul className="text-yellow-700 space-y-1">
            <li>• All animations use GPU-accelerated properties (transform, opacity)</li>
            <li>• Scroll animations use Intersection Observer (not scroll events)</li>
            <li>• Animations respect prefers-reduced-motion setting</li>
            <li>• Optimized for 60fps performance</li>
          </ul>
        </motion.div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            >
              <motion.div
                className="bg-white rounded-lg p-6 max-w-md w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold mb-4">Animated Modal</h3>
                <p className="text-gray-600 mb-4">
                  This modal appears with a smooth scale and fade animation.
                  It uses AnimatePresence for proper exit animations.
                </p>
                <AnimatedButton onClick={() => setShowModal(false)}>
                  Close Modal
                </AnimatedButton>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
