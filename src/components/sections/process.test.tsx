import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Process } from "./process";

const picture = { src: "/media/scoping.webp", alt: "Scoping photo", width: 736, height: 1000 };

const steps = [
  { title: "Scoping", body: "We study the project.", image: picture },
  { title: "Assessment", body: "Specialists carry out studies." },
  { title: "Submission", body: "We file the applications." },
];

describe("Process", () => {
  it("renders every step in order as a numbered list (stacked baseline)", () => {
    render(<Process index="005" label="How we work" heading="From study to consent." steps={steps} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Scoping");
    expect(items[2]).toHaveTextContent("We file the applications.");
  });

  it("has one h2 for the section and one h3 per step", () => {
    render(<Process index="005" label="How we work" heading="From study to consent." steps={steps} />);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
  });

  it("puts a picture above each step in the stacked layout, a placeholder when a step has none", () => {
    const { container } = render(<Process index="005" label="How we work" heading="From study to consent." steps={steps} />);
    const frames = container.querySelectorAll("[data-process-image]");
    expect(frames).toHaveLength(3);
    expect(frames[0].querySelector("img")).not.toBeNull();
    expect(frames[1].querySelector("[data-placeholder]")).not.toBeNull();
    expect(frames[1].querySelector("img")).toBeNull();
  });

  it("keeps the pictures decorative and starts them behind a mask", () => {
    const { container } = render(<Process index="005" label="How we work" heading="From study to consent." steps={steps} />);
    const first = container.querySelector("[data-process-image]") as HTMLElement;
    expect(first.closest("[aria-hidden='true']")).not.toBeNull();
    expect(first.querySelector("img")).toHaveAttribute("alt", "");
    // Hidden below its box until it scrolls into view (a transform mask, not a clip-path).
    expect(first.style.transform).toMatch(/translateY\(100%\)/);
    expect(first.style.clipPath).toBe("");
  });

  it("loads the pictures up front at low priority, so a hidden picture is never blank when revealed", () => {
    const { container } = render(<Process index="005" label="How we work" heading="From study to consent." steps={steps} />);
    const img = container.querySelector("[data-process-image] img");
    expect(img).toHaveAttribute("loading", "eager");
    expect(img).toHaveAttribute("fetchpriority", "low");
  });

  it("shows the finished picture at once for people who prefer reduced motion", () => {
    const { container } = render(<Process index="005" label="How we work" heading="From study to consent." steps={steps} />);
    expect(container.querySelector("[data-process-image]")).toHaveClass("static-when-reduced");
  });
});
