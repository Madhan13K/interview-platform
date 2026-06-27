import "./globals.css";
import Providers from "./providers";
import SkipNavigation from "@/components/a11y/SkipNavigation";

export const metadata = {
  title: "InterviewAI - AI-Powered Interview Preparation",
  description: "Practice interviews with AI, get instant feedback, and land your dream job.",
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className="min-h-screen antialiased">
        <SkipNavigation />
        <Providers>
          <main id="main-content" role="main" tabIndex={-1}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}