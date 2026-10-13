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
  title: 'Sistèm Jesyon Kontribisyon Chofè Legliz',
  description: 'Platfòm transparans finansye pou gwoup chofè legliz nan Brezil. Kontribisyon R$ 10,00 pa chak jou travay.',
  keywords: ['kontribisyon chofè', 'legliz', 'Brezil', 'transparans finansye', 'Kreyòl Ayisyen'],
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
