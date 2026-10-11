import type { Metadata } from "next";
import { Be_Vietnam_Pro, Lora } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

// Default tenant display font; only used in brand areas via `font-display`.
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SchoolHub | Learning Management",
  description:
    "Client experience for the School Management platform covering enrollment, courses, quizzes and assignments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Font variables live on <html> (= :root) so the --font-ui/--font-display
    // tokens declared in globals.css can resolve them.
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${beVietnamPro.variable} ${lora.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
