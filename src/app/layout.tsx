import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EventControl SaaS | Plataforma de Control de Asistencia y Mesas de Gala',
  description: 'Control de invitados, distribución de mesas, check-in QR en tiempo real y reportes de catering para Wedding Planners.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#C5A059',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Great+Vibes&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" 
          rel="stylesheet" 
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (typeof window !== 'undefined' && 'caches' in window) {
                  caches.delete('start-url');
                  caches.delete('pages');
                  caches.delete('pages-rsc');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
