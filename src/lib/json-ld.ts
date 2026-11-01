import type { Site } from "@/lib/validators/content";

/**
 * Serialises JSON-LD for a <script type="application/ld+json"> tag. `<` is escaped as \u003c so
 * content such as "</script>" can never end the tag early.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * The Organization / LocalBusiness graph for the whole site. Every value comes from content/site.yaml.
 * `address` is included only when `contact.addressParts` is filled in (nothing is guessed from text).
 */
export function buildOrganizationJsonLd(site: Site, logoSrc: string) {
  const parts = site.contact.addressParts;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "LocalBusiness", "ProfessionalService"],
        "@id": `${site.url}/#organization`,
        name: site.name,
        alternateName: site.shortName,
        url: site.url,
        logo: `${site.url}${logoSrc}`,
        description: site.seo.description,
        telephone: site.contact.phones[0],
        email: site.contact.email,
        ...(parts && {
          address: {
            "@type": "PostalAddress",
            streetAddress: parts.streetAddress,
            addressLocality: parts.locality,
            addressRegion: parts.region,
            postalCode: parts.postalCode,
            addressCountry: parts.country,
          },
        }),
        department: site.offices.map((office) => ({
          "@type": "LocalBusiness",
          name: `${site.shortName} - ${office.city} ${office.name}`,
          address: {
            "@type": "PostalAddress",
            addressLocality: office.city,
            ...(parts && { addressCountry: parts.country }),
          },
        })),
      },
    ],
  };
}
