import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AI Content Engine",
  description: "30-day AI content planning and publishing engine"
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="id"><body>{children}</body></html>;
}
