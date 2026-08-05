import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "./hooks/userContext";
import AuthProvider from "./components/AuthProvider";
import InitialLoader from "./components/InitialLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "What-If Map",
  description: "What-If Map Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <UserProvider>
            <InitialLoader>{children}</InitialLoader>
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

