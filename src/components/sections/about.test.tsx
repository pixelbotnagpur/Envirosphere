import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { About } from "./about";

const props = {
  index: "001",
  label: "About us",
  heading: "Strategic planning for clearances",
  paragraphs: ["First paragraph.", "Second paragraph."],
  image: { src: "/media/images/about.webp", alt: "A green globe", width: 1600, height: 2000 },
  cta: { label: "More about us", href: "/about/" },
};

describe("About", () => {
  it("renders the heading, every paragraph and the call to action", () => {
    render(<About {...props} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(props.heading);
    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "More about us" })).toHaveAttribute("href", "/about/");
  });

  it("renders the photo with its alt text and the numbered label", () => {
    render(<About {...props} />);
    expect(screen.getByRole("img", { name: "A green globe" })).toBeInTheDocument();
    expect(screen.getByText(/001 \/ About us/)).toBeInTheDocument();
  });

  it("shows accreditations and the highlight only when given", () => {
    const { rerender } = render(
      <About {...props} accreditations={["QCI NABET Accredited (Cat A)"]} highlight={{ value: "250+", label: "Clients" }} />,
    );
    expect(screen.getByText("QCI NABET Accredited (Cat A)")).toBeInTheDocument();
    expect(screen.getByText("250+")).toBeInTheDocument();
    rerender(<About {...props} />);
    expect(screen.queryByText("250+")).toBeNull();
    expect(screen.queryByText(/NABET/)).toBeNull();
  });
});
