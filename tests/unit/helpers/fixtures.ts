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
ui:
  skipToContent: Skip to content
  openMenu: Open menu
  closeMenu: Close menu
  mainNav: Main
  mobileNav: Mobile
  footerContact: Contact
  footerExplore: Explore
  notFound:
    label: page not found
    heading: This page has moved or does not exist.
    cta: Back to home
`;

const CLIENT_KEYS = ["a", "b", "c", "d", "e", "f"].map((n) => `client-${n}`);

export const MEDIA_YAML = `
logo:
  src: /media/brand/logo.svg
  alt: Test logo
about-photo:
  src: /media/images/about.svg
  alt: About photo
${CLIENT_KEYS.map((key) => `${key}:\n  src: /media/clients/${key}.svg\n  alt: ${key} logo`).join("\n")}
`;

export const HOME_YAML = `
hero:
  eyebrow: Test eyebrow
  title: Test title
  subtitle: Test subtitle
  primaryCta: { label: Start, href: /contact/ }
  secondaryCta: { label: Services, href: /services/ }
  scrollLabel: Scroll
about:
  label: About us
  heading: About heading
  paragraphs: [First paragraph., Second paragraph.]
  image: about-photo
  cta: { label: More, href: /about/ }
services:
  label: What we offer
  heading: Services heading
  intro: Services intro
  cta: { label: All services, href: /services/ }
stats:
  label: In numbers
  items:
    - { value: 250, suffix: "+", label: Clients }
    - { value: 25, suffix: "+", label: Projects }
clients:
  label: Clients
  heading: Clients heading
  logos: [${CLIENT_KEYS.join(", ")}]
process:
  label: How we work
  heading: Process heading
  steps:
    - { title: One, body: First step. }
    - { title: Two, body: Second step. }
testimonials:
  label: Testimonials
  heading: Testimonials heading
  items:
    - { quote: Great work., name: A Person, role: Manager }
contact:
  label: Contact
  heading: Contact heading
  body: Contact body
  primaryCta: { label: Talk, href: /contact/ }
  phoneLabel: Call us
  emailLabel: Email us
`;

export const SERVICE_MD = `---
title: Environmental audit
order: 1
summary: Independent audit of compliance.
---
Body text of the service.
`;

export const SERVICES_PAGE_YAML = `
serviceDetail:
  breadcrumbHome: Home
  breadcrumbServices: Services
  label: Service
  previousLabel: Previous service
  nextLabel: Next service
  contact:
    label: Discuss this service
    heading: Tell us about your project.
    body: Our team will help.
    primaryCta: { label: Start a conversation, href: /contact/ }
    phoneLabel: Call us
    emailLabel: Email us
`;

export const CAREERS_YAML = `
openings:
  noneHeading: No open positions
  noneBody: Send a general application.
  generalApplyLabel: Send a general application
  generalRoleLabel: General application
  emailLabel: Or email us
`;

export const JOBS_YAML = `
- id: engineer
  title: Environmental Engineer
  department: Engineering
  location: Pune
  type: Full-time
  experience: 2+ years
  description: Test job description.
  requirements: [Degree in engineering]
`;

export const GALLERY_YAML = `
- id: field-day
  title: Field day
  category: Field Work
  image: about-photo
`;

export const DOWNLOADS_YAML = `
- id: brochure
  title: Brochure
  category: Corporate
  fileKey: logo
  description: Company brochure.
`;

export function validFiles(): Record<string, string> {
  return {
    "content/site.yaml": SITE_YAML,
    "content/media.yaml": MEDIA_YAML,
    "content/pages/home.yaml": HOME_YAML,
    "content/services/environmental-audit.md": SERVICE_MD,
    "content/pages/services.yaml": SERVICES_PAGE_YAML,
    "content/pages/careers.yaml": CAREERS_YAML,
    "content/jobs.yaml": JOBS_YAML,
    "content/gallery.yaml": GALLERY_YAML,
    "content/downloads.yaml": DOWNLOADS_YAML,
    "public/media/brand/logo.svg": LOGO_SVG,
    "public/media/images/about.svg": LOGO_SVG,
    ...Object.fromEntries(CLIENT_KEYS.map((key) => [`public/media/clients/${key}.svg`, LOGO_SVG])),
  };
}
