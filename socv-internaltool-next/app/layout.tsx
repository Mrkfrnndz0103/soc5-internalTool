// app/layout.tsx  
import "./globals.css";  
import type { Metadata } from "next";  
  
export const metadata: Metadata = {  
  title: "SOC5 Internal Tool",  
  description: "Internal tool for outbound operations",  
};  
  
export default function RootLayout({  
  children,  
}: {  
  children: React.ReactNode;  
}) {  
  return (  
    <html lang="en">  
      <body>{children}</body>  
    </html>  
  );  
}