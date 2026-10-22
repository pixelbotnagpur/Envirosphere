import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Clients } from "./clients";

const logos = ["A", "B", "C", "D"].map((name) => ({
  src: `/media/clients/${name}.webp`,
  alt: `${name} logo`,
  width: 480,
  height: 200,
}));

describe("Clients", () => {
  it("shows the heading and every logo with alt text", () => {
    render(<Clients index="004" label="Clients" heading="Organisations we have worked with." logos={logos} />);
    expect(screen.getByRole("heading", { level: 2, name: /Organisations we have worked with/ })).toBeInTheDocument();
    for (const logo of logos) expect(screen.getAllByAltText(logo.alt).length).toBeGreaterThan(0);
  });

  it("hides the looping duplicate logos from assistive tech", () => {
    const { container } = render(
      <Clients index="004" label="Clients" heading="Organisations." logos={logos} />,
    );
    expect(container.querySelectorAll("[aria-hidden='true']").length).toBeGreaterThan(0);
  });
});
