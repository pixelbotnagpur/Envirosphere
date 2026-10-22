import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Testimonials } from "./testimonials";

const items = [
  { quote: "Timely clearance of EC.", name: "Shivali Phanse", role: "BDM" },
  { quote: "Right way and within timeline.", name: "Anurag Gupta", role: "Senior Manager" },
  { quote: "A true partnership.", name: "Abhishek Patil" },
];

describe("Testimonials", () => {
  it("renders each quote with its author", () => {
    render(<Testimonials index="006" label="Client testimonials" heading="In our clients' words." items={items} />);
    expect(screen.getAllByRole("blockquote")).toHaveLength(3);
    expect(screen.getByText("Shivali Phanse")).toBeInTheDocument();
    expect(screen.getByText(/Senior Manager/)).toBeInTheDocument();
  });

  it("copes with a missing role", () => {
    render(<Testimonials index="006" label="L" heading="H" items={items} />);
    expect(screen.getByText("Abhishek Patil")).toBeInTheDocument();
  });
});
