import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FieldArchive } from "./field-archive";

const photo = (name: string) => ({ src: `/media/${name}.webp`, alt: `${name} photo`, width: 736, height: 1000 });

const props = {
  index: "005",
  label: "FIELD WORK",
  heading: "Photographs from the field.",
  body: "A selection of photographs.",
  topCta: { label: "Field Archive", href: "/gallery/" },
  bottomCta: { label: "View all gallery", href: "/gallery/" },
  items: ["marine", "forest", "sampling", "office"].map((name) => ({
    image: photo(name),
    tag: name.toUpperCase(),
    caption: `Caption for ${name}`,
  })),
};

describe("FieldArchive bento grid", () => {
  const tiles = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>("[data-tile]"));

  it("lays the photographs out as a bento grid on short unit rows, not as equal cards", () => {
    const { container } = render(<FieldArchive {...props} />);
    const grid = container.querySelector("[data-bento]");
    expect(grid).toHaveClass("grid", "lg:grid-cols-12", "md:grid-cols-2", "lg:auto-rows-[10rem]", "md:auto-rows-[9rem]");
    expect(container.querySelector("[data-card-grid], [data-card]")).toBeNull();
  });

  it("places the four photos and the gallery card in one block of four rows, edges lining up", () => {
    const { container } = render(<FieldArchive {...props} />);
    const [a, b, c, d, g] = tiles(container);
    // A: big, columns 1-5, all four rows.
    expect(a).toHaveClass("lg:col-start-1", "lg:col-span-5", "lg:row-start-1", "lg:row-span-4");
    // B and C: columns 6-9, two rows each, one above the other.
    expect(b).toHaveClass("lg:col-start-6", "lg:col-span-4", "lg:row-start-1", "lg:row-span-2");
    expect(c).toHaveClass("lg:col-start-6", "lg:col-span-4", "lg:row-start-3", "lg:row-span-2");
    // D: columns 10-12, rows 1-3; the gallery card takes row 4 under it.
    expect(d).toHaveClass("lg:col-start-10", "lg:col-span-3", "lg:row-start-1", "lg:row-span-3");
    expect(g).toHaveClass("lg:col-start-10", "lg:col-span-3", "lg:row-start-4", "lg:row-span-1");
  });

  it("makes the gallery link a card inside the grid, the last tile, with no extra row and no button below", () => {
    const { container } = render(<FieldArchive {...props} />);
    const all = tiles(container);
    expect(all).toHaveLength(5);
    const cta = all[all.length - 1];
    expect(cta).toHaveAttribute("data-cta-tile");
    // Not a full-width strip any more.
    expect(cta.className).not.toMatch(/col-span-12/);
    expect(cta.querySelector("a")).toHaveAttribute("href", "/gallery/");
    expect(cta).toHaveTextContent("View all gallery");
    const grid = container.querySelector("[data-bento]")!;
    const outside = Array.from(container.querySelectorAll("a")).filter((a) => !grid.contains(a));
    expect(outside).toHaveLength(1);
    expect(outside[0]).toHaveTextContent("Field Archive");
  });

  it("keeps each photo tile's caption and tag over its own photograph", () => {
    const { container } = render(<FieldArchive {...props} />);
    for (const tile of tiles(container).slice(0, 4)) {
      expect(tile.querySelector("img")).not.toBeNull();
      expect(tile.textContent).toMatch(/Caption for/);
    }
    expect(screen.getByText("MARINE")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "marine photo" })).toBeInTheDocument();
  });

  it("shows the heading and the top button", () => {
    render(<FieldArchive {...props} />);
    expect(screen.getByRole("heading", { level: 2, name: "Photographs from the field." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Field Archive" })).toHaveAttribute("href", "/gallery/");
  });
});
