import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./input";
import { Select } from "./select";
import { Textarea } from "./textarea";

describe("Input, Textarea, Select primitives", () => {
  it("renders Input with native attributes and error state", () => {
    render(<Input placeholder="Your name" hasError required name="fullName" />);
    const input = screen.getByPlaceholderText("Your name");
    expect(input).toBeInTheDocument();
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveClass("border-destructive");
  });

  it("renders Textarea with native attributes and default rows", () => {
    render(<Textarea placeholder="Your message" hasError={false} name="message" />);
    const textarea = screen.getByPlaceholderText("Your message");
    expect(textarea).toBeInTheDocument();
    expect(textarea).not.toHaveAttribute("aria-invalid");
    expect(textarea).toHaveClass("border-border");
  });

  it("renders Select with option children", () => {
    render(
      <Select name="service" aria-label="Service">
        <option value="ec">Environmental Clearance</option>
        <option value="audit">Water Audit</option>
      </Select>,
    );
    const select = screen.getByRole("combobox", { name: "Service" });
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Environmental Clearance" })).toBeInTheDocument();
  });
});
