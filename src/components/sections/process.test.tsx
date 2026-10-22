import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Process } from "./process";

const steps = [
  { title: "Scoping", body: "We study the project." },
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
});
