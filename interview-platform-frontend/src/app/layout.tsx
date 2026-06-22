import "./globals.css";
import Providers from "./providers";

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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}