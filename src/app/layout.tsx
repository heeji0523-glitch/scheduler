import type { Metadata } from "next";
import "./globals.css";
import AuthorProvider from "@/components/AuthorProvider";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "팀 할일 스케줄러",
  description: "주차별로 관리하는 팀 할일 관리 보드",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-base-bg text-white antialiased">
        <AuthorProvider>
          <TopNav />
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </AuthorProvider>
      </body>
    </html>
  );
}
