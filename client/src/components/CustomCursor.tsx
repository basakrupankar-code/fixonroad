import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Exact pointer coordinates
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Fast tracking spring for inner dot
  const dotX = useSpring(mouseX, { stiffness: 1500, damping: 50 });
  const dotY = useSpring(mouseY, { stiffness: 1500, damping: 50 });

  // Smooth, fluid trailing spring for outer ring
  const ringX = useSpring(mouseX, { stiffness: 320, damping: 28 });
  const ringY = useSpring(mouseY, { stiffness: 320, damping: 28 });

  useEffect(() => {
    // 1. Detect touch/mobile devices with coarse pointer
    const checkTouch = () => {
      const isCoarse = window.matchMedia('(pointer: coarse)').matches;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(isCoarse || hasTouch);
    };

    checkTouch();
    window.addEventListener('resize', checkTouch);

    // 2. Track pointer movements
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    // 3. Detect hover over clickable or interactive elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const clickable = target.closest(
        'a, button, input, textarea, select, [role="button"], .cursor-pointer, .interactive, [data-cursor-hover], .glass-panel'
      );
      setIsHovered(!!clickable);
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);

    // 4. Handle viewport boundaries
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('resize', checkTouch);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible, mouseX, mouseY]);

  // Completely omit on mobile/touch interfaces to respect touch ergonomics
  if (isTouchDevice) {
    return null;
  }

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* Outer Fluid Trailing Ring */}
      <motion.div
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isClicked ? 1.2 : isHovered ? 1.6 : 1,
          borderColor: isHovered ? 'rgba(251, 146, 60, 0.9)' : 'rgba(249, 115, 22, 0.45)',
          backgroundColor: isHovered ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.08)',
          boxShadow: isHovered 
            ? '0 0 25px rgba(249, 115, 22, 0.45)' 
            : '0 0 10px rgba(249, 115, 22, 0.15)',
        }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-9 h-9 rounded-full border pointer-events-none fixed top-0 left-0 z-[9998] backdrop-blur-[0.5px]"
      />

      {/* Inner Fast Snapping Dot */}
      <motion.div
        style={{
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isClicked ? 0.6 : isHovered ? 1.35 : 1,
          opacity: isHovered ? 0.9 : 1,
        }}
        transition={{ duration: 0.12 }}
        className="w-2 h-2 rounded-full bg-orange-500 pointer-events-none fixed top-0 left-0 z-[9999] shadow-[0_0_8px_#f97316]"
      />
    </div>
  );
}
