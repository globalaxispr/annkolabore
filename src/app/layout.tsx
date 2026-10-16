import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/shell/AppShell';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
  colorScheme: 'light',
};

export const metadata: Metadata = {
  title: 'Chofè Legliz — Fon Kontribisyon Kominotè',
  description: 'Ansanm, n ap soutni kominote nou an. Platfòm transparans finansye pou kontribisyon lib kominote legliz la nan Brezil.',
  keywords: ['Chofè Legliz', 'kontribisyon', 'kominote', 'Brezil', 'transparans finansye', 'Kreyòl Ayisyen'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ht" className="h-full bg-white">
      <body className="min-h-full bg-white font-sans text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
