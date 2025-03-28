/**
 * FileUpload Component
 * 
 * A modern file upload and conversion component that supports both image and audio formats.
 * Features drag-and-drop functionality, live previews, and progress tracking.
 * 
 * @component
 * @author Your Name
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiCheck, FiAlertCircle, FiLoader, FiPlay, FiPause, FiVolume2, FiTrash2, FiMessageCircle, FiMail, FiX } from 'react-icons/fi';
import { formatBytes } from '../utils/format';
import { FileWithPreview } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import AudioPlayer from './AudioPlayer';
import SoundEffects from '../utils/sounds';

// Motion components for better code organization
const MotionDiv = motion.div;
const MotionButton = motion.button;
const MotionSvg = motion.svg;
const MotionCircle = motion.circle;
const MotionPath = motion.path;

/**
 * Custom loader component with Da Vinci-inspired design
 * Provides visual feedback during loading states
 */
const DaVinciLoader = () => (
  <motion.svg
    width="120"
    height="120"
    viewBox="0 0 100 100"
    className="text-gold-dark"
    initial={{ opacity: 0 }}
    animate={{ 
      opacity: [0.4, 1, 0.4],
      rotate: 360
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <motion.circle
      cx="50"
      cy="50"
      r="45"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeDasharray="6 4"
    />
    <motion.path
      d="M50 5 L50 95 M5 50 L95 50"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
    <motion.circle
      cx="50"
      cy="50"
      r="30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    />
  </motion.svg>
);

/**
 * Animation variants for page transitions
 * Uses custom easing for smooth animations
 */
const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    }
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -20,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    }
  }
};

/**
 * Animation variants for tech grid elements
 * Implements staggered animation for child elements
 */
const techGridVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1,
    }
  }
};

/**
 * Custom loading animation component
 * Provides visual feedback during file processing
 */
const TechLoader = () => (
  <motion.div
    className="relative w-32 h-32"
    initial={{ opacity: 0 }}
    animate={{ 
      opacity: 1,
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "linear"
    }}
  >
    <motion.div
      className="absolute inset-0 border-2 border-sky-400 rounded-lg"
      animate={{ 
        rotate: 360,
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.6, 0.3]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "linear"
      }}
    />
    <motion.div
      className="absolute inset-2 border border-sky-500 rounded-lg"
      animate={{ 
        rotate: -360,
        scale: [1.1, 1, 1.1],
        opacity: [0.5, 0.8, 0.5]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "linear"
      }}
    />
    <motion.div
      className="absolute inset-4 bg-sky-500/10 rounded-lg"
      animate={{ 
        rotate: 180,
        scale: [0.9, 1.2, 0.9],
        opacity: [0.2, 0.4, 0.2]
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  </motion.div>
);

// Type definitions for component props and state
interface FormatInfo {
  input: {
    mimeTypes: string[];
    extensions: string[];
  };
  output: {
    formats: string[];
  };
}

interface ConversionOptions {
  quality?: number;
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
  // Audio conversion options
  bitrate?: string;
  sampleRate?: number;
  channels?: number;
  // Video conversion options
  videoCodec?: string;
  videoBitrate?: string;
  fps?: number;
  audioCodec?: string;
  audioBitrate?: string;
}

interface FileUploadProps {
  onUploadComplete: (files: FileWithPreview[]) => void;
}

interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

/**
 * Main FileUpload component
 * Handles file uploads, format conversion, and download functionality
 * 
 * @param {FileUploadProps} props - Component props
 * @returns {JSX.Element} Rendered component
 */
const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  // State management
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [formats, setFormats] = useState<FormatInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [convertedImages, setConvertedImages] = useState<{ url: string; filename: string }[]>([]);
  
  // Conversion options
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>({
    quality: 80,
    maintainAspectRatio: true,
    // Default audio options
    bitrate: '128k',
    sampleRate: 44100,
    channels: 2,
    // Default video options
    videoCodec: 'h264',
    videoBitrate: '1M',
    fps: 30,
    audioCodec: 'aac',
    audioBitrate: '128k'
  });

  // Preview options
  const [previewSize, setPreviewSize] = useState<'small' | 'medium' | 'large'>('medium');

  const abortControllerRef = useRef<AbortController | null>(null);
  const [audioPlayers, setAudioPlayers] = useState<{ [key: number]: AudioPlayerState }>({});
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement }>({});

  // Constants
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Add new state for media type
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'audio' | null>(null);

  /**
   * Fetches available conversion formats from the backend
   * Sets up cleanup for file previews and ongoing conversions
   */
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchFormats = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/formats', {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setFormats(data);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching formats:', error);
          setMessage('Error loading formats. Please refresh the page.');
        }
      }
    };

    fetchFormats();

    return () => {
      controller.abort();
      // Cleanup any ongoing conversions
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      // Cleanup file previews
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  /**
   * Handles file drop events
   * Creates preview URLs and updates file state
   */
  const onDrop = (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
      isAudio: file.type.startsWith('audio/')
    }));
    setFiles(prev => [...prev, ...newFiles]);
    onUploadComplete(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff', '.svg', '.psd'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac']
    },
    multiple: true
  });

  const openPreview = (previewUrl: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  const getFileType = (file: File): 'image' | 'audio' | 'video' | 'unknown' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    return 'unknown';
  };

  const validateFileType = (file: File, selectedFormat: string): boolean => {
    const fileType = getFileType(file);
    const imageFormats = ['jpeg', 'png', 'webp', 'gif', 'tiff'];
    const audioFormats = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
    const videoFormats = ['mp4', 'webm', 'mov', 'avi', 'mkv'];

    switch (fileType) {
      case 'image':
        return imageFormats.includes(selectedFormat);
      case 'audio':
        return audioFormats.includes(selectedFormat);
      case 'video':
        return videoFormats.includes(selectedFormat);
      default:
        return false;
    }
  };

  const getEndpoint = (file: File): string => {
    const fileType = getFileType(file);
    switch (fileType) {
      case 'image':
        return '/api/convert';
      case 'audio':
        return '/api/convert-audio';
      case 'video':
        return '/api/convert-video';
      default:
        throw new Error('Unsupported file type');
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setMessage('Please upload files first');
      return;
    }

    if (!selectedFormat) {
      setMessage('Please select a format first');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const updatedFiles = [...files];

      for (let i = 0; i < updatedFiles.length; i++) {
        const file = updatedFiles[i];
        
        try {
          setMessage(`Converting ${file.file.name}...`);
          updatedFiles[i] = { ...file, status: 'converting' as const };
          setFiles([...updatedFiles]);

          const formData = new FormData();
          formData.append('file', file.file);
          formData.append('format', selectedFormat);
          formData.append('options', JSON.stringify(conversionOptions));

          const endpoint = file.isAudio ? '/api/convert-audio' : '/api/convert';
          const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Conversion failed: ${response.statusText}`);
          }

          const data = await response.json();
          console.log('Conversion response:', data);

          // Create download URL and trigger download
          const downloadUrl = `${BACKEND_URL}${data.converted.path}`;
          
          // Fetch the converted file and download it
          const fileResponse = await fetch(downloadUrl);
          const blob = await fileResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = data.converted.filename || `converted-${file.file.name}.${selectedFormat}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          updatedFiles[i] = {
            ...file,
            status: 'done' as const,
            convertedUrl: downloadUrl,
            convertedFilename: data.converted.filename
          };
          setFiles([...updatedFiles]);
          setMessage(`Successfully converted ${file.file.name}! Downloading...`);
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setMessage('');
          }, 3000);
        } catch (error) {
          console.error('Error converting file:', error);
          const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
          updatedFiles[i] = { ...file, status: 'error' as const, error: errorMessage };
          setFiles([...updatedFiles]);
          setMessage(`Error converting ${file.file.name}: ${errorMessage}`);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const cancelConversion = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setUploading(false);
      abortControllerRef.current = null;
    }
  };

  const handleDownloadAll = () => {
    files.forEach(file => {
      if (file.status === 'done' && file.convertedUrl) {
        handleDownload(file);
      }
    });
  };

  const getPreviewSize = () => {
    switch (previewSize) {
      case 'small': return 'h-32';
      case 'large': return 'h-96';
      default: return 'h-64';
    }
  };

  const handleAudioPlay = (index: number) => {
    const audio = audioRefs.current[index];
    if (audio) {
      if (audioPlayers[index]?.isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setAudioPlayers(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          isPlaying: !prev[index]?.isPlaying
        }
      }));
    }
  };

  const handleAudioTimeUpdate = (index: number) => {
    const audio = audioRefs.current[index];
    if (audio) {
      setAudioPlayers(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          currentTime: audio.currentTime,
          duration: audio.duration
        }
      }));
    }
  };

  const handleAudioVolumeChange = (index: number, volume: number) => {
    const audio = audioRefs.current[index];
    if (audio) {
      audio.volume = volume;
      setAudioPlayers(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          volume
        }
      }));
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = (file: FileWithPreview) => {
    if (!file.convertedUrl) return;
    
    // Fetch the file and trigger download
    fetch(file.convertedUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.convertedFilename || 'converted-file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error downloading file:', error);
        setMessage('Error downloading file. Please try again.');
      });
  };

  const clearFiles = () => {
    // Cleanup preview URLs
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setMessage('All files cleared');
  };

  const removeFile = (index: number) => {
    console.log('Removing file at index:', index);
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

  return (
    <MotionDiv 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-7xl mx-auto space-y-8 p-8"
    >
      {/* Media Type Tabs */}
      <div className="space-y-6">
        <div className="flex gap-4 border-b border-gray-700">
          <button
            onClick={() => setSelectedMediaType('image')}
            className={`px-6 py-3 text-lg font-medium transition-all relative
              ${selectedMediaType === 'image' 
                ? 'text-white' 
                : 'text-gray-400 hover:text-gray-200'}`}
          >
            <span className="flex items-center gap-2">
              <span>🖼️</span>
              Image Conversion
            </span>
            {selectedMediaType === 'image' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-loyola-green"
              />
            )}
          </button>
          <button
            onClick={() => setSelectedMediaType('audio')}
            className={`px-6 py-3 text-lg font-medium transition-all relative
              ${selectedMediaType === 'audio' 
                ? 'text-white' 
                : 'text-gray-400 hover:text-gray-200'}`}
          >
            <span className="flex items-center gap-2">
              <span>🎵</span>
              Audio Conversion
            </span>
            {selectedMediaType === 'audio' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-loyola-green"
              />
            )}
          </button>
        </div>

        {/* Format Selection with Conversion Flow */}
        <AnimatePresence mode="wait">
          {selectedMediaType && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-800/50 rounded-lg backdrop-blur-sm p-6"
            >
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-2">Input Format</p>
                  <div className="px-4 py-2 bg-gray-700 rounded-lg">
                    {selectedMediaType === 'image' ? '*.png, *.jpg, *.jpeg' : '*.mp3, *.wav'}
                  </div>
                </div>
                
                <div className="flex items-center text-loyola-green text-2xl">
                  ⟶
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-2">Output Format</p>
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-white/20 
                             focus:outline-none focus:border-white/40 transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Format</option>
                    {selectedMediaType === 'image' ? (
                      <>
                        <option value="jpeg">JPEG</option>
                        <option value="png">PNG</option>
                        <option value="webp">WebP</option>
                        <option value="gif">GIF</option>
                        <option value="tiff">TIFF</option>
                      </>
                    ) : (
                      <>
                        <option value="mp3">MP3</option>
                        <option value="wav">WAV</option>
                        <option value="ogg">OGG</option>
                        <option value="m4a">M4A</option>
                        <option value="aac">AAC</option>
                        <option value="flac">FLAC</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Area */}
      <div className="relative">
        <div {...getRootProps()}>
          <div 
            className={`relative flex flex-col items-center justify-center w-full h-64 
              border-2 border-dashed border-gray-300 dark:border-gray-600 
              rounded-lg transition-colors duration-150 ease-in-out
              ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:border-gray-400 dark:hover:border-gray-500'}
              ${files.length > 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
          >
            <input {...getInputProps()} />
            {files.length === 0 && (
              <div className="flex flex-col items-center space-y-2">
                <span className="text-4xl mb-2">📁</span>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Drop files here or click to select
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supported formats: PNG, JPG, MP3, WAV
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Security Footer */}
        <div className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1">
            <span>🔒</span>
            Files are processed securely and deleted after 1 hour.
          </span>
        </div>
      </div>

      {/* File Preview Section */}
      <AnimatePresence>
        {files.length > 0 && (
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-800/50 rounded-lg backdrop-blur-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">File Preview</h3>
              <button
                onClick={clearFiles}
                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg
                         transition-all duration-200 flex items-center gap-2"
              >
                <FiTrash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
              {files.map((file, index) => (
                <MotionDiv
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  className="relative bg-slate-800/80 rounded-lg overflow-hidden 
                           border border-loyola-green-30 group backdrop-blur-sm"
                >
                  <div className="aspect-square relative">
                    {file.isAudio ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <AudioPlayer
                          src={file.status === 'done' ? file.convertedUrl! : file.preview}
                          isPlaying={audioPlayers[index]?.isPlaying || false}
                          currentTime={audioPlayers[index]?.currentTime || 0}
                          duration={audioPlayers[index]?.duration || 0}
                          onPlay={() => handleAudioPlay(index)}
                          onTimeUpdate={(time) => {
                            const audio = audioRefs.current[index];
                            if (audio) {
                              audio.currentTime = time;
                              handleAudioTimeUpdate(index);
                            }
                          }}
                          audioRef={(el) => {
                            if (el) audioRefs.current[index] = el;
                          }}
                        />
                        {file.status === 'done' && (
                          <MotionButton
                            onClick={() => handleDownload(file)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn-download mt-4"
                          >
                            Download
                          </MotionButton>
                        )}
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="w-full h-full object-cover rounded-lg cursor-pointer"
                          onClick={(e) => openPreview(file.preview, e)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-loyola-green-30">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white truncate">{file.file.name}</p>
                        <p className="text-xs text-white/70">{formatBytes(file.file.size)}</p>
                      </div>
                      <div 
                        role="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const newFiles = files.filter((_, i) => i !== index);
                          setFiles(newFiles);
                        }}
                        className="cursor-pointer p-2 bg-red-500 hover:bg-red-600 
                                 text-white rounded-lg shadow-lg hover:shadow-xl 
                                 transition-all duration-200"
                        style={{ zIndex: 9999 }}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
                    {file.status === 'converting' && (
                      <MotionDiv 
                        className="h-full bg-loyola-green"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    {file.status === 'done' && (
                      <div className="h-full bg-emerald-500" />
                    )}
                    {file.status === 'error' && (
                      <div className="h-full bg-red-500" />
                    )}
                  </div>
                  <AnimatePresence>
                    {file.status === 'converting' && (
                      <MotionDiv
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
                      >
                        <MotionDiv
                          animate={{ 
                            rotate: 360,
                            scale: [1, 1.2, 1]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                          className="w-12 h-12 border-2 border-t-loyola-green border-r-loyola-green 
                                   border-b-transparent border-l-transparent rounded-full"
                        />
                      </MotionDiv>
                    )}
                  </AnimatePresence>
                </MotionDiv>
              ))}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Transform Button */}
      {files.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!selectedFormat || files.length === 0}
            className={`px-8 py-3 rounded-lg font-medium transition-all
                      ${selectedFormat && files.length > 0
                        ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                        : 'bg-gray-500/50 text-white/50 cursor-not-allowed'}`}
          >
            Transform Files
          </button>
        </div>
      )}

      {/* Loading overlay */}
      <AnimatePresence>
        {uploading && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <MotionDiv
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-slate-800/90 p-8 rounded-2xl shadow-2xl border border-loyola-green-30"
            >
              <TechLoader />
              <MotionDiv
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-loyola-green-70 text-lg"
              >
                Transforming files...
              </MotionDiv>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Message animation */}
      <AnimatePresence>
        {message && (
          <MotionDiv
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg backdrop-blur-md z-50 ${
              message.includes('Error')
                ? 'bg-red-500/90 text-white'
                : 'bg-emerald-500/90 text-white'
            }`}
          >
            {message}
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Contact Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 right-6 z-[9999]"
      >
        <a
          href="mailto:oluowolabiai@gmail.com"
          className="group relative flex items-center"
        >
          <motion.div
            initial={false}
            whileHover={{ width: '180px' }}
            className="absolute right-0 h-12 bg-loyola-green rounded-full shadow-lg 
                     overflow-hidden flex items-center justify-end w-12 
                     transition-all duration-300 hover:shadow-xl hover:bg-loyola-green/90"
          >
            <div className="flex items-center gap-2 absolute right-14 
                          opacity-0 group-hover:opacity-100 transition-all duration-300">
              <FiMail className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium whitespace-nowrap">
                Email Me
              </span>
            </div>
            <div className="min-w-[48px] h-12 flex items-center justify-center
                          bg-loyola-green text-white rounded-full">
              <FiMessageCircle className="w-6 h-6" />
            </div>
          </motion.div>
        </a>
      </motion.div>
    </MotionDiv>
  );
};

export default FileUpload;