"use client";
import "./styles/globals.css";
import { usePathname } from "next/navigation";
import Header from "./components/Header";
import { UserProvider } from "./context/UserContext";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const showHeader = pathname !== "/login" && pathname !== "/register";

  return (
    <html lang="en">
      <body>
        <UserProvider>
          {showHeader && <Header />}
          <main>{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}
