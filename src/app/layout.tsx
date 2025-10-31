import type { Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/client";
import { ThemeProvider } from "next-themes";

import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import {NuqsAdapter} from "nuqs/adapters/next";
const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ConvoGenius - AI-Powered ConvoGeniusing Assistant",
  description: "Transform your ConvoGeniusings with AI assistants that understand, participate, and elevate every conversation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return ( 
    <NuqsAdapter>
      <TRPCReactProvider>
        <html lang="en" suppressHydrationWarning>
          <body
            className={`${inter.className} antialiased`}
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem={false}
              disableTransitionOnChange
              storageKey="theme"
            >
              <Toaster/>
              {children}
            </ThemeProvider>
          </body>
        </html>
      </TRPCReactProvider>
    </NuqsAdapter>
  );
}
