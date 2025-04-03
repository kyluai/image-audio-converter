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
import { FiUpload, FiCheck, FiAlertCircle, FiLoader, FiPlay, FiPause, FiVolume2, FiTrash2, FiMessageCircle, FiMail, FiX, FiImage, FiMusic, FiChevronDown } from 'react-icons/fi';
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
  
  // Fetch supported formats from backend
  useEffect(() => {
    const fetchFormats = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/formats');
        if (!response.ok) {
          throw new Error('Failed to fetch formats');
        }
        const data = await response.json();
        setFormats({
          input: {
            mimeTypes: [...data.images.map((ext: string) => `image/${ext}`), ...data.audio.map((ext: string) => `audio/${ext}`)],
            extensions: [...data.images, ...data.audio]
          },
          output: {
            formats: [...data.images, ...data.audio]
          }
        });
      } catch (error) {
        console.error('Error fetching formats:', error);
        setMessage('Error loading formats. Please refresh the page.');
      }
    };

    fetchFormats();
  }, []);

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
    if (!file || !file.type) return 'unknown';
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    return 'unknown';
  };

  const validateFileType = (file: File, selectedFormat: string): boolean => {
    if (!file || !file.type) return false;
    
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
    if (!file || !file.type) return 'image'; // Default to image if file type is unknown
    const fileType = getFileType(file);
    return fileType === 'image' ? 'image' : 'audio';
  };

  const handleSubmit = async () => {
    if (!files.length || !selectedFormat) {
      setMessage('Please select files and a target format');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', files[0].file);
      formData.append('format', selectedFormat);

      const endpoint = getEndpoint(files[0].file);
      console.log(`Attempting to convert file: ${files[0].file.name} to ${selectedFormat} format`);
      console.log(`File type: ${files[0].file.type}, Size: ${formatBytes(files[0].file.size)}`);
      
      const response = await fetch(`http://localhost:3001/api/convert/${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Server response error:', response.status, errorData);
        throw new Error(`Conversion failed: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Conversion successful:', data);
      setMessage('Conversion successful!');
      
      // Add converted file to the list
      const convertedFile = {
        url: `http://localhost:3001/uploads/${data.convertedFile}`,
        filename: data.convertedFile
      };
      setConvertedImages(prev => [...prev, convertedFile]);
      
      // Automatically download the converted file
      downloadFile(convertedFile.url, convertedFile.filename);

      // Clear the files after successful conversion
      setFiles([]);
      setSelectedFormat('');
    } catch (error) {
      console.error('Conversion error:', error);
      setMessage(`Conversion failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setUploading(false);
    }
  };

  // Add a new function to handle file downloads
  const downloadFile = (url: string, filename: string) => {
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename; // Set the download attribute with the filename
    link.target = '_blank'; // Open in a new tab as fallback
    
    // Append to the document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`Downloading file: ${filename} from ${url}`);
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
      className="w-full max-w-7xl mx-auto space-y-6 p-6"
    >
      {/* Media Type Tabs - REDESIGNED */}
      <div className="flex justify-center gap-4">
        <motion.button
          onClick={() => setSelectedMediaType('image')}
          className={`px-8 py-3 rounded-xl font-medium transition-all relative
            flex items-center gap-3 shadow-lg
            ${selectedMediaType === 'image' 
              ? 'bg-loyola-green text-white' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <FiImage className="w-5 h-5" />
          <span>Image Conversion</span>
          {selectedMediaType === 'image' && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute -bottom-2 left-0 right-0 h-1 bg-white rounded-full"
            />
          )}
        </motion.button>
        
        <motion.button
          onClick={() => setSelectedMediaType('audio')}
          className={`px-8 py-3 rounded-xl font-medium transition-all relative
            flex items-center gap-3 shadow-lg
            ${selectedMediaType === 'audio' 
              ? 'bg-loyola-green text-white' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <FiMusic className="w-5 h-5" />
          <span>Audio Conversion</span>
          {selectedMediaType === 'audio' && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute -bottom-2 left-0 right-0 h-1 bg-white rounded-full"
            />
          )}
        </motion.button>
      </div>

      {/* Format Selection with Conversion Flow - REDESIGNED */}
      <AnimatePresence mode="wait">
        {selectedMediaType && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-800/50 rounded-xl backdrop-blur-sm p-6 shadow-xl border border-gray-700/50"
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="text-center flex-1">
                <p className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Input Format</p>
                <div className="px-6 py-3 bg-gray-700/70 rounded-lg border border-gray-600/50 shadow-inner">
                  {files.length > 0 
                    ? files[0].file.type.split('/')[1].toUpperCase()
                    : 'Upload a file to see format'}
                </div>
              </div>
              
              <div className="flex items-center text-loyola-green text-3xl">
                <motion.div
                  animate={{ 
                    x: [0, 5, 0],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  ⟶
                </motion.div>
              </div>

              <div className="text-center flex-1">
                <p className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Output Format</p>
                <div className="relative">
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="w-full px-6 py-3 bg-gray-700/70 text-white rounded-lg border border-gray-600/50 
                             focus:outline-none focus:border-loyola-green/50 focus:ring-2 focus:ring-loyola-green/30 
                             transition-all cursor-pointer appearance-none pr-10 shadow-inner"
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
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                    <FiChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Area - REDESIGNED */}
      <div className="relative">
        {files.length === 0 && (
          <div {...getRootProps()}>
            <motion.div 
              className={`relative flex flex-col items-center justify-center w-full h-64 
                border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out
                ${isDragActive 
                  ? 'border-loyola-green bg-loyola-green/10' 
                  : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/30'}
                ${files.length > 0 ? 'bg-gray-800/50' : ''}
                shadow-lg backdrop-blur-sm`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center space-y-3 p-6 text-center">
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-5xl mb-2"
                >
                  {selectedMediaType === 'image' ? '🖼️' : '🎵'}
                </motion.div>
                <h3 className="text-lg font-medium text-white">
                  {selectedMediaType === 'image' ? 'Upload Your Images' : 'Upload Your Audio Files'}
                </h3>
                <p className="text-gray-400 max-w-md">
                  Drag and drop your files here or click to browse
                </p>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Security Footer - REDESIGNED */}
        {files.length === 0 && (
          <div className="mt-3 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-800/50 border border-gray-700">
              🔒
            </span>
            <span>Files are processed securely and deleted after 1 hour</span>
          </div>
        )}
      </div>

      {/* File Preview Section - REDESIGNED */}
      <AnimatePresence>
        {files.length > 0 && (
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-800/50 rounded-xl backdrop-blur-sm p-6 shadow-xl border border-gray-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-loyola-green">📁</span> File Preview
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = selectedMediaType === 'image' 
                      ? 'image/*' 
                      : 'audio/*';
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.files && target.files.length > 0) {
                        const newFiles = Array.from(target.files).map(file => ({
                          file,
                          preview: URL.createObjectURL(file),
                          progress: 0,
                          status: 'pending' as const,
                          error: null,
                          isAudio: file.type.startsWith('audio/'),
                          convertedUrl: null,
                          convertedFilename: null
                        }));
                        setFiles(prev => [...prev, ...newFiles]);
                      }
                    };
                    input.click();
                  }}
                  className="px-3 py-1.5 bg-loyola-green hover:bg-loyola-green/90 text-white rounded-lg
                           transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg text-sm"
                >
                  <FiUpload className="w-4 h-4" />
                  Add More Files
                </button>
                <button
                  onClick={clearFiles}
                  className="px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg
                           transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg text-sm"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {files.map((file, index) => (
                <MotionDiv
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  className="relative bg-slate-800/80 rounded-xl overflow-hidden 
                           border border-loyola-green-30 group backdrop-blur-sm shadow-lg"
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
                            className="mt-3 px-3 py-1.5 bg-loyola-green text-white rounded-lg shadow-md hover:shadow-lg text-sm"
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
                          className="w-full h-full object-cover rounded-t-xl cursor-pointer"
                          onClick={(e) => openPreview(file.preview, e)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
                          <button 
                            onClick={(e) => openPreview(file.preview, e)}
                            className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg text-xs"
                          >
                            View Full Size
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-loyola-green-30">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{file.file.name}</p>
                        <p className="text-xs text-white/70">{formatBytes(file.file.size)}</p>
                      </div>
                      <div 
                        role="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="cursor-pointer p-1.5 bg-red-500/80 hover:bg-red-500 
                                 text-white rounded-lg shadow-md hover:shadow-lg 
                                 transition-all duration-200"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
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
                          className="w-10 h-10 border-2 border-t-loyola-green border-r-loyola-green 
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

      {/* Transform Button - REDESIGNED */}
      {files.length > 0 && (
        <div className="flex justify-center">
          <motion.button
            onClick={handleSubmit}
            disabled={!selectedFormat || files.length === 0}
            className={`px-8 py-3 rounded-xl font-medium transition-all shadow-lg
                      ${selectedFormat && files.length > 0
                        ? 'bg-loyola-green hover:bg-loyola-green/90 text-white cursor-pointer'
                        : 'bg-gray-700/50 text-white/50 cursor-not-allowed'}`}
            whileHover={selectedFormat && files.length > 0 ? { scale: 1.05 } : {}}
            whileTap={selectedFormat && files.length > 0 ? { scale: 0.95 } : {}}
          >
            <span className="flex items-center gap-2">
              <FiUpload className="w-5 h-5" />
              Transform Files
            </span>
          </motion.button>
        </div>
      )}

      {/* Loading overlay - REDESIGNED */}
      <AnimatePresence>
        {uploading && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-50"
          >
            <MotionDiv
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-slate-800/90 p-10 rounded-2xl shadow-2xl border border-loyola-green-30"
            >
              <TechLoader />
              <MotionDiv
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-loyola-green-70 text-xl font-medium"
              >
                Transforming files...
              </MotionDiv>
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-gray-400 text-sm"
              >
                This may take a few moments depending on file size
              </MotionDiv>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Message animation - REDESIGNED */}
      <AnimatePresence>
        {message && (
          <MotionDiv
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 p-4 rounded-xl shadow-xl backdrop-blur-md z-50 
              flex items-center gap-3
              ${message.includes('failed') || message.includes('Error')
                ? 'bg-red-500/90 text-white'
                : 'bg-emerald-500/90 text-white'}`}
          >
            {message.includes('failed') || message.includes('Error') ? (
              <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <FiCheck className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message}</span>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Contact Button - REDESIGNED */}
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