export const LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20"/></svg>';

export const SITE_YAML = `
name: Test Co
shortName: Test
tagline: Test tagline
url: https://example.com
locale: en-IN
logoKey: logo
cta: { label: Contact, href: /contact/ }
contact:
  email: hello@example.com
  phones: ["+91 98602 20550"]
  address: 1 Test Road, Pune
offices:
  - { name: Head Office, city: Pune }
accreditations:
  - { label: NABET Cat A }
nav:
  - { label: Home, href: / }
  - { label: Services, href: /services/ }
links:
  linkedin: https://www.linkedin.com/company/test
seo:
  titleTemplate: "%s | Test"
  description: A test site.
  ogImageKey: logo
`;

export const MEDIA_YAML = `
logo:
  src: /media/brand/logo.svg
  alt: Test logo
`;

export const HOME_YAML = `
hero:
  eyebrow: Test eyebrow
  title: Test title
  subtitle: Test subtitle
  primaryCta: { label: Start, href: /contact/ }
`;

export const SERVICE_MD = `---
title: Environmental audit
order: 1
summary: Independent audit of compliance.
---
Body text of the service.
`;

export function validFiles(): Record<string, string> {
  return {
    "content/site.yaml": SITE_YAML,
    "content/media.yaml": MEDIA_YAML,
    "content/pages/home.yaml": HOME_YAML,
    "content/services/environmental-audit.md": SERVICE_MD,
    "public/media/brand/logo.svg": LOGO_SVG,
  };
}
