import type { Metadata } from 'next';
import './globals.css';
import { CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: `${CONFIG.APP_NAME} - Salón de Belleza y Peluquería`,
  description: CONFIG.APP_DESCRIPTION,
  keywords: ['salón de belleza', 'peluquería', 'citas', 'belleza', 'estética'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
