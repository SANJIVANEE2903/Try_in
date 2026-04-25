import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap",
  preload: true
});
const outfit = Outfit({ 
  subsets: ["latin"], 
  variable: "--font-outfit",
  display: "swap",
  preload: true
});

export const metadata: Metadata = {
  title: "RepoForge | AI-Powered GitHub Management",
  description: "Control your GitHub infrastructure with natural language. Create repos, manage branches, and automate workflows.",
  keywords: "GitHub, Git, AI, repository management, natural language",
  openGraph: {
    title: "RepoForge | AI-Powered GitHub Management",
    description: "Control GitHub with Natural Language",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
    </html>
  );
}
