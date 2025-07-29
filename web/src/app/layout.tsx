import type { Metadata } from "next";
import { Inter, EB_Garamond, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/global/providers";
import { ThemeProvider } from "@/components/global/theme-provider";
import { Toaster } from "@/components/ui/sonner";

// Configure each font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // CSS variable for the default font
  display: 'swap',
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond", // CSS variable for the classical font
  display: 'swap',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-source-code-pro", // CSS variable for the modern font
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Thucydides",
  description: "Converse with history, grounded in truth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("FATAL: NEXT_PUBLIC_API_URL environment variable is not set.");
  }

  return (
    <html lang="en" className={`${inter.variable} ${ebGaramond.variable} ${sourceCodePro.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppProviders apiUrl={apiUrl}>{children}</AppProviders>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
