import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Marquee } from "./marquee";

describe("Marquee", () => {
  it("renders the children twice for a seamless loop", () => {
    render(
      <Marquee>
        <span>Logo</span>
      </Marquee>,
    );
    expect(screen.getAllByText("Logo")).toHaveLength(2);
  });

  it("hides the duplicate copy from assistive tech", () => {
    render(
      <Marquee>
        <span>Logo</span>
      </Marquee>,
    );
    const [first, second] = screen.getAllByText("Logo");
    expect(first.parentElement).not.toHaveAttribute("aria-hidden");
    expect(second.parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("passes the speed to CSS and supports reverse", () => {
    const { container } = render(
      <Marquee speed={60} reverse>
        <span>Logo</span>
      </Marquee>,
    );
    const track = container.querySelector("[style]") as HTMLElement;
    expect(track.style.getPropertyValue("--marquee-duration")).toBe("60s");
    expect(track.className).toContain("[animation-direction:reverse]");
  });
});
