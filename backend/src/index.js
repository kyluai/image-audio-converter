const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Supported formats
const supportedFormats = {
  images: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff'],
  audio: ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a']
};

// Get supported formats
app.get('/api/formats', (req, res) => {
  res.json(supportedFormats);
});

// Convert image
app.post('/api/convert/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const targetFormat = req.body.format;
    if (!supportedFormats.images.includes(targetFormat)) {
      return res.status(400).json({ error: 'Unsupported format' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(uploadsDir, `converted_${Date.now()}.${targetFormat}`);

    await sharp(inputPath)
      .toFormat(targetFormat)
      .toFile(outputPath);

    res.json({
      message: 'Conversion successful',
      originalFile: req.file.filename,
      convertedFile: path.basename(outputPath)
    });
  } catch (error) {
    console.error('Image conversion error:', error);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

// Convert audio
app.post('/api/convert/audio', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const targetFormat = req.body.format;
    if (!supportedFormats.audio.includes(targetFormat)) {
      return res.status(400).json({ error: 'Unsupported format' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(uploadsDir, `converted_${Date.now()}.${targetFormat}`);

    ffmpeg(inputPath)
      .toFormat(targetFormat)
      .on('end', () => {
        res.json({
          message: 'Conversion successful',
          originalFile: req.file.filename,
          convertedFile: path.basename(outputPath)
        });
      })
      .on('error', (err) => {
        console.error('Audio conversion error:', err);
        res.status(500).json({ error: 'Conversion failed' });
      })
      .save(outputPath);
  } catch (error) {
    console.error('Audio conversion error:', error);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Image-Audio Converter API is running' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 