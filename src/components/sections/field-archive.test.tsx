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

  it("gives the four photos the big, medium and two small shapes whose edges line up", () => {
    const { container } = render(<FieldArchive {...props} />);
    const [a, b, c, d] = tiles(container);
    expect(a).toHaveClass("lg:col-span-5", "lg:row-span-4");
    expect(b).toHaveClass("lg:col-span-4", "lg:row-span-4");
    // Two small tiles of two rows each stack to the same four rows as the big ones.
    expect(c).toHaveClass("lg:col-span-3", "lg:row-span-2");
    expect(d).toHaveClass("lg:col-span-3", "lg:row-span-2");
    // 5 + 4 + 3 columns fill the 12.
    expect(5 + 4 + 3).toBe(12);
  });

  it("ends the grid with one wide call-to-action tile linking to the gallery, and no button below the grid", () => {
    const { container } = render(<FieldArchive {...props} />);
    const all = tiles(container);
    expect(all).toHaveLength(5);
    const cta = all[all.length - 1];
    expect(cta).toHaveAttribute("data-cta-tile");
    expect(cta).toHaveClass("lg:col-span-12", "md:col-span-2");
    expect(cta.querySelector("a")).toHaveAttribute("href", "/gallery/");
    expect(cta).toHaveTextContent("View all gallery");
    // The old button below the grid is gone: the only links outside the grid are in the heading row.
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

  it("repeats the pattern after four photos", () => {
    const eight = [...props.items, ...props.items.map((i) => ({ ...i, caption: `${i.caption} again` }))];
    const { container } = render(<FieldArchive {...props} items={eight} />);
    const all = tiles(container);
    expect(all).toHaveLength(9);
    expect(all[4]).toHaveClass("lg:col-span-5", "lg:row-span-4");
    expect(all[8]).toHaveAttribute("data-cta-tile");
  });

  it("shows the heading and the top button", () => {
    render(<FieldArchive {...props} />);
    expect(screen.getByRole("heading", { level: 2, name: "Photographs from the field." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Field Archive" })).toHaveAttribute("href", "/gallery/");
  });
});
