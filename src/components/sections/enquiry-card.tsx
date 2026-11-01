export interface EnquiryCardProps {
  label: string;
  heading: string;
  intro: string;
  /** The form. */
  children: React.ReactNode;
}

/** White card with a heading above the enquiry form (left column of the Contact page). */
export function EnquiryCard({ label, heading, intro, children }: EnquiryCardProps) {
  return (
    <div className="lg:col-span-7">
      <div className="rounded-card border border-border bg-background p-8 sm:p-12 shadow-card">
        <span className="text-label text-muted-foreground uppercase tracking-label">{label}</span>
        <h2 className="mt-3 text-h2 tracking-tight">{heading}</h2>
        <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">{intro}</p>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
