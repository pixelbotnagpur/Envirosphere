import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServicesIndex } from "./services-index";

const props = {
  index: "002",
  label: "What we offer",
  heading: "Thirteen services",
  intro: "From clearances to plants.",
  cta: { label: "All services", href: "/services/" },
  viewLabel: "View details",
  services: [
    { slug: "environmental-clearance", title: "Environmental Clearance (EIA)", summary: "EIA and clearance." },
    { slug: "water-audit", title: "Water Audit", summary: "Water audits." },
  ],
};

const image = { src: "/media/a.jpg", alt: "A", width: 10, height: 10 };

describe("ServicesIndex", () => {
  it("renders the featured cards with the label it is given", () => {
    render(
      <ServicesIndex
        {...props}
        featured={[{ title: "Audit", tag: "[ AUDITS ]", summary: "Audits.", href: "/services/water-audit/", image }]}
      />,
    );
    const card = screen.getByRole("link", { name: /Audit.*View details/s });
    expect(card).toHaveAttribute("href", "/services/water-audit/");
    expect(screen.getByText("[ AUDITS ]")).toBeInTheDocument();
  });

  it("renders one numbered link per service to its own page", () => {
    render(<ServicesIndex {...props} />);
    const link = screen.getByRole("link", { name: /Environmental Clearance \(EIA\)/ });
    expect(link).toHaveAttribute("href", "/services/environmental-clearance/");
    expect(link).toHaveTextContent("001");
    expect(screen.getByRole("link", { name: /Water Audit/ })).toHaveTextContent("002");
  });

  it("renders the section heading and the all-services link", () => {
    render(<ServicesIndex {...props} />);
    expect(screen.getByRole("heading", { level: 2, name: /Thirteen services/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All services" })).toHaveAttribute("href", "/services/");
  });
});
