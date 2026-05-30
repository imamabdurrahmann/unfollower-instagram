import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Unfollower | Cek Siapa Yang Nggak Follback",
  description: "Cari tahu siapa yang nggak follback kamu di Instagram. 100% aman, data diproses langsung di browser kamu tanpa dikirim ke server.",
  applicationName: "Unfollower",
  keywords: ["instagram", "unfollower", "follback", "cek unfollower ig", "tracker"],
  authors: [{ name: "You" }],
  openGraph: {
    title: "Unfollower | Cek Siapa Yang Nggak Follback",
    description: "Cari tahu siapa yang nggak follback kamu di Instagram. 100% aman, data diproses langsung di browser.",
    url: "https://unfollower-tau.vercel.app",
    siteName: "Unfollower",
    images: [{ url: "/icon", width: 512, height: 512 }],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Unfollower | Cek Siapa Yang Nggak Follback",
    description: "Cek siapa yang nggak follback lu dengan gampang dan aman.",
  }
};

export const viewport = {
  themeColor: '#0f0c29',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans antialiased min-h-screen bg-black text-neutral-100 selection:bg-neutral-800 selection:text-white`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
