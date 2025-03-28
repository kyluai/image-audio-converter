export interface FileWithPreview {
  file: File;
  preview: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'converting' | 'done' | 'error';
  error?: string;
  isAudio: boolean;
  convertedUrl?: string;
  convertedFilename?: string;
} 