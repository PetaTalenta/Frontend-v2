'use client';

import { useSpring, animated, useTrail, useInView } from '@react-spring/web';
import { useState, useRef } from 'react';

// 1. Simple Hover Animation
export const SpringButton = ({ 
  children, 
  onClick 
}: { 
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const springs = useSpring({
    scale: isHovered ? 1.05 : 1,
    boxShadow: isHovered 
      ? '0 10px 25px rgba(0, 0, 0, 0.15)' 
      : '0 2px 10px rgba(0, 0, 0, 0.1)',
    config: { tension: 300, friction: 10 }
  });

  return (
    <animated.button
      style={springs}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium"
    >
      {children}
    </animated.button>
  );
};

// 2. Trail Animation untuk List
export const SpringTrail = ({ items }: { items: string[] }) => {
  const trail = useTrail(items.length, {
    from: { opacity: 0, transform: 'translate3d(0,40px,0)' },
    to: { opacity: 1, transform: 'translate3d(0,0px,0)' },
    config: { tension: 280, friction: 60 }
  });

  return (
    <div className="space-y-4">
      {trail.map((style, index) => (
        <animated.div
          key={index}
          style={style}
          className="p-4 bg-white rounded-lg shadow-sm border"
        >
          {items[index]}
        </animated.div>
      ))}
    </div>
  );
};

// 3. Scroll-triggered Animation
export const SpringScrollReveal = ({ 
  children 
}: { 
  children: React.ReactNode 
}) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const springs = useSpring({
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0px)' : 'translateY(50px)',
    config: { tension: 280, friction: 60 }
  });

  return (
    <animated.div ref={ref} style={springs}>
      {children}
    </animated.div>
  );
};

// 4. Number Counter Animation
export const AnimatedCounter = ({ 
  value, 
  duration = 1000 
}: { 
  value: number;
  duration?: number;
}) => {
  const { number } = useSpring({
    from: { number: 0 },
    to: { number: value },
    config: { duration }
  });

  return (
    <animated.span>
      {number.to(n => Math.floor(n).toLocaleString())}
    </animated.span>
  );
};
