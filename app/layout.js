import { Inter } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import DevPerfPatch from "@/components/DevPerfPatch";
import { getSettings } from "@/lib/data";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "MJ Fashion World — Shop Boys, Girls, Children, Men & Women",
  description: "Your one-stop fashion destination. Shop the latest styles for the whole family. Easy UPI payment and fast delivery.",
};

export default async function RootLayout({ children }) {
  const settings = await getSettings();

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <DevPerfPatch />
        <SiteShell storeName={settings.storeName} address={settings.address} phone={settings.phone}>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}