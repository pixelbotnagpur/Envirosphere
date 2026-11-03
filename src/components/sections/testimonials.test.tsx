import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Testimonials } from "./testimonials";

const items = [
  { quote: "Timely clearance of EC.", name: "Shivali Phanse", role: "BDM" },
  { quote: "Right way and within timeline.", name: "Anurag Gupta", role: "Senior Manager" },
  { quote: "A true partnership.", name: "Abhishek Patil" },
];
const controls = { previous: "Previous testimonial", next: "Next testimonial", position: "Testimonial {current} of {total}" };
const props = { index: "007", label: "Client testimonials", heading: "In our clients' words.", items, controls };

const slides = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>("[data-slide]"));
const activeText = (container: HTMLElement) => slides(container).filter((s) => s.dataset.active === "true").map((s) => s.textContent);

describe("Testimonials slider", () => {
  it("shows one testimonial at a time: the first, with its author", () => {
    const { container } = render(<Testimonials {...props} />);
    expect(slides(container)).toHaveLength(3);
    expect(activeText(container)).toHaveLength(1);
    expect(activeText(container)[0]).toContain("Timely clearance of EC.");
    expect(activeText(container)[0]).toContain("Shivali Phanse");
    expect(activeText(container)[0]).toContain("BDM");
  });

  it("hides the other slides from assistive tech and from the keyboard", () => {
    const { container } = render(<Testimonials {...props} />);
    const [first, second, third] = slides(container);
    expect(first).toHaveAttribute("aria-hidden", "false");
    expect(first).not.toHaveAttribute("inert");
    for (const slide of [second, third]) {
      expect(slide).toHaveAttribute("aria-hidden", "true");
      expect(slide).toHaveAttribute("inert");
    }
  });

  it("moves to the next and previous testimonial with the buttons, and loops round", async () => {
    const user = userEvent.setup();
    const { container } = render(<Testimonials {...props} />);
    await user.click(screen.getByRole("button", { name: "Next testimonial" }));
    expect(activeText(container)[0]).toContain("Anurag Gupta");
    await user.click(screen.getByRole("button", { name: "Next testimonial" }));
    await user.click(screen.getByRole("button", { name: "Next testimonial" }));
    expect(activeText(container)[0]).toContain("Shivali Phanse");
    await user.click(screen.getByRole("button", { name: "Previous testimonial" }));
    expect(activeText(container)[0]).toContain("Abhishek Patil");
  });

  it("moves with the left and right arrow keys", () => {
    const { container } = render(<Testimonials {...props} />);
    const region = screen.getByRole("group", { name: "In our clients' words." });
    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(activeText(container)[0]).toContain("Anurag Gupta");
    fireEvent.keyDown(region, { key: "ArrowLeft" });
    fireEvent.keyDown(region, { key: "ArrowLeft" });
    expect(activeText(container)[0]).toContain("Abhishek Patil");
  });

  it("jumps straight to a testimonial from its bar, and marks the current one", async () => {
    const user = userEvent.setup();
    const { container } = render(<Testimonials {...props} />);
    const bars = screen.getAllByRole("button", { name: /^Testimonial \d of 3$/ });
    expect(bars).toHaveLength(3);
    expect(bars[0]).toHaveAttribute("aria-current", "true");
    await user.click(bars[2]);
    expect(activeText(container)[0]).toContain("Abhishek Patil");
    expect(bars[2]).toHaveAttribute("aria-current", "true");
    expect(bars[0]).toHaveAttribute("aria-current", "false");
  });

  it("shows which testimonial it is on, as a counter", async () => {
    const user = userEvent.setup();
    render(<Testimonials {...props} />);
    expect(screen.getByText("01 / 03")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next testimonial" }));
    expect(screen.getByText("02 / 03")).toBeInTheDocument();
  });

  it("is a labelled carousel whose slides know their position, in the words given by the content", () => {
    const { container } = render(<Testimonials {...props} />);
    const region = screen.getByRole("group", { name: "In our clients' words." });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    expect(slides(container)[1]).toHaveAttribute("aria-roledescription", "slide");
    expect(slides(container)[1]).toHaveAttribute("aria-label", "Testimonial 2 of 3");
  });

  it("copes with a missing role and shows initials as a decorative avatar", () => {
    const { container } = render(<Testimonials {...props} />);
    const last = slides(container)[2];
    expect(last).toHaveTextContent("Abhishek Patil");
    expect(last.querySelector("[aria-hidden='true']")).toHaveTextContent("AP");
  });

  it("works with a single testimonial", () => {
    const { container } = render(<Testimonials {...props} items={[items[0]]} />);
    expect(slides(container)).toHaveLength(1);
    expect(screen.getByText("01 / 01")).toBeInTheDocument();
  });

  it("keeps all slides in one grid cell so the section never changes height", () => {
    const { container } = render(<Testimonials {...props} />);
    for (const slide of slides(container)) expect(slide).toHaveClass("col-start-1", "row-start-1");
  });
});
