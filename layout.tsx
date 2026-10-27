import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { site } from "@/config/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BookingProvider } from "@/components/booking/BookingContext";
import { themeScript } from "@/components/theme/theme";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Your City. Your Ride.`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: `${site.name} | Your City. Your Ride.`,
    description: site.description,
    siteName: site.name,
    type: "website",
    locale: site.market.locale.replace("-", "_"),
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f6f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={site.market.locale} className={`${manrope.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* Applies the saved or system theme before first paint, so dark mode never flashes light. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <BookingProvider>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </BookingProvider>
      </body>
    </html>
  );
}
