import type { Metadata } from "next";
import "./globals.css";

import { AppPersistence } from "@/components/layout/AppPersistence";
import { MobileNotSupported } from "@/components/layout/MobileNotSupported";

export const metadata: Metadata = {
  title: "Smart Model",
  description: "Smart Model, 一款基础模型生成工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">
        <AppPersistence />
        <MobileNotSupported />
        {children}
      </body>
    </html>
  );
}
