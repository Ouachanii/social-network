"use client";
import "./styles/globals.css";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootLayout({ children }) {
  const router = useRouter();
  useEffect(() => {
    // Check if user is logged in (example: check localStorage/session)
    const isLoggedIn = typeof window !== "undefined" && localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn && window.location.pathname === "/login") {
      router.replace("/");
    }
  }, [router]);
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
