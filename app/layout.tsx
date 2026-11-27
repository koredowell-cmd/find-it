import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Find It | Buy, Sell & Discover Near You',
  description: 'Ghana’s modern marketplace for products, services, properties, and buyer requests.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Find It',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#059669',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('findit_theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.className} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200`}
      >
        {/* Lively Subtle Ambient Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-lively-grid">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-400/20 dark:bg-emerald-500/15 blur-3xl animate-orb-1" />
          <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-amber-300/20 dark:bg-amber-400/10 blur-3xl animate-orb-2" />
          <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-teal-400/15 dark:bg-teal-500/10 blur-3xl animate-orb-1" />
        </div>
        {children}
      </body>
    </html>
  );
}