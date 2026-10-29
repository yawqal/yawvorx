// FONTS: free Google fonts. To change: swap the imports below for any other font from next/font/google.
import { Space_Grotesk, Inter, Noto_Sans_Ethiopic } from "next/font/google";

export const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "optional" });
export const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "optional" });
export const ethiopic = Noto_Sans_Ethiopic({ subsets: ["ethiopic"], variable: "--font-ethiopic", display: "optional" });
