import { act, render, screen } from "@testing-library/react";
import { motionValue } from "motion/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Process } from "./process";

const progress = motionValue(0);

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, useScroll: () => ({ scrollYProgress: progress }) };
});

function mockPinned() {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: true,
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

afterEach(() => {
  vi.restoreAllMocks();
  progress.set(0);
});

const pic = (name: string) => ({ src: `/media/${name}.webp`, alt: name, width: 736, height: 1000 });
const steps = [
  { title: "Scoping", body: "We study the project.", image: pic("a") },
  { title: "Assessment", body: "Specialists carry out studies.", image: pic("b") },
  { title: "Submission", body: "We file the applications.", image: pic("c") },
  { title: "Compliance", body: "After approval.", image: pic("d") },
];

const renderPinned = () => {
  mockPinned();
  return render(<Process index="006" label="How we work" heading="From study to consent." steps={steps} />);
};
const cards = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>("[data-process-step]"));
const frames = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>("[data-process-image]"));
const active = (container: HTMLElement) => cards(container).map((card) => card.dataset.active);

describe("Process, pinned layout", () => {
  it("puts the pictures on the left and the step cards on the right", () => {
    const { container } = renderPinned();
    const stage = container.querySelector("[data-process-stage]") as HTMLElement;
    expect(frames(container)).toHaveLength(4);
    expect(stage.compareDocumentPosition(cards(container)[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(4);
  });

  it("starts with the first step lit and only its picture open", () => {
    const { container } = renderPinned();
    expect(active(container)).toEqual(["true", "false", "false", "false"]);
    expect(frames(container).map((frame) => frame.dataset.open)).toEqual(["true", "false", "false", "false"]);
    expect(frames(container)[0].style.clipPath).toMatch(/inset\(0%/);
    expect(frames(container)[1].style.clipPath).toMatch(/inset\(100%/);
  });

  it("lights the card and reveals the picture of whichever step the scroll has reached", () => {
    const { container } = renderPinned();
    act(() => progress.set(0.3));
    expect(active(container)).toEqual(["false", "true", "false", "false"]);
    expect(frames(container).map((frame) => frame.dataset.open)).toEqual(["true", "true", "false", "false"]);
    act(() => progress.set(0.6));
    expect(active(container)).toEqual(["false", "false", "true", "false"]);
    act(() => progress.set(1));
    expect(active(container)).toEqual(["false", "false", "false", "true"]);
    expect(frames(container).map((frame) => frame.dataset.open)).toEqual(["true", "true", "true", "true"]);
  });

  it("closes the later pictures again when scrolling back up", () => {
    const { container } = renderPinned();
    act(() => progress.set(0.9));
    act(() => progress.set(0.1));
    expect(active(container)).toEqual(["true", "false", "false", "false"]);
    expect(frames(container).map((frame) => frame.dataset.open)).toEqual(["true", "false", "false", "false"]);
  });

  it("shows which step is current on the picture", () => {
    const { container } = renderPinned();
    expect(container.querySelector("[data-process-stage]")).toHaveTextContent("01 / 04");
    act(() => progress.set(0.6));
    expect(container.querySelector("[data-process-stage]")).toHaveTextContent("03 / 04");
  });

  it("keeps the pictures decorative", () => {
    const { container } = renderPinned();
    expect(container.querySelector("[data-process-stage]")).toHaveAttribute("aria-hidden", "true");
  });
});
