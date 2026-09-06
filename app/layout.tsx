import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '罗伊然的作品集',
  description:
    '中国社会科学院大学广播电视学专业罗伊然的影像、视觉设计、摄影与研究作品集。',
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
