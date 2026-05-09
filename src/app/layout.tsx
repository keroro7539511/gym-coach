import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata = {
  title: "健身教練管理",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
