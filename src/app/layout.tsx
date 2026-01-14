import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/providers/query-provider';

export const metadata: Metadata = {
  title: 'Acme Tire',
  description: 'Auto repair shop CRM frontend',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <div className="min-h-screen bg-gray-50 text-gray-900">
            <header className="border-b bg-white">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <div className="text-lg font-semibold">Acme Tire</div>
                <nav className="flex gap-4 text-sm">
                  <a className="hover:underline" href="/dashboard">Dashboard</a>
                  <a className="hover:underline" href="/repair-orders">Repair Orders</a>
                </nav>
              </div>
            </header>
            <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
