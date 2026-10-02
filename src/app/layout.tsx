import type { Metadata, Viewport } from "next";
import { Alex_Brush, Geist, Geist_Mono, IBM_Plex_Sans, Silkscreen } from "next/font/google";
import localFont from "next/font/local";
import { getLocale } from "@/lib/locale";
import { LocaleProvider } from "@/i18n/context";
import { LanguageSwitcher } from "./language-switcher";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin-ext"],
});

// Dizajn "grid paper" (Direction A) - pixelovy nadpis (h1, bod: "pixelovy
// font na hlavny nadpis") + telo textu. "latin-ext" (nie len "latin") -
// appka pouziva slovenske diakritiky (á, č, š, ž,...), ktore su mimo
// zakladnej "latin" sady.
const silkscreen = Silkscreen({
  variable: "--font-pixel",
  subsets: ["latin-ext"],
  weight: ["400", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const alexBrush = Alex_Brush({
  variable: "--font-alex-brush",
  subsets: ["latin-ext"],
  weight: "400",
});

// Nefunguje v Chrome (defekt v samotnom subore fontu - starsi TTF, ktory
// tamojsi striktnejsi validator odmieta), ale funguje v Safari. P ju chce
// pouzit napriek tomu, takze ostava ako lokalny font popri Alex Brush.
const fontleroyBrown = localFont({
  src: "../../public/fonts/FontleroyBrown.ttf",
  variable: "--font-fontleroy-brown",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pixel diár",
  description: "Rok v pixeloch - nálady, návyky a zoznamy.",
  // Meno pod ikonou na ploche iPhonu (ikona = app/apple-icon.png).
  appleWebApp: { capable: true, title: "Pixel diár", statusBarStyle: "default" },
};

// Bez tohto sa na mobile po navigacii (napr. ← spat na hlavnu stranku)
// niekedy zachova priblizenie zo starsieho nedopatreneho pinch/dvojtapu -
// plna obnova stranky priblizenie resetuje, ale klientska navigacia v
// Next.js nie. Vypnutim priblizenia sa tomu uplne predide.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${alexBrush.variable} ${fontleroyBrown.variable} ${silkscreen.variable} ${ibmPlexSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider locale={locale}>
          <LanguageSwitcher />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
