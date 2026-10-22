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

export default function HomePage() {
  const site = loadSite();
  const home = loadHome();
  const services = loadServices();

  const featuredDisciplines = [
    {
      title: "Environmental Clearances & EIA",
      tag: "[ STATUTORY & CONSENTS ]",
      summary:
        "Expert preparation and statutory representation for Category A & B projects under EIA Notification 2006, ensuring zero non-compliance.",
      href: "/services/environmental-clearance/",
      image: getImageAsset("hero-eco-architecture"),
    },
    {
      title: "Water & Effluent Treatment (ETP/STP)",
      tag: "[ WATER INFRASTRUCTURE ]",
      summary:
        "Turnkey civil-mechanical design, zero liquid discharge (ZLD) systems, and statutory consent management for industrial water treatment.",
      href: "/services/etp-stp-operation-maintenance/",
      image: getImageAsset("clean-water-facility"),
    },
    {
      title: "Green Masterplanning & Audits",
      tag: "[ ESG & INDUSTRIAL MASTERPLANNING ]",
      summary:
        "Comprehensive carbon footprinting, environmental audits, ecological surveys, and sustainable industrial park approvals.",
      href: "/services/environmental-audit/",
      image: getImageAsset("sustainable-industrial-park"),
    },
  ];

  const fieldArchiveItems = [
    {
      image: getImageAsset("photo-g18"),
      tag: "COASTAL / MARINE",
      caption:
        "Offshore marine water and benthic sampling over vessel side for baseline environmental impact assessment.",
    },
    {
      image: getImageAsset("photo-g22"),
      tag: "FOREST / BIODIVERSITY",
      caption:
        "Ecological quadrat survey recording floral and faunal biodiversity for statutory conservation planning.",
    },
    {
      image: getImageAsset("photo-g16"),
      tag: "LABORATORY / SOIL",
      caption:
        "Soil strata sampling and certified physical-chemical testing in accredited analytical laboratories.",
    },
    {
      image: getImageAsset("photo-g21"),
      tag: "PUNE / HEADQUARTERS",
      caption:
        "Directorate cabin and statutory GIS modeling facilities at the Envirosphere technical office in Pune.",
    },
  ];

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
      />
      <About
        index="001"
        label={home.about.label}
        heading={home.about.heading}
        paragraphs={home.about.paragraphs}
        image={getImageAsset("ecological-survey")}
        cta={home.about.cta}
      />
      <VisualBreak
        image={getImageAsset("clean-water-facility")}
        quote="Engineering at the nexus of ecological preservation and industrial expansion."
        tag="PAN-INDIA STATUTORY PRACTICE"
        location="PUNE • MUMBAI • DELHI • PAN-INDIA"
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
        label="FIELD OPERATIONS"
        heading="On-site empirical rigor across marine, forest, and industrial domains."
        body="Our multidisciplinary teams conduct baseline monitoring, ambient environmental sampling, and regulatory inspections directly in the field."
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
