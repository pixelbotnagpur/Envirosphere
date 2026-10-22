import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScrollStory, type ScrollStoryProps } from "./scroll-story";

function mockMatchMedia(matches: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches,
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("ScrollStory", () => {
  it("renders the stacked layout by default (mobile, reduced motion, before hydration)", () => {
    mockMatchMedia(false);
    render(
      <ScrollStory steps={3} renderStacked={() => <p>stacked</p>} renderPinned={() => <p>pinned</p>} />,
    );
    expect(screen.getByText("stacked")).toBeInTheDocument();
    expect(screen.queryByText("pinned")).toBeNull();
  });

  it("renders a tall pinned container with a sticky stage when pinning applies", () => {
    mockMatchMedia(true);
    const renderPinned = vi.fn<ScrollStoryProps["renderPinned"]>(() => <p>pinned</p>);
    const { container } = render(
      <ScrollStory steps={3} renderStacked={() => <p>stacked</p>} renderPinned={renderPinned} />,
    );
    expect(screen.getByText("pinned")).toBeInTheDocument();
    expect(screen.queryByText("stacked")).toBeNull();
    expect((container.firstElementChild as HTMLElement).style.height).toBe("300vh");
    expect(container.querySelector(".sticky")).not.toBeNull();
    expect(renderPinned.mock.calls[0]?.[0]).toHaveProperty("get");
  });
});
