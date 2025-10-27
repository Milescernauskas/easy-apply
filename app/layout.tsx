import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Easy Apply - Job Application Optimizer",
  description: "Optimize your resume and cover letter for any job application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
