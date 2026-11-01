import { Download, FileText } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { staggerDelay } from "@/lib/motion";

export interface DownloadGridItem {
  id: string;
  title: string;
  category: string;
  format: string;
  size?: string;
  description: string;
  /** Address of the file. */
  href: string;
}

export interface DownloadGridProps {
  items: DownloadGridItem[];
  /** Shown instead of cards while there are no files. */
  emptyText: string;
  /** Text of the button on each card. */
  downloadLabel: string;
}

/** File cards with a download button; an honest empty message while the list is empty. */
export function DownloadGrid({ items, emptyText, downloadLabel }: DownloadGridProps) {
  return (
    <section className="border-t border-border bg-surface py-section">
      <Container>
        {items.length === 0 ? (
          <p className="mx-auto max-w-2xl rounded-card border border-border bg-background p-12 text-center text-sm font-light text-muted-foreground">
            {emptyText}
          </p>
        ) : null}
        <div data-card-grid="" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={item.id} delay={staggerDelay(index, 0.08)} data-card="" className="flex">
              <div className="h-full w-full rounded-card border border-border bg-background p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-pill border border-border bg-surface px-3 py-1 text-label uppercase tracking-label font-normal text-muted-foreground">
                      {item.category}
                    </span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {item.format} {item.size ? `• ${item.size}` : ""}
                    </span>
                  </div>

                  <div className="mt-6 flex size-11 items-center justify-center rounded-pill bg-primary/10 text-primary">
                    <FileText aria-hidden="true" className="size-5" />
                  </div>

                  <h2 className="mt-4 text-h4 tracking-tight">{item.title}</h2>
                  <p className="mt-3 text-sm text-muted-foreground font-light leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-border">
                  <Button asChild variant="outline" className="w-full">
                    <a href={item.href} download>
                      <Download aria-hidden="true" className="size-4 mr-2" />
                      {downloadLabel}
                    </a>
                  </Button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
