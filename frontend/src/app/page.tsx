'use client';

import React, { useState, useEffect, useCallback } from 'react';
import FileUpload from '@/components/FileUpload';
import { FiArrowUp, FiChevronDown, FiImage, FiMusic } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function Home() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showMoreComing, setShowMoreComing] = useState(false);
  const [isGalloping, setIsGalloping] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cursorScale, setCursorScale] = useState(1);

  // Ultra-optimized mouse trail effect
  useEffect(() => {
    let prevTime = performance.now();
    let rafId: number;

    const updateMousePosition = (e: MouseEvent) => {
      const currentTime = performance.now();
      if (currentTime - prevTime < 8) return; // Throttle to ~120fps for smoother performance
      
      prevTime = currentTime;
      setMousePos({ x: e.clientX, y: e.clientY });
      
      // Direct DOM manipulation for immediate response
      const root = document.documentElement;
      root.style.setProperty('--mouse-x', `${e.clientX}px`);
      root.style.setProperty('--mouse-y', `${e.clientY}px`);
    };

    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => updateMousePosition(e));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true, capture: true });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Optimized interactive elements cursor effect with debounce
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    
    const handleMouseEnter = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => setCursorScale(1.5), 16);
    };
    
    const handleMouseLeave = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => setCursorScale(1), 16);
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          document.querySelectorAll('button, a, input, .interactive').forEach(element => {
            element.addEventListener('mouseenter', handleMouseEnter, { passive: true });
            element.addEventListener('mouseleave', handleMouseLeave, { passive: true });
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    document.querySelectorAll('button, a, input, .interactive').forEach(element => {
      element.addEventListener('mouseenter', handleMouseEnter, { passive: true });
      element.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    });

    return () => {
      clearTimeout(debounceTimer);
      observer.disconnect();
      document.querySelectorAll('button, a, input, .interactive').forEach(element => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);

  // Scroll effects
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      setShowScrollTop(scrollY > windowHeight * 0.3);
      setShowMoreComing(scrollY + windowHeight > documentHeight - 300);

      // Parallax effect for background elements
      document.querySelector('.bg-tech-grid')?.setAttribute(
        'style',
        `transform: perspective(1000px) rotateX(60deg) scale(2) translateY(${scrollY * 0.1}px)`
      );
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    setIsGalloping(true);
    const audio = new Audio('/horse-neigh.mp3');
    audio.play().catch(console.log);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setIsGalloping(false), 800);
  }, []);

  const handleUploadComplete = (files: any[]) => {
    console.log('Upload complete:', files);
  };

  return (
    <main className="min-h-screen w-full relative overflow-x-hidden">
      {/* Enhanced background layers */}
      <div className="bg-pattern" />
      <div className="bg-gradient" />
      <div className="bg-tech-grid" />
      <div className="particles" />

      {/* Ultra-optimized mouse trail */}
      <motion.div
        className="mouse-trail"
        animate={{
          x: mousePos.x,
          y: mousePos.y,
          scale: cursorScale
        }}
        transition={{
          duration: 0,
          ease: "linear"
        }}
      />

      {/* School emblem with enhanced effects */}
      <motion.a
        href="https://www.loyola.edu/about"
        target="_blank"
        rel="noopener noreferrer"
        className="school-emblem glass-panel block cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Image
          src="/emblem.png"
          alt="Loyola University Maryland"
          width={160}
          height={160}
          priority
          className="relative z-10 transition-transform duration-300 group-hover:brightness-110"
        />
      </motion.a>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-content text-center mb-12 -mt-16"
        >
          <motion.h1
            className="text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Audio & Image Converter
          </motion.h1>
          <motion.p
            className="text-xl max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Transform your media with precision and elegance. Our advanced conversion tools 
            deliver exceptional quality for both audio and image files.
          </motion.p>
          <motion.p
            className="text-loyola-green mt-2 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            @KyluAI
          </motion.p>
        </motion.div>

        {/* Enhanced dropdown hint */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="dropdown-hint glass-panel p-4 mb-8"
        >
          <span>Choose your output format below</span>
          <motion.div
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <FiChevronDown className="text-loyola-green" />
          </motion.div>
        </motion.div>

        {/* File upload component */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          <FileUpload onUploadComplete={handleUploadComplete} />
        </motion.div>

        {/* Format Information with enhanced styling */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="glass-panel mt-16 p-8"
        >
          <h3 className="text-2xl font-bold text-loyola-green mb-8">Supported Formats</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              className="format-column glass-panel p-6"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="format-title">
                <FiImage className="text-loyola-green" />
                <span>Images</span>
              </div>
              <p className="format-list">
                JPEG · PNG · GIF · WebP · BMP · TIFF · SVG · PSD
              </p>
            </motion.div>
            <motion.div
              className="format-column glass-panel p-6"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="format-title">
                <FiMusic className="text-loyola-green" />
                <span>Audio</span>
              </div>
              <p className="format-list">
                MP3 · WAV · OGG · M4A · AAC · FLAC
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced "More Coming Soon" section */}
      <div className="min-h-[300px]" />
      
      <AnimatePresence>
        {showMoreComing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel w-full py-16"
          >
            <div className="text-center">
              <motion.h2
                className="text-2xl font-bold text-loyola-green mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                More Coming Soon
              </motion.h2>
              <motion.p
                className="text-loyola-grey mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Stay tuned for exciting new features and enhancements
              </motion.p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToTop}
                className={`btn-primary ${isGalloping ? 'gallop-animation' : ''}`}
              >
                <FiArrowUp className="w-5 h-5 mr-2 inline-block" />
                <span>Return to Top</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
