import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import sizeOf from 'image-size';
import fs from 'fs';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(UPLOAD_DIR));

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// Supported formats configuration
const formatConfig = {
  input: {
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'image/svg+xml',
      'application/x-photoshop',
      'image/vnd.adobe.photoshop',
      // Audio formats
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/aac',
      'audio/flac'
    ],
    extensions: [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg', '.psd',
      // Audio extensions
      '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'
    ]
  },
  output: {
    // Formats that Sharp can convert to
    formats: ['jpeg', 'png', 'webp', 'gif', 'tiff'] as const,
    // Audio formats that ffmpeg can convert to
    audioFormats: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'] as const
  }
};

type SupportedOutputFormat = typeof formatConfig.output.formats[number];
type SupportedAudioFormat = typeof formatConfig.output.audioFormats[number];

const isValidOutputFormat = (format: string): format is SupportedOutputFormat => {
  return formatConfig.output.formats.includes(format as SupportedOutputFormat);
};

const isValidAudioFormat = (format: string): format is SupportedAudioFormat => {
  return formatConfig.output.audioFormats.includes(format as SupportedAudioFormat);
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Enhanced file filter function
const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (formatConfig.input.mimeTypes.includes(file.mimetype) || 
      formatConfig.input.extensions.includes(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Supported formats: ${formatConfig.input.extensions.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for audio files
  }
});

interface ConversionOptions {
  quality?: number;
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
}

// Format-specific conversion options
const getConversionOptions = (format: SupportedOutputFormat, userOptions: ConversionOptions = {}) => {
  const baseOptions = {
    quality: userOptions.quality || 80
  };

  const formatOptions = {
    jpeg: {
      ...baseOptions,
      mozjpeg: true,
      chromaSubsampling: '4:4:4'
    },
    png: {
      ...baseOptions,
      compressionLevel: 9,
      palette: true
    },
    webp: {
      ...baseOptions,
      lossless: false,
      nearLossless: false,
      smartSubsample: true
    },
    tiff: {
      ...baseOptions,
      compression: 'lzw'
    },
    gif: {
      ...baseOptions,
      colors: 256,
      dither: 0.5
    }
  };

  return formatOptions[format] || baseOptions;
};

interface AudioConversionOptions {
  bitrate?: string;
  sampleRate?: number;
  channels?: number;
}

// Routes
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get image dimensions
    const dimensions = sizeOf(fs.readFileSync(req.file.path));

    // Prepare file details
    const fileDetails = {
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path,
        dimensions: {
          width: dimensions.width,
          height: dimensions.height,
          type: dimensions.type
        }
      }
    };

    res.json(fileDetails);
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ 
      error: 'Error processing file upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Enhanced convert endpoint
app.post('/api/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const targetFormat = req.body.format?.toLowerCase();
    if (!targetFormat || !isValidOutputFormat(targetFormat)) {
      return res.status(400).json({ 
        error: 'Invalid format',
        message: `Target format must be one of: ${formatConfig.output.formats.join(', ')}`
      });
    }

    // Parse conversion options
    let options: ConversionOptions = {};
    try {
      if (req.body.options) {
        options = JSON.parse(req.body.options);
      }
    } catch (error) {
      console.warn('Failed to parse conversion options:', error);
    }

    // Generate output filename
    const outputFilename = `converted-${Date.now()}.${targetFormat}`;
    const outputPath = path.join(UPLOAD_DIR, outputFilename);

    // Get conversion options
    const conversionOptions = getConversionOptions(targetFormat, options);

    // Initialize Sharp with input file
    let sharpInstance = sharp(req.file.path);

    // Handle resize if dimensions are provided
    if (options.width || options.height) {
      const resizeOptions = {
        width: options.width,
        height: options.height,
        fit: options.maintainAspectRatio ? 'inside' as const : 'fill' as const,
        withoutEnlargement: true
      };
      sharpInstance = sharpInstance.resize(resizeOptions);
    }

    // Special handling for SVG inputs
    if (req.file.mimetype === 'image/svg+xml') {
      sharpInstance = sharpInstance.resize(1024, 1024, { fit: 'inside' });
    }

    // Convert image
    await sharpInstance
      .toFormat(targetFormat, conversionOptions)
      .toFile(outputPath);

    // Get converted file details
    const stats = fs.statSync(outputPath);
    const dimensions = sizeOf(fs.readFileSync(outputPath));

    // Return conversion results
    res.json({
      message: 'Image converted successfully',
      original: {
        filename: req.file.filename,
        format: path.extname(req.file.filename).slice(1),
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      converted: {
        filename: outputFilename,
        format: targetFormat,
        size: stats.size,
        path: `/uploads/${outputFilename}`,
        dimensions: {
          width: dimensions.width,
          height: dimensions.height,
          type: dimensions.type
        },
        quality: conversionOptions.quality,
        options: {
          ...options,
          format: targetFormat
        }
      }
    });

  } catch (error) {
    console.error('Error converting image:', error);
    res.status(500).json({ 
      error: 'Error converting image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Audio conversion endpoint
app.post('/api/convert-audio', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file; // Store in a variable to avoid repeated null checks
    const targetFormat = req.body.format?.toLowerCase();
    if (!targetFormat || !isValidAudioFormat(targetFormat)) {
      return res.status(400).json({ 
        error: 'Invalid format',
        message: `Target format must be one of: ${formatConfig.output.audioFormats.join(', ')}`
      });
    }

    // Parse conversion options
    let options: AudioConversionOptions = {};
    try {
      if (req.body.options) {
        options = JSON.parse(req.body.options);
      }
    } catch (error) {
      console.warn('Failed to parse audio conversion options:', error);
    }

    // Generate output filename
    const outputFilename = `converted-${Date.now()}.${targetFormat}`;
    const outputPath = path.join(UPLOAD_DIR, outputFilename);

    // Initialize ffmpeg command
    let command = ffmpeg(file.path);

    // Apply conversion options if provided
    if (options.bitrate) command = command.audioBitrate(options.bitrate);
    if (options.sampleRate) command = command.audioFrequency(options.sampleRate);
    if (options.channels) command = command.audioChannels(options.channels);

    // Execute conversion
    command
      .toFormat(targetFormat)
      .on('end', () => {
        // Get converted file details
        const stats = fs.statSync(outputPath);

        // Clean up the uploaded file
        fs.unlinkSync(file.path);

        // Return conversion results
        res.json({
          message: 'Audio file converted successfully',
          original: {
            filename: file.filename,
            format: path.extname(file.filename).slice(1),
            size: file.size,
            mimetype: file.mimetype
          },
          converted: {
            filename: outputFilename,
            path: `/uploads/${outputFilename}`,
            size: stats.size,
            format: targetFormat
          },
          options: {
            bitrate: options.bitrate || 'default',
            sampleRate: options.sampleRate || 'default',
            channels: options.channels || 'default'
          }
        });
      })
      .on('error', (err) => {
        console.error('Audio conversion error:', err);
        // Clean up files in case of error
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
        fs.unlinkSync(file.path);
        res.status(500).json({ 
          error: 'Error converting audio file',
          details: err.message
        });
      })
      .save(outputPath);
  } catch (error) {
    console.error('Audio conversion error:', error);
    res.status(500).json({ 
      error: 'Error converting audio file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update formats endpoint to include only image and audio formats
app.get('/api/formats', (req, res) => {
  res.json({
    input: {
      mimeTypes: formatConfig.input.mimeTypes,
      extensions: formatConfig.input.extensions
    },
    output: {
      formats: formatConfig.output.formats,
      audioFormats: formatConfig.output.audioFormats
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error details:', err);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Upload directory: ${path.resolve(UPLOAD_DIR)}`);
}); 