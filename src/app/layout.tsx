import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/shell/AppShell';
import { DemoBanner } from '@/components/DemoBanner';

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
    <html lang="ht" className="h-full bg-slate-50/50">
      <body className="min-h-full font-sans text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <DemoBanner />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
