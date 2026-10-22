import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("uses the primary token by default", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveClass("bg-primary", "text-primary-foreground");
  });

  it.each([
    ["secondary", "bg-secondary"],
    ["accent", "bg-accent"],
    ["outline", "border-current"],
  ] as const)("variant %s", (variant, expected) => {
    render(<Button variant={variant}>Go</Button>);
    expect(screen.getByRole("button")).toHaveClass(expected);
  });

  it("merges className over size defaults", () => {
    render(<Button className="px-10">Go</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("px-10");
    expect(button).not.toHaveClass("px-6");
  });

  it("renders the child element with asChild", () => {
    render(
      <Button asChild>
        <a href="/contact/">Contact</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Contact" })).toHaveClass("bg-primary");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("forwards native props", () => {
    render(<Button disabled type="submit">Send</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
