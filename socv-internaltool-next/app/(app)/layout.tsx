// app/(app)/layout.tsx  
"use client";  
  
import React from "react";  
import { Sidebar } from "@/src/components/sidebar";  
import { AuthProvider } from "@/src/contexts/auth-context";  
  
export default function AppLayout({  
  children,  
}: {  
  children: React.ReactNode;  
}) {  
  return (  
    <AuthProvider>  
      <div className="flex min-h-screen">  
        <Sidebar />  
        <main className="flex-1 bg-background text-foreground p-4">  
          {children}  
        </main>  
      </div>  
    </AuthProvider>  
  );  
}