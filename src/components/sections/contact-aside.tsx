import { Building2, Mail, MapPin, Phone } from "lucide-react";

export interface ContactLine {
  kind: "phone" | "email";
  label: string;
  value: string;
  href: string;
}

export interface ContactAsideProps {
  direct: { heading: string; intro: string; lines: ContactLine[] };
  headOffice: { label: string; heading: string; address: string };
  branches: { label: string; heading: string; items: string[] };
}

const lineStyle =
  "flex items-center gap-4 rounded-control border border-border bg-surface p-4 transition-colors hover:border-primary/50";

/** Right-hand column of the Contact page: phone and email, head office and branch list. */
export function ContactAside({ direct, headOffice, branches }: ContactAsideProps) {
  return (
    <div className="lg:col-span-5 space-y-8">
      <div className="rounded-card border border-border bg-background p-8">
        <h3 className="text-h3">{direct.heading}</h3>
        <p className="mt-2 text-sm text-muted-foreground font-light">{direct.intro}</p>

        <div className="mt-6 space-y-4">
          {direct.lines.map((line) => {
            const LineIcon = line.kind === "phone" ? Phone : Mail;
            return (
              <a key={`${line.kind}-${line.value}`} href={line.href} className={lineStyle}>
                <div className="flex size-10 items-center justify-center rounded-pill bg-primary/10 text-primary">
                  <LineIcon aria-hidden="true" className="size-4" />
                </div>
                <div>
                  <span className="block text-label uppercase tracking-label text-muted-foreground">
                    {line.label}
                  </span>
                  <span className="text-sm font-normal text-foreground">{line.value}</span>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      <div className="rounded-card border border-border bg-background p-8">
        <div className="flex items-center gap-2 text-label text-muted-foreground uppercase tracking-label">
          <Building2 aria-hidden="true" className="size-4 text-primary" />
          <span>{headOffice.label}</span>
        </div>
        <h3 className="mt-3 text-h3">{headOffice.heading}</h3>
        <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">{headOffice.address}</p>
      </div>

      <div className="rounded-card border border-border bg-background p-8">
        <span className="text-label text-muted-foreground uppercase tracking-label">{branches.label}</span>
        <h4 className="mt-2 text-h4">{branches.heading}</h4>
        <ul className="mt-4 grid grid-cols-2 gap-3 text-sm text-foreground/80 font-light">
          {branches.items.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-3.5 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
