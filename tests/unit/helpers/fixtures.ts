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
seo:
  title: Test Co home
  description: Test Co home description.
hero:
  eyebrow: Test eyebrow
  title: Test title
  subtitle: Test subtitle
  primaryCta: { label: Start, href: /contact/ }
  secondaryCta: { label: Services, href: /services/ }
  scrollLabel: Scroll
  image: about-photo
  highlights: [Clients]
  keywords: [Alpha, Beta]
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
  viewLabel: View details
  featured:
    - { service: environmental-audit, tag: "[ AUDITS ]", image: about-photo }
stats:
  label: In numbers
  items:
    - { value: 250, suffix: "+", label: Clients }
    - { value: 25, suffix: "+", label: Projects }
clients:
  label: Clients
  heading: Clients heading
  logos: [${CLIENT_KEYS.join(", ")}]
visualBreak:
  image: about-photo
  tag: Test tag
fieldArchive:
  label: FIELD
  heading: Field heading
  body: Field body
  topCta: { label: Archive, href: /gallery/ }
  bottomCta: { label: Gallery, href: /gallery/ }
  items:
    - { image: about-photo, tag: ONE, caption: First caption. }
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
hub:
  seo:
    title: Services title
    description: Services description.
  hero:
    eyebrow: Services
    title: Services hero title
    lead: Services hero lead.
  listLabel: Services List
  viewLabel: View Specifications
  cta:
    label: Consultation
    heading: Not sure what you need?
    lead: Tell us about your project.
    primaryCta: { label: Discuss, href: /contact/ }
    secondaryCta: { label: About us, href: /about/ }
serviceDetail:
  breadcrumbHome: Home
  breadcrumbServices: Services
  breadcrumbLabel: Breadcrumbs
  notFoundTitle: Service Not Found
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
seo:
  title: Careers
  description: Careers at Test Co.
hero:
  eyebrow: Careers
  title: Careers at Test.
openings:
  label: Open Positions
  heading: Current Vacancies
  countOne: Showing {count} open position
  countMany: Showing {count} open positions
  noneHeading: No open positions
  noneBody: Send a general application.
  generalApplyLabel: Send a general application
  generalRoleLabel: General application
  emailLabel: Or email us
`;

export const ABOUT_YAML = `
seo:
  title: About Us
  description: About description.
hero:
  eyebrow: Company Profile
  title: About heading.
  lead: About lead.
story:
  heading: Our story
  paragraphs: [First paragraph., Second paragraph.]
  image: about-photo
accreditation:
  label: Accreditation
  heading: Accreditation heading
  lead: Accreditation lead.
  feature:
    image: about-photo
    eyebrow: Event
    title: Event title
    text: Event text.
offices:
  label: Presence
  heading: Our offices
  lead: Office lead.
  icon: building
cta:
  label: Get in touch
  heading: Talk to us.
  primaryCta: { label: Connect, href: /contact/ }
  secondaryCta: { label: Services, href: /services/ }
`;

export const WHY_US_YAML = `
seo:
  title: Why Us
  description: Why us description.
hero:
  eyebrow: Why us
  title: Why Test.
  lead: Why lead.
pillars:
  - { icon: shield-check, title: Accredited, text: Accredited text. }
  - { icon: layers, title: Services, text: Services text. }
feature:
  image: about-photo
  eyebrow: Water
  title: Plant operation
  text: Plant text.
cta:
  label: Get in touch
  heading: Tell us.
  primaryCta: { label: Contact us, href: /contact/ }
`;

export const CONTACT_YAML = `
seo:
  title: Contact Us
  description: Contact description.
hero:
  eyebrow: Contact
  title: Contact Test.
enquiry:
  label: Enquiry
  heading: Send us an enquiry
  intro: Tell us below.
direct:
  heading: Phone and email
  intro: "You can reach us at:"
  phoneLabels: [Primary Line]
  emailLabel: Office Email
  emailSubject: Enquiry
headOffice:
  city: Pune
  label: Head Office
  heading: Pune Office
branches:
  label: Offices
  heading: Branch offices
  itemSuffix: Branch
`;

export const GALLERY_PAGE_YAML = `
seo:
  title: Gallery
  description: Gallery description.
hero:
  eyebrow: Gallery
  title: Gallery.
`;

export const DOWNLOADS_PAGE_YAML = `
seo:
  title: Downloads
  description: Downloads description.
hero:
  eyebrow: Downloads
  title: Downloads.
emptyText: No documents yet.
downloadLabel: Download Document
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
    "content/pages/about.yaml": ABOUT_YAML,
    "content/pages/why-us.yaml": WHY_US_YAML,
    "content/pages/contact.yaml": CONTACT_YAML,
    "content/pages/gallery.yaml": GALLERY_PAGE_YAML,
    "content/pages/downloads.yaml": DOWNLOADS_PAGE_YAML,
    "content/jobs.yaml": JOBS_YAML,
    "content/gallery.yaml": GALLERY_YAML,
    "content/downloads.yaml": DOWNLOADS_YAML,
    "public/media/brand/logo.svg": LOGO_SVG,
    "public/media/images/about.svg": LOGO_SVG,
    ...Object.fromEntries(CLIENT_KEYS.map((key) => [`public/media/clients/${key}.svg`, LOGO_SVG])),
  };
}
