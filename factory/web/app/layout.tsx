import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'fábrica — tu tienda online en minutos',
  description:
    'Crea tu tienda online con un diseño único generado por IA, publícala con tu dominio y véndela en web y apps. Sin programadores.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Public+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
