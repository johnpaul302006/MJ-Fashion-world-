import { Inter } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import SmoothScroll from "@/components/SmoothScroll";
import DevPerfPatch from "@/components/DevPerfPatch";
import { getSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = SITE_URL;

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MJ Fashion World — Shop Boys, Girls, Children, Men & Women",
    template: "%s | MJ Fashion World",
  },
  description: "Your one-stop fashion destination. Shop the latest styles for the whole family. Easy UPI payment and fast delivery.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "MJ Fashion World",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({ children }) {
  const settings = await getSettings();

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <DevPerfPatch />
        <SmoothScroll>
          <SiteShell storeName={settings.storeName} address={settings.address} phone={settings.phone}>
            {children}
          </SiteShell>
        </SmoothScroll>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')})}`
          }}
        />
      </body>
    </html>
  );
}