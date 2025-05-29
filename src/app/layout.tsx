import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import ClientHydrationFix from '@/components/ClientHydrationFix';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <ClientHydrationFix />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
