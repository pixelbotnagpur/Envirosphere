import { SectionLabel } from "@/components/ui/section-label";

export interface OpeningsHeaderProps {
  index?: string;
  label: string;
  heading: string;
  /** Shown on the right, for example the number of open positions. */
  note?: string;
}

/** Label and heading of the job list, with an optional note on the right. */
export function OpeningsHeader({ index, label, heading, note }: OpeningsHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-6 border-b border-border pb-12 sm:flex-row sm:items-end">
      <div>
        <SectionLabel index={index}>{label}</SectionLabel>
        <h2 className="mt-6 text-h2 tracking-tight">{heading}</h2>
      </div>
      {note ? <span className="text-sm font-light text-muted-foreground">{note}</span> : null}
    </div>
  );
}
