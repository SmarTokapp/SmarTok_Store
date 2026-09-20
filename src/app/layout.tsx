import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getLocale, getDictionary } from "@/i18n";
import { I18nProvider } from "@/i18n/provider";
import { CartProvider } from "@/store/cart";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmarTok Store",
  description: "The official SmarTok store — coming soon.",
};

// Critical for mobile: without an explicit device-width viewport, mobile
// browsers render the page as a scaled-down desktop layout.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const dictionary = getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
        <I18nProvider locale={locale} dictionary={dictionary}>
          <CartProvider>
            <Header />
            <main className="flex flex-1 flex-col">{children}</main>
            <CartDrawer />
          </CartProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
