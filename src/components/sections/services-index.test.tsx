import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ServicesIndex } from "./services-index";

const photo = { src: "/media/clearance.webp", alt: "Clearance photo", width: 800, height: 600 };

const props = {
  index: "002",
  label: "What we offer",
  heading: "Thirteen services",
  intro: "From clearances to plants.",
  cta: { label: "All services", href: "/services/" },
  services: [
    { slug: "environmental-clearance", title: "Environmental Clearance (EIA)", summary: "EIA and clearance.", image: photo },
    { slug: "water-audit", title: "Water Audit", summary: "Water audits." },
  ],
};

// next/image may wrap the file in /_next/image?url=... outside the static export.
const showsFile = (img: Element | null | undefined, src: string) => {
  const used = img?.getAttribute("src") ?? "";
  return used.includes(src) || used.includes(encodeURIComponent(src));
};

describe("ServicesIndex", () => {
  it("renders one numbered link per service to its own page", () => {
    render(<ServicesIndex {...props} />);
    const link = screen.getByRole("link", { name: /Environmental Clearance \(EIA\)/ });
    expect(link).toHaveAttribute("href", "/services/environmental-clearance/");
    expect(link).toHaveTextContent("001");
    expect(screen.getByRole("link", { name: /Water Audit/ })).toHaveTextContent("002");
  });

  it("shows only the numbered rows: no photo cards above them", () => {
    const { container } = render(<ServicesIndex {...props} />);
    expect(container.querySelectorAll("[data-card-grid], [data-card]")).toHaveLength(0);
    expect(screen.getAllByRole("listitem")).toHaveLength(props.services.length);
  });

  it("shows no bracketed label when none is given: heading, intro and the button stay", () => {
    render(<ServicesIndex {...props} label={undefined} />);
    expect(screen.queryByText(/What we offer/)).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: /Thirteen services/ })).toBeInTheDocument();
    expect(screen.getByText("From clearances to plants.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All services" })).toBeInTheDocument();
  });

  it("still shows the label when one is given", () => {
    render(<ServicesIndex {...props} />);
    expect(screen.getByText(/What we offer/)).toBeInTheDocument();
  });

  it("renders the section heading and the all-services link", () => {
    render(<ServicesIndex {...props} />);
    expect(screen.getByRole("heading", { level: 2, name: /Thirteen services/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All services" })).toHaveAttribute("href", "/services/");
  });

  describe("a row has five columns, hover fills it", () => {
    const row = (name: RegExp) => screen.getByRole("link", { name });
    const columns = (link: HTMLElement) =>
      Array.from(link.querySelectorAll<HTMLElement>("[data-col]")).map((el) => el.dataset.col);
    const clearance = () => row(/Environmental Clearance/);
    const waterAudit = () => row(/Water Audit/);

    it("puts number, title, picture, description and arrow in one row, in that order", () => {
      render(<ServicesIndex {...props} />);
      expect(columns(clearance())).toEqual(["number", "title", "image", "description", "arrow"]);
    });

    it("has each service's own picture in its row, ready to be revealed", () => {
      render(<ServicesIndex {...props} />);
      const img = clearance().querySelector("[data-col=image] img");
      expect(showsFile(img, photo.src)).toBe(true);
    });

    it("has square corners, shows on touch screens (which cannot hover) and is left out on phones", () => {
      render(<ServicesIndex {...props} />);
      const cell = clearance().querySelector("[data-col=image]");
      expect(cell?.className).not.toMatch(/rounded/);
      expect(cell).toHaveClass("show-on-touch", "hidden", "md:block");
    });

    it("shows a placeholder, not a broken image, for a service without an image", () => {
      render(<ServicesIndex {...props} />);
      const cell = waterAudit().querySelector("[data-col=image]");
      expect(cell?.querySelector("img")).toBeNull();
      expect(cell?.querySelector("[data-placeholder]")).not.toBeNull();
    });

    it("keeps the picture decorative: hidden from assistive tech, no alt text", () => {
      render(<ServicesIndex {...props} />);
      const cell = clearance().querySelector("[data-col=image]");
      expect(cell).toHaveAttribute("aria-hidden", "true");
      expect(cell?.querySelector("img")).toHaveAttribute("alt", "");
      expect(clearance()).not.toHaveAccessibleName(/Clearance photo/);
    });

    it("starts every row at rest", () => {
      render(<ServicesIndex {...props} />);
      expect(clearance()).toHaveAttribute("data-state", "rest");
      expect(waterAudit()).toHaveAttribute("data-state", "rest");
    });

    it("lights the hovered row and fades the others back, then restores all on leave", async () => {
      const user = userEvent.setup();
      render(<ServicesIndex {...props} />);
      await user.hover(clearance());
      expect(clearance()).toHaveAttribute("data-state", "hover");
      expect(waterAudit()).toHaveAttribute("data-state", "dim");
      await user.hover(waterAudit());
      expect(clearance()).toHaveAttribute("data-state", "dim");
      expect(waterAudit()).toHaveAttribute("data-state", "hover");
      await user.unhover(waterAudit());
      expect(clearance()).toHaveAttribute("data-state", "rest");
      expect(waterAudit()).toHaveAttribute("data-state", "rest");
    });

    it("does the same for keyboard focus", () => {
      render(<ServicesIndex {...props} />);
      fireEvent.focus(clearance());
      expect(clearance()).toHaveAttribute("data-state", "hover");
      expect(waterAudit()).toHaveAttribute("data-state", "dim");
      fireEvent.blur(clearance());
      expect(clearance()).toHaveAttribute("data-state", "rest");
    });

    it("ignores touch pointers (no hover on phones)", () => {
      render(<ServicesIndex {...props} />);
      const pointerOver = (pointerType: string) => {
        const event = new Event("pointerover", { bubbles: true }) as Event & { pointerType?: string };
        event.pointerType = pointerType;
        return event;
      };
      fireEvent(clearance(), pointerOver("touch"));
      expect(clearance()).toHaveAttribute("data-state", "rest");
      // Control: the same event from a mouse does light the row, so the touch check above is meaningful.
      fireEvent(clearance(), pointerOver("mouse"));
      expect(clearance()).toHaveAttribute("data-state", "hover");
    });

    it("has the Forest fill ready inside every row, closed until hover", () => {
      const { container } = render(<ServicesIndex {...props} />);
      expect(container.querySelectorAll("[data-row-fill]")).toHaveLength(props.services.length);
      expect(container.querySelector("[data-row-fill]")).toHaveClass("bg-primary");
    });

    it("never changes the row's size or floats anything over the page", () => {
      const { container } = render(<ServicesIndex {...props} />);
      expect(container.querySelector("[data-service-panel], [data-service-preview], .fixed")).toBeNull();
    });
  });
});
