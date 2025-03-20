# Convert-io 🚀

A modern file conversion web application built with Next.js and Express. Convert-io allows users to easily transform their files between different formats with a sleek, user-friendly interface.

## Features ✨

- **Drag & Drop Interface**: Intuitive file upload system
- **Multiple Format Support**: 
  - Images: JPEG, PNG, WebP, GIF, TIFF
  - Audio: MP3, WAV, OGG, M4A, AAC, FLAC
- **Real-time Conversion**: Watch your files transform with a beautiful progress indicator
- **Batch Processing**: Convert multiple files simultaneously
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI/UX**: Built with Tailwind CSS and Framer Motion for smooth animations

## Tech Stack 💻

- **Frontend**:
  - Next.js 13 (React)
  - TypeScript
  - Tailwind CSS
  - Framer Motion
  - React Icons

- **Backend**:
  - Express.js
  - Multer (file handling)
  - Sharp (image processing)
  - Fluent-FFMPEG (audio processing)

## Getting Started 🚀

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Convert-io.git
cd Convert-io
```

2. Install dependencies for both frontend and backend:
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Create a .env file in the backend directory:
```env
PORT=3001
UPLOAD_DIR=uploads
```

4. Start the development servers:
```bash
# Start backend server (from backend directory)
npm run dev

# Start frontend server (from frontend directory)
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure 📁

```
Convert-io/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── app/
│   │   ├── utils/
│   │   └── types/
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── middleware/
│   ├── uploads/
│   └── package.json
└── README.md
```

## Future Improvements 🔮

- [ ] Add video format conversion support
- [ ] Implement user authentication
- [ ] Add cloud storage integration
- [ ] Create conversion presets
- [ ] Add batch download functionality
- [ ] Implement file compression options

## Contributing 🤝

Feel free to contribute to this project! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📝

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact 📧

Your Name - [Olu owolabi](mailto:oluowolabiai@gmail.com)

Project Link: [](https://github.com/kyluai/image-audio-converter)

## Acknowledgments 🙏

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [Sharp](https://sharp.pixelplumbing.com/)
- [FFMPEG](https://www.ffmpeg.org/) 
