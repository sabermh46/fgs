"use client";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { ReactQueryClientProvider } from "./lib/react-query-client";
import "./globals.css";
import Header from "./component/Header";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased min-h-screen bg-white dark:bg-gray-900">
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <Header />
            <ReactQueryClientProvider>
              <main className="max-w-[1200px] mx-auto p-4">{children}</main>
            </ReactQueryClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
