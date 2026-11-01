import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { LenisProvider } from "@/components/motion/lenis-provider";
import { PageTransition } from "@/components/motion/page-transition";
import { getImage, loadSite, socialLinks } from "@/lib/content";
import { baseOpenGraph } from "@/lib/page-seo";
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
  return {
    metadataBase: new URL(site.url),
    title: { default: site.name, template: site.seo.titleTemplate },
    description: site.seo.description,
    openGraph: baseOpenGraph(),
  };
}

// Reveal wrappers start hidden; this keeps content visible when JavaScript is off.
const noScriptFallback = "[data-reveal]{opacity:1!important;transform:none!important}";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const site = loadSite();
  const logo = getImage(site.logoKey);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "LocalBusiness", "ProfessionalService"],
        "@id": `${site.url}/#organization`,
        name: site.name,
        alternateName: site.shortName,
        url: site.url,
        logo: `${site.url}${logo.src}`,
        description: site.seo.description,
        telephone: site.contact.phones[0],
        email: site.contact.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: site.contact.address,
          addressLocality: "Pune",
          addressRegion: "Maharashtra",
          postalCode: "411017",
          addressCountry: "IN",
        },
        department: site.offices.map((office) => ({
          "@type": "LocalBusiness",
          name: `${site.shortName} - ${office.city} ${office.name}`,
          address: {
            "@type": "PostalAddress",
            addressLocality: office.city,
            addressRegion: "Maharashtra",
            addressCountry: "IN",
          },
        })),
      },
    ],
  };

  return (
    <html lang={site.locale} className={`${syne.variable} ${manrope.variable}`}>
      <head>
        <noscript>
          <style>{noScriptFallback}</style>
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      {/* Browser extensions (e.g. Grammarly) inject attributes into <body> before hydration. */}
      <body suppressHydrationWarning>
        <LenisProvider>
          <PageTransition label={site.shortName} />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-(--z-skip) focus:rounded-pill focus:bg-accent focus:px-6 focus:py-3 focus:text-accent-foreground"
          >
            {site.ui.skipToContent}
          </a>
          <Header
            name={site.shortName}
            logo={{ src: logo.src, width: logo.width ?? 40, height: logo.height ?? 40 }}
            labels={{
              openMenu: site.ui.openMenu,
              closeMenu: site.ui.closeMenu,
              mainNav: site.ui.mainNav,
              mobileNav: site.ui.mobileNav,
            }}
            nav={site.nav}
            cta={site.cta}
          />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <Footer
            name={site.name}
            tagline={site.tagline}
            contact={site.contact}
            offices={site.offices}
            nav={site.nav}
            social={socialLinks(site)}
            labels={{ contact: site.ui.footerContact, explore: site.ui.footerExplore }}
          />
        </LenisProvider>
      </body>
    </html>
  );
}
