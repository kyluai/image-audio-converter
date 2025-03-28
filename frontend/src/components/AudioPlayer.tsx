import React from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiPause } from 'react-icons/fi';

interface AudioPlayerProps {
  src: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onTimeUpdate: (time: number) => void;
  audioRef: (element: HTMLAudioElement) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onTimeUpdate,
  audioRef,
}) => {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = (currentTime / duration) * 100;

  return (
    <div className="audio-player">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
      />

      {/* Modern waveform-inspired progress bar */}
      <div className="relative w-full h-12 mb-4">
        <div className="absolute inset-0 bg-slate-700/50 rounded-lg overflow-hidden backdrop-blur-sm">
          {/* Frequency visualization bars */}
          <div className="absolute inset-0 flex items-center">
            {[...Array(32)].map((_, i) => (
              <motion.div
                key={i}
                className="flex-1 mx-px"
                animate={{
                  height: isPlaying ? ['40%', '80%', '60%', '90%', '40%'][i % 5] : '40%',
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.05,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
                style={{
                  backgroundColor: i <= (progress / 100) * 32 
                    ? 'rgba(56, 189, 248, 0.5)' 
                    : 'rgba(56, 189, 248, 0.1)',
                }}
              />
            ))}
          </div>
          
          {/* Progress indicator */}
          <motion.div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-sky-500/20 to-sky-400/40"
            style={{ width: `${progress}%` }}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-sky-400">
              <motion.div
                className="absolute top-0 w-1 h-1 -right-0.5 rounded-full bg-sky-400"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute bottom-0 w-1 h-1 -right-0.5 rounded-full bg-sky-400"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Interactive slider */}
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime || 0}
          onChange={(e) => onTimeUpdate(parseFloat(e.target.value))}
          className="audio-slider"
          style={{ '--progress': `${progress}%` } as React.CSSProperties}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPlay}
          className="audio-control relative overflow-hidden group"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <motion.div
            className="relative z-10 flex items-center justify-center w-full h-full"
            animate={{
              scale: isPlaying ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 2,
              repeat: isPlaying ? Infinity : 0,
              ease: "easeInOut",
            }}
          >
            {isPlaying ? (
              <FiPause className="w-5 h-5 text-white" />
            ) : (
              <FiPlay className="w-5 h-5 ml-0.5 text-white" />
            )}
          </motion.div>
        </motion.button>

        {/* Time display */}
        <div className="audio-time flex items-center space-x-2">
          <span className="text-loyola-green-70">{formatTime(currentTime)}</span>
          <span className="text-loyola-green-70">/</span>
          <span className="text-loyola-green-70">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer; 