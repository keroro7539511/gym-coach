import { Inter, JetBrains_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-import",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-import",
  display: "swap",
});

export const metadata = {
  title: "健身教練管理",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
