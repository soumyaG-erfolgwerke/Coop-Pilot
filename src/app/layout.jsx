import "./globals.css";
import Providers from "./providers";
import { Inter, DM_Sans, Abhaya_Libre } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmsans = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans" });
const abhayaLibre = Abhaya_Libre({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-abhaya",
  display: "swap",
});

export const metadata = {
  title: "Cooppilot - Digital Cooperative Management",
  description: "Simplify your cooperative management with Cooppilot",
  icons: {
    icon: "/fav.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${dmsans.variable} ${abhayaLibre.variable}`}
    >
      <body className="min-h-screen overflow-x-hidden text-gray-900 transition-colors duration-300 bg-white font-inter dark:bg-gray-900 dark:text-gray-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
