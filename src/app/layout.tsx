import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://mworado.vercel.app";
const DESCRIPTION = "완벽하지 않아도 돼. 오늘 뭐라도 하나만. 매일 할 일과 반복 루틴을 체크하고, 꾸준함을 잔디로 확인하는 개인용 데일리 체크 앱.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "뭐라도해야지", template: "%s | 뭐라도해야지" },
  description: DESCRIPTION,
  openGraph: {
    title: "뭐라도해야지",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "뭐라도해야지",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "뭐라도해야지",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
