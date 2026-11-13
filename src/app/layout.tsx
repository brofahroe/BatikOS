import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Batik Seng OS - ERP Mini Batik Tradisional',
  description: 'Sistem Manajemen Inventaris, Produksi, Kasir POS, dan Approval Desain Batik',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
