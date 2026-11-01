import type { Metadata } from "next";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { ContactAside, type ContactLine } from "@/components/sections/contact-aside";
import { EnquiryCard } from "@/components/sections/enquiry-card";
import { PageHero } from "@/components/sections/page-hero";
import { Container } from "@/components/ui/container";
import { loadContactPage, loadForms, loadServices, loadSite } from "@/lib/content";
import { mailtoHref, telHref } from "@/lib/links";
import { pageMetadata } from "@/lib/page-seo";

export function generateMetadata(): Metadata {
  return pageMetadata("/contact/", loadContactPage().seo);
}

export default function ContactPage() {
  const page = loadContactPage();
  const site = loadSite();
  const services = loadServices();

  // Phone numbers and email are typed once, in site.yaml; the labels come from the page file.
  const lines: ContactLine[] = [
    ...page.direct.phoneLabels.flatMap((label, index): ContactLine[] => {
      const phone = site.contact.phones[index];
      return phone ? [{ kind: "phone", label, value: phone, href: telHref(phone) }] : [];
    }),
    {
      kind: "email",
      label: page.direct.emailLabel,
      value: site.contact.email,
      href: mailtoHref(site.contact.email, page.direct.emailSubject),
    },
  ];

  return (
    <div>
      <PageHero {...page.hero} />

      <section className="border-t border-border bg-surface py-section">
        <Container className="grid gap-16 lg:grid-cols-12">
          <EnquiryCard {...page.enquiry}>
            <InquiryForm
              copy={loadForms()}
              services={services}
              phoneFallback={site.contact.phones[0]}
              emailFallback={site.contact.email}
              className="space-y-6"
            />
          </EnquiryCard>

          <ContactAside
            direct={{ heading: page.direct.heading, intro: page.direct.intro, lines }}
            headOffice={{
              label: page.headOffice.label,
              heading: page.headOffice.heading,
              address: site.contact.address,
            }}
            branches={{
              label: page.branches.label,
              heading: page.branches.heading,
              items: site.offices
                .filter((office) => office.city !== page.headOffice.city)
                .map((office) => `${office.city} ${page.branches.itemSuffix}`),
            }}
          />
        </Container>
      </section>
    </div>
  );
}
