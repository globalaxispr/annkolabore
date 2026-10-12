import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
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
      <body className="min-h-full flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <DemoBanner />
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            <p className="font-medium text-slate-700">
              Sistèm Jesyon Kontribisyon Chofè Legliz — Brezil
            </p>
            <p className="mt-1 text-slate-400">
              Règ: R$ 10,00 pou chak jou chofè a travay. Transparans total pou tout manm.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
