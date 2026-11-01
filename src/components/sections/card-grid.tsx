import { Reveal } from "@/components/motion/reveal";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/icon-names";
import { staggerDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface CardItem {
  icon?: IconName;
  /** Small uppercase line above the title ("label" cards only). */
  eyebrow?: string;
  title: string;
  text?: string;
}

export interface CardGridProps {
  items: CardItem[];
  /** "icon": round icon on top, then title. "label": small icon and eyebrow on one line, then title. */
  variant?: "icon" | "label";
  columns?: "two" | "three";
  /** Render a real list (ul/li) instead of plain boxes. */
  asList?: boolean;
  /** Heading level of each card title; pick the one under the heading of the section. */
  headingLevel?: 2 | 3;
  /** Seconds between the reveal of neighbouring cards. */
  stagger?: number;
  className?: string;
}

/** Equal-height cards in a grid. The `data-card-grid` / `data-card` hooks are used by the card-height e2e test. */
export function CardGrid({
  items,
  variant = "icon",
  columns = "two",
  asList = false,
  headingLevel = 2,
  stagger = 0.08,
  className,
}: CardGridProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const gridClass = cn(
    "grid gap-6",
    columns === "two" ? "md:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3",
    className,
  );

  const card = (item: CardItem) => (
    <div className="flex w-full flex-col justify-between rounded-card border border-border bg-background p-8">
      <div>
        {variant === "icon" ? (
          <>
            {item.icon ? (
              <div className="flex size-11 items-center justify-center rounded-pill bg-primary/10 text-primary">
                <Icon name={item.icon} className="size-5" />
              </div>
            ) : null}
            <Heading className="mt-6 text-h3 tracking-tight">{item.title}</Heading>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-label text-muted-foreground uppercase tracking-label">
              {item.icon ? <Icon name={item.icon} className="size-4 text-primary" /> : null}
              {item.eyebrow ? <span>{item.eyebrow}</span> : null}
            </div>
            <Heading className="mt-4 text-h3">{item.title}</Heading>
          </>
        )}
        {item.text ? (
          <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">{item.text}</p>
        ) : null}
      </div>
    </div>
  );

  if (asList) {
    return (
      <ul data-card-grid="" className={gridClass}>
        {items.map((item, index) => (
          <li key={item.title} data-card="" className="flex list-none">
            <Reveal delay={staggerDelay(index, stagger)} className="flex w-full">
              {card(item)}
            </Reveal>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div data-card-grid="" className={gridClass}>
      {items.map((item, index) => (
        <Reveal key={item.title} delay={staggerDelay(index, stagger)} data-card="" className="flex">
          {card(item)}
        </Reveal>
      ))}
    </div>
  );
}
