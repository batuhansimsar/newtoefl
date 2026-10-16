import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"Coming Soon",description:"Our website is currently closed. We’ll be opening soon."};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
