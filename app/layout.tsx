import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WAIC 2026 AI项目全景",
  description: "覆盖WAIC 2026全部AI项目，支持从一级行业下钻到三级产品、机器人任务和具体项目",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
