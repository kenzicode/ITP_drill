import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITP Drill — Latihan TOEFL ITP",
  description: "Latihan terstruktur TOEFL ITP: pagi, siang, sore.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="wrap">{children}</div>
      </body>
    </html>
  );
}
