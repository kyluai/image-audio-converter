import './globals.css';
import { EB_Garamond } from 'next/font/google';

const garamond = EB_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-garamond',
});

export const metadata = {
  title: 'Convert.io - Renaissance File Converter',
  description: 'Elegant file conversion for the modern age',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={garamond.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                  document.body.classList.add('is-scrolled');
                } else {
                  document.body.classList.remove('is-scrolled');
                }
              });

              // Debug image loading
              window.addEventListener('load', () => {
                const testImg = new Image();
                testImg.onload = () => console.log('Background image loaded successfully');
                testImg.onerror = () => console.error('Background image failed to load');
                testImg.src = '/creation-of-adam.jpg';
              });
            `,
          }}
        />
      </head>
      <body className={`font-serif ${garamond.className}`}>
        <div className="bg-creation" />
        <div className="bg-overlay" />
        <main className="relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
