"use client";
import "./styles/globals.css";
import { usePathname } from "next/navigation";
import Header from "./components/Header";
import { UserProvider } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const showHeader = pathname !== "/login" && pathname !== "/register";

  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <UserProvider>
            {showHeader && <Header />}
            <main>{children}</main>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
