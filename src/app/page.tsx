import { About } from "@/components/sections/about";
import { Clients } from "@/components/sections/clients";
import { ContactCta } from "@/components/sections/contact-cta";
import { Hero } from "@/components/sections/hero";
import { Process } from "@/components/sections/process";
import { ServicesIndex } from "@/components/sections/services-index";
import { Stats } from "@/components/sections/stats";
import { Testimonials } from "@/components/sections/testimonials";
import { getImageAsset, loadHome, loadServices, loadSite } from "@/lib/content";

export default function HomePage() {
  const site = loadSite();
  const home = loadHome();
  const services = loadServices();

  return (
    <>
      <Hero
        eyebrow={home.hero.eyebrow}
        title={home.hero.title}
        subtitle={home.hero.subtitle}
        primaryCta={home.hero.primaryCta}
        secondaryCta={home.hero.secondaryCta}
        scrollLabel={home.hero.scrollLabel}
      />
      <About
        index="001"
        label={home.about.label}
        heading={home.about.heading}
        paragraphs={home.about.paragraphs}
        image={getImageAsset(home.about.image)}
        cta={home.about.cta}
      />
      <ServicesIndex
        index="002"
        label={home.services.label}
        heading={home.services.heading}
        intro={home.services.intro}
        cta={home.services.cta}
        services={services.map(({ slug, title, summary }) => ({ slug, title, summary }))}
      />
      <Stats index="003" label={home.stats.label} items={home.stats.items} locale={site.locale} />
      <Clients
        index="004"
        label={home.clients.label}
        heading={home.clients.heading}
        logos={home.clients.logos.map(getImageAsset)}
      />
      <Process
        index="005"
        label={home.process.label}
        heading={home.process.heading}
        steps={home.process.steps}
      />
      <Testimonials
        index="006"
        label={home.testimonials.label}
        heading={home.testimonials.heading}
        items={home.testimonials.items}
      />
      <ContactCta
        index="007"
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
