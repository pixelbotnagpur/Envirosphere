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
import { getImageAsset, loadHome, loadServices, loadSite, resolveFeaturedServices } from "@/lib/content";
import { pageSeo } from "@/lib/page-seo";

export function generateMetadata(): Metadata {
  const { seo } = loadHome();
  // The Home title is the whole title (no "| Envirosphere" suffix), as written in home.yaml.
  return { title: { absolute: seo.title }, description: seo.description, ...pageSeo("/") };
}

export default function HomePage() {
  const site = loadSite();
  const home = loadHome();
  const services = loadServices();

  const featuredDisciplines = resolveFeaturedServices(home, services).map(
    ({ title, tag, summary, href, image }) => ({ title, tag, summary, href, image: getImageAsset(image) }),
  );
  const fieldArchiveItems = home.fieldArchive.items.map((item) => ({
    image: getImageAsset(item.image),
    tag: item.tag,
    caption: item.caption,
  }));

  const stats = home.stats.items.map((item) => ({ value: `${item.value}${item.suffix}`, label: item.label }));
  const highlights = home.hero.highlights.flatMap((label) => {
    const stat = stats.find((item) => item.label === label);
    return stat ? [`${stat.value} ${stat.label}`] : [];
  });
  const cities = site.offices.map((office) => office.city);
  const { visualBreak } = home;

  return (
    <>
      <Hero
        eyebrow={home.hero.eyebrow}
        title={home.hero.title}
        subtitle={home.hero.subtitle}
        primaryCta={home.hero.primaryCta}
        secondaryCta={home.hero.secondaryCta}
        scrollLabel={home.hero.scrollLabel}
        backgroundImage={home.hero.image ? getImageAsset(home.hero.image) : undefined}
        highlights={highlights}
        keywords={home.hero.keywords}
        locations={cities}
      />
      <About
        index="001"
        label={home.about.label}
        heading={home.about.heading}
        paragraphs={home.about.paragraphs}
        image={getImageAsset(home.about.image)}
        cta={home.about.cta}
        accreditations={site.accreditations.map((item) => item.label)}
        highlight={stats[0]}
      />
      <VisualBreak
        image={getImageAsset(visualBreak.image)}
        tag={visualBreak.tag}
        quote={visualBreak.quote}
        location={visualBreak.showOffices ? cities.join(" • ").toUpperCase() : undefined}
      />
      <ServicesIndex
        index="002"
        label={home.services.label}
        heading={home.services.heading}
        intro={home.services.intro}
        cta={home.services.cta}
        viewLabel={home.services.viewLabel}
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
        label={home.fieldArchive.label}
        heading={home.fieldArchive.heading}
        body={home.fieldArchive.body}
        topCta={home.fieldArchive.topCta}
        bottomCta={home.fieldArchive.bottomCta}
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
