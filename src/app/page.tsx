import type { Metadata } from "next";
import { About } from "@/components/sections/about";
import { Clients } from "@/components/sections/clients";
import { ContactCta } from "@/components/sections/contact-cta";
import { FieldArchive } from "@/components/sections/field-archive";
import { Hero } from "@/components/sections/hero";
import { Process } from "@/components/sections/process";
import { ServicesIndex } from "@/components/sections/services-index";
import { Stats } from "@/components/sections/stats";
import { Testimonials } from "@/components/sections/testimonials";
import { VisualBreak } from "@/components/sections/visual-break";
import { getImageAsset, loadHome, loadServices, loadSite } from "@/lib/content";
import { pageSeo } from "@/lib/page-seo";

export function generateMetadata(): Metadata {
  return pageSeo("/");
}

export default function HomePage() {
  const site = loadSite();
  const home = loadHome();
  const services = loadServices();

  const bySlug = (slug: string) => services.find((service) => service.slug === slug);
  const featuredSpecs = [
    { slug: "environmental-clearance", tag: "[ STATUTORY & CONSENTS ]", image: "hero-eco-architecture" },
    { slug: "water-wastewater-treatment", tag: "[ WATER ]", image: "clean-water-facility" },
    { slug: "environmental-audit", tag: "[ AUDITS ]", image: "sustainable-industrial-park" },
  ];
  const featuredDisciplines = featuredSpecs.flatMap(({ slug, tag, image }) => {
    const service = bySlug(slug);
    return service
      ? [
          {
            title: service.title,
            tag,
            summary: service.summary,
            href: `/services/${slug}/`,
            image: getImageAsset(image),
          },
        ]
      : [];
  });

  const fieldArchiveItems = [
    { image: getImageAsset("photo-g18"), tag: "MARINE", caption: "Water sampling over the side of a vessel at sea." },
    { image: getImageAsset("photo-g22"), tag: "FOREST", caption: "Recording vegetation data inside a forest quadrat." },
    { image: getImageAsset("photo-g16"), tag: "SAMPLING", caption: "A bagged and labelled sediment sample." },
    { image: getImageAsset("photo-g21"), tag: "PUNE OFFICE", caption: "An executive cabin at the Pune office." },
  ];

  const stats = home.stats.items.map((item) => ({ value: `${item.value}${item.suffix}`, label: item.label }));
  const cities = site.offices.map((office) => office.city);

  return (
    <>
      <Hero
        eyebrow={home.hero.eyebrow}
        title={home.hero.title}
        subtitle={home.hero.subtitle}
        primaryCta={home.hero.primaryCta}
        secondaryCta={home.hero.secondaryCta}
        scrollLabel={home.hero.scrollLabel}
        backgroundImage={getImageAsset("hero-eco-architecture")}
        highlights={stats.slice(0, 2).map((item) => `${item.value} ${item.label}`)}
        locations={cities}
      />
      <About
        index="001"
        label={home.about.label}
        heading={home.about.heading}
        paragraphs={home.about.paragraphs}
        image={getImageAsset("ecological-survey")}
        cta={home.about.cta}
        accreditations={site.accreditations.map((item) => item.label)}
        highlight={stats[0]}
      />
      <VisualBreak
        image={getImageAsset("clean-water-facility")}
        location={cities.join(" • ").toUpperCase()}
      />
      <ServicesIndex
        index="002"
        label={home.services.label}
        heading={home.services.heading}
        intro={home.services.intro}
        cta={home.services.cta}
        services={services.map(({ slug, title, summary }) => ({ slug, title, summary }))}
        featured={featuredDisciplines}
      />
      <Stats index="003" label={home.stats.label} items={home.stats.items} locale={site.locale} />
      <Clients
        index="004"
        label={home.clients.label}
        heading={home.clients.heading}
        logos={home.clients.logos.map(getImageAsset)}
      />
      <FieldArchive
        index="005"
        items={fieldArchiveItems}
      />
      <Process
        index="006"
        label={home.process.label}
        heading={home.process.heading}
        steps={home.process.steps}
      />
      <Testimonials
        index="007"
        label={home.testimonials.label}
        heading={home.testimonials.heading}
        items={home.testimonials.items}
      />
      <ContactCta
        index="008"
        label={home.contact.label}
        heading={home.contact.heading}
        body={home.contact.body}
        primaryCta={home.contact.primaryCta}
        phone={site.contact.phones[0]}
        email={site.contact.email}
        phoneLabel={home.contact.phoneLabel}
        emailLabel={home.contact.emailLabel}
      />
    </>
  );
}
