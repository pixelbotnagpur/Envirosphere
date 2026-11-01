import Link from "next/link";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { cn } from "@/lib/utils";

/**
 * Renders owner-written Markdown with the site's tokens (rule 31).
 * - Safe by default: raw HTML in the source is NOT rendered, unsafe URL protocols are dropped,
 *   Markdown images are ignored (all media comes from content/media.yaml).
 * - Headings shift down one level: `#` renders as h2 so the page keeps its single h1.
 * - Body weight never exceeds 400: bold syntax is shown with an underline, italics with colour.
 */
const isExternal = (href: string) => /^https?:\/\//i.test(href);

type WithNode<T> = T & { node?: unknown };

/** Builds a react-markdown element renderer that drops `node` and merges token classes. */
function styled(Tag: ElementType, base: string) {
  return function Styled({ node, className, ...props }: { node?: unknown; className?: string; children?: ReactNode }) {
    void node;
    return <Tag className={cn(base, className)} {...props} />;
  };
}

const HEADING = "font-heading font-normal text-foreground first:mt-0";
const LIST = "mt-5 space-y-2 pl-6 text-lead font-light marker:text-primary";
const LINK = "text-primary underline decoration-border underline-offset-4 transition-colors hover:decoration-primary";
const STRONG = "font-normal underline decoration-accent underline-offset-4";
const H4 = styled("h4", `mt-8 text-lead ${HEADING}`);

const components: Components = {
  h1: styled("h2", `mt-12 text-h3 ${HEADING}`),
  h2: styled("h3", `mt-10 text-h4 ${HEADING}`),
  h3: H4,
  h4: H4,
  h5: H4,
  h6: H4,
  p: styled("p", "mt-5 text-lead font-light first:mt-0"),
  ul: styled("ul", `list-disc ${LIST}`),
  ol: styled("ol", `list-decimal ${LIST}`),
  li: styled("li", "pl-1"),
  strong: styled("strong", STRONG),
  b: styled("b", STRONG),
  em: styled("em", "font-normal text-primary not-italic"),
  th: styled("th", "font-normal"),
  blockquote: styled("blockquote", "mt-8 border-l-2 border-accent pl-6 text-lead font-light text-muted-foreground"),
  hr: styled("hr", "my-10 border-border"),
  a: ({ node, className, href = "", children, ...props }: WithNode<ComponentPropsWithoutRef<"a">>) => {
    void node;
    const classes = cn(LINK, className);
    if (isExternal(href)) {
      return (
        <a {...props} href={href} target="_blank" rel="noopener noreferrer" className={classes}>
          {children}
        </a>
      );
    }
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }
    return (
      <a {...props} href={href} className={classes}>
        {children}
      </a>
    );
  },
};

export interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn("text-foreground", className)}>
      <ReactMarkdown components={components} disallowedElements={["img"]} unwrapDisallowed>
        {children}
      </ReactMarkdown>
    </div>
  );
}
