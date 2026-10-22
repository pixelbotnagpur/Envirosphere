import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { LenisProvider } from "@/components/motion/lenis-provider";
import { getImage, loadSite, socialLinks } from "@/lib/content";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-syne",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-manrope",
  display: "swap",
});

export function generateMetadata(): Metadata {
  const site = loadSite();
  const og = getImage(site.seo.ogImageKey);
  return {
    metadataBase: new URL(site.url),
    title: { default: site.name, template: site.seo.titleTemplate },
    description: site.seo.description,
    openGraph: {
      siteName: site.name,
      locale: site.locale.replace("-", "_"),
      type: "website",
      images: [{ url: og.src, alt: og.alt }],
    },
  };
}

// Reveal wrappers start hidden; this keeps content visible when JavaScript is off.
const noScriptFallback = "[data-reveal]{opacity:1!important;transform:none!important}";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const site = loadSite();
  const logo = getImage(site.logoKey);

  return (
    <html lang={site.locale} className={`${syne.variable} ${manrope.variable}`}>
      <head>
        <noscript>
          <style>{noScriptFallback}</style>
        </noscript>
      </head>
      <body>
        <LenisProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-(--z-skip) focus:rounded-pill focus:bg-accent focus:px-6 focus:py-3 focus:text-accent-foreground"
          >
            Skip to content
          </a>
          <Header
            name={site.shortName}
            logo={{ src: logo.src, alt: logo.alt, width: logo.width ?? 40, height: logo.height ?? 40 }}
            nav={site.nav}
            cta={site.cta}
          />
          <main id="main">{children}</main>
          <Footer
            name={site.name}
            tagline={site.tagline}
            contact={site.contact}
            offices={site.offices}
            nav={site.nav}
            social={socialLinks(site)}
          />
        </LenisProvider>
      </body>
    </html>
  );
}
