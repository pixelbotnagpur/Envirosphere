import { cn } from "@/lib/utils";

export interface MarqueeProps extends React.ComponentProps<"div"> {
  /** Seconds for one full loop. */
  speed?: number;
  reverse?: boolean;
}

/** Endless horizontal loop in pure CSS. Pauses on hover; static and scrollable with reduced motion. */
export function Marquee({ speed = 40, reverse = false, className, children, ...props }: MarqueeProps) {
  return (
    <div
      className={cn(
        "group flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:overflow-x-auto",
        className,
      )}
      {...props}
    >
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1 ? true : undefined}
          style={{ "--marquee-duration": `${speed}s` } as React.CSSProperties}
          className={cn(
            "flex min-w-full shrink-0 animate-marquee items-center justify-around gap-16 pr-16 group-hover:[animation-play-state:paused] motion-reduce:animate-none",
            reverse && "[animation-direction:reverse]",
            copy === 1 && "motion-reduce:hidden",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
