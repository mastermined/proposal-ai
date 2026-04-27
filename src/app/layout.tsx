import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Sidebar } from "@/components/Sidebar";
import { getSession } from "@/lib/auth/session";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",   // prevents the woff2 preload warning
});

export const metadata: Metadata = {
  title: "FPT Proposal AI",
  description: "AI-powered RFP to Proposal automation",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getSession() never throws — returns null on any error
  const session = await getSession();

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className={inter.variable}>
        <ThemeProvider>
          {session ? (
            <div className="app-shell">
              <Sidebar
                userRole={session.role}
                userName={session.name}
                userEmail={session.email}
              />
              <main className="app-main">{children}</main>
            </div>
          ) : (
            // Login / setup pages — no sidebar
            <main>{children}</main>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
