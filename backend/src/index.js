const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3002',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
}));
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const convertedDir = path.join(__dirname, '../converted');

[uploadsDir, convertedDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Routes
app.get('/api/formats', (req, res) => {
  res.json({
    input: {
      mimeTypes: ['image/*', 'audio/*'],
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp3', '.wav', '.ogg']
    },
    output: {
      formats: ['jpeg', 'png', 'webp', 'gif', 'mp3', 'wav', 'ogg']
    }
  });
});

// Image conversion endpoint
app.post('/api/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const format = req.body.format || 'jpeg';
    const options = JSON.parse(req.body.options || '{}');

    const inputPath = req.file.path;
    const outputFilename = path.basename(req.file.filename, path.extname(req.file.filename)) + '.' + format;
    const outputPath = path.join(convertedDir, outputFilename);

    let sharpInstance = sharp(inputPath);

    // Apply conversion options
    if (options.quality && (format === 'jpeg' || format === 'webp')) {
      sharpInstance = sharpInstance.quality(options.quality);
    }
    if (options.width || options.height) {
      sharpInstance = sharpInstance.resize(options.width, options.height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      });
    }

    await sharpInstance.toFormat(format).toFile(outputPath);

    // Clean up the uploaded file
    fs.unlinkSync(inputPath);

    res.json({
      converted: {
        path: '/converted/' + outputFilename,
        filename: outputFilename
      }
    });
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: 'Error converting file' });
  }
});

// Audio conversion endpoint
app.post('/api/convert-audio', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const format = req.body.format || 'mp3';
    const options = JSON.parse(req.body.options || '{}');

    const inputPath = req.file.path;
    const outputFilename = path.basename(req.file.filename, path.extname(req.file.filename)) + '.' + format;
    const outputPath = path.join(convertedDir, outputFilename);

    ffmpeg(inputPath)
      .toFormat(format)
      .on('end', () => {
        // Clean up the uploaded file
        fs.unlinkSync(inputPath);

        res.json({
          converted: {
            path: '/converted/' + outputFilename,
            filename: outputFilename
          }
        });
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        res.status(500).json({ error: 'Error converting audio file' });
      })
      .save(outputPath);
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: 'Error converting file' });
  }
});

// Serve both uploaded and converted files
app.use('/uploads', express.static(uploadsDir));
app.use('/converted', express.static(convertedDir));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Upload directory: ${path.resolve(uploadsDir)}`);
  console.log(`Converted directory: ${path.resolve(convertedDir)}`);
}); 