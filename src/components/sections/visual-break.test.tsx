import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VisualBreak } from "./visual-break";

const image = { src: "/media/water.webp", alt: "A water treatment site", width: 1376, height: 768 };

const renderBreak = () =>
  render(
    <VisualBreak image={image} title="What we offer" location="PUNE • MUMBAI">
      <section>Services below</section>
    </VisualBreak>,
  );

describe("VisualBreak", () => {
  it("pins a full-screen photo to the top of the screen", () => {
    const { container } = renderBreak();
    const stage = container.querySelector("img")!.closest(".sticky");
    expect(stage).toHaveClass("sticky", "top-0", "h-dvh", "overflow-hidden");
    expect(screen.getByRole("img", { name: image.alt })).toBeInTheDocument();
  });

  it("keeps the pinned photo behind the section that follows (the window)", () => {
    const { container } = renderBreak();
    const stage = container.querySelector(".sticky");
    const windowEl = container.querySelector("[data-window]");
    expect(stage).toHaveClass("z-0");
    expect(windowEl).toHaveClass("relative", "z-10");
    expect(windowEl).toHaveTextContent("Services below");
    // Source order: photo, then the spare scroll, then the window.
    const order = Array.from(container.firstElementChild!.children).map((el) =>
      el.matches(".sticky") ? "stage" : el.hasAttribute("data-runway") ? "runway" : el.hasAttribute("data-window") ? "window" : "?",
    );
    expect(order).toEqual(["stage", "runway", "window"]);
  });

  it("leaves one extra screen of scrolling while the photo is pinned", () => {
    const { container } = renderBreak();
    const runway = container.querySelector("[data-runway]");
    expect(runway).toHaveClass("h-dvh");
    expect(runway).toHaveAttribute("aria-hidden", "true");
  });

  it("starts with the big title hidden behind a mask, ready to be revealed on scroll", () => {
    const { container } = renderBreak();
    const title = container.querySelector("[data-reveal-title]") as HTMLElement;
    expect(title).toHaveTextContent("What we offer");
    expect(title.style.clipPath).toMatch(/inset\(100%/);
  });

  it("centers the big title on the screen, at the mega size", () => {
    const { container } = renderBreak();
    const title = container.querySelector("[data-reveal-title]") as HTMLElement;
    expect(title).toHaveClass("text-mega");
    expect(title).not.toHaveClass("text-display");
    expect(title.closest("[aria-hidden='true']")).toHaveClass("flex", "items-center", "justify-center");
    expect(title.parentElement).toHaveClass("text-center");
  });

  it("keeps the big title decorative so it adds no heading of its own", () => {
    const { container } = renderBreak();
    expect(container.querySelector("[data-reveal-title]")!.closest("[aria-hidden='true']")).not.toBeNull();
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("falls back to a plain photo band for people who prefer reduced motion", () => {
    const { container } = renderBreak();
    expect(container.querySelector(".sticky")).toHaveClass("motion-reduce:static", "motion-reduce:h-[70dvh]");
    expect(container.querySelector("[data-runway]")).toHaveClass("motion-reduce:hidden");
  });

  it("shows the offices strip on the photo and leaves out the title when none is given", () => {
    const { container } = render(<VisualBreak image={image} location="PUNE">{null}</VisualBreak>);
    expect(container).toHaveTextContent("PUNE");
    expect(container.querySelector("[data-reveal-title]")).toBeNull();
  });
});
