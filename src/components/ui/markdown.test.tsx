import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown } from "./markdown";

const BOLD = /(^|\s)font-(medium|semibold|bold|extrabold|black)(\s|$)/;

describe("Markdown", () => {
  it("shifts heading levels down so the page keeps one h1", () => {
    const { container } = render(<Markdown>{"# One\n\n## Two\n\n### Three"}</Markdown>);
    expect(container.querySelectorAll("h1")).toHaveLength(0);
    expect(screen.getByRole("heading", { level: 2, name: "One" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Two" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Three" })).toBeInTheDocument();
  });

  it("styles headings with the heading font and token sizes, never bold", () => {
    render(<Markdown>{"# One\n\n## Two"}</Markdown>);
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2).toHaveClass("font-heading", "text-h3", "font-normal");
    expect(screen.getByRole("heading", { level: 3 })).toHaveClass("font-heading", "text-h4");
  });

  it("renders paragraphs with the lead size and light weight", () => {
    render(<Markdown>{"Hello world"}</Markdown>);
    expect(screen.getByText("Hello world")).toHaveClass("text-lead", "font-light");
  });

  it("renders unordered and ordered lists with items", () => {
    const { container } = render(<Markdown>{"- a\n- b\n\n1. x\n2. y"}</Markdown>);
    expect(container.querySelectorAll("ul > li")).toHaveLength(2);
    expect(container.querySelectorAll("ol > li")).toHaveLength(2);
    expect(container.querySelector("ul")).toHaveClass("list-disc");
    expect(container.querySelector("ol")).toHaveClass("list-decimal");
  });

  it("opens external links in a new tab with safe rel, keeps internal links in-page", () => {
    render(<Markdown>{"[out](https://example.com/x) and [in](/contact/) and [mail](mailto:a@b.co)"}</Markdown>);
    const out = screen.getByRole("link", { name: "out" });
    expect(out).toHaveAttribute("href", "https://example.com/x");
    expect(out).toHaveAttribute("target", "_blank");
    expect(out.getAttribute("rel")).toMatch(/noopener/);
    expect(out.getAttribute("rel")).toMatch(/noreferrer/);
    const inn = screen.getByRole("link", { name: "in" });
    expect(inn).toHaveAttribute("href", "/contact/");
    expect(inn).not.toHaveAttribute("target");
    expect(screen.getByRole("link", { name: "mail" })).not.toHaveAttribute("target");
    expect(out).toHaveClass("underline");
  });

  it("drops unsafe link protocols", () => {
    render(<Markdown>{"[bad](javascript:alert(1))"}</Markdown>);
    const link = screen.getByText("bad");
    expect(link.getAttribute("href") ?? "").not.toMatch(/javascript/i);
  });

  it("renders bold and italic syntax without bold weight classes", () => {
    const { container } = render(<Markdown>{"**strong** and __also__ and *em*"}</Markdown>);
    const strong = container.querySelector("strong");
    expect(strong).toHaveClass("font-normal", "underline");
    expect(container.innerHTML).not.toMatch(BOLD);
    expect(container.querySelector("em")).toHaveClass("font-normal");
  });

  it("renders blockquote and hr with token classes", () => {
    const { container } = render(<Markdown>{"> quoted\n\n---\n\nafter"}</Markdown>);
    expect(container.querySelector("blockquote")).toHaveClass("border-l-2");
    expect(container.querySelector("hr")).toHaveClass("border-border");
  });

  it("does not render raw HTML from the Markdown source", () => {
    const { container } = render(
      <Markdown>{'<b>bold</b> <script>alert(1)</script> <div class="x">d</div>\n\n<img src="x.png">'}</Markdown>,
    );
    expect(container.querySelector("b")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("div.x")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("ignores Markdown images (media comes from media.yaml)", () => {
    const { container } = render(<Markdown>{"![alt](https://example.com/a.png)"}</Markdown>);
    expect(container.querySelector("img")).toBeNull();
  });

  it("merges a custom className on the wrapper", () => {
    const { container } = render(<Markdown className="max-w-3xl">{"x"}</Markdown>);
    expect(container.firstElementChild).toHaveClass("max-w-3xl");
  });
});
