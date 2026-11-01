import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationModal } from "./application-modal";
import * as submitClient from "@/lib/forms/submit";

describe("ApplicationModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(<ApplicationModal role="Senior EIA Coordinator" isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders when isOpen is true and shows role title", () => {
    render(<ApplicationModal role="Senior EIA Coordinator" isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Apply for Senior EIA Coordinator/)).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(<ApplicationModal role="Senior EIA Coordinator" isOpen={true} onClose={handleClose} />);

    await user.click(screen.getByRole("button", { name: "Close modal" }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("validates missing CV file on submit", async () => {
    const user = userEvent.setup();
    render(<ApplicationModal role="Senior EIA Coordinator" isOpen={true} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/Full Name/), "Pooja Deshmukh");
    await user.type(screen.getByLabelText(/Email Address/), "pooja@gmail.com");
    await user.type(screen.getByLabelText(/Phone Number/), "+91 98602 20550");

    await user.click(screen.getByRole("button", { name: "Submit Application" }));

    expect(screen.getByText(/Please upload your CV document/)).toBeInTheDocument();
  });

  it("submits application when form and CV file are valid", async () => {
    vi.spyOn(submitClient, "submitForm").mockResolvedValue({
      success: true,
      message: "Application received.",
    });

    const user = userEvent.setup();
    render(<ApplicationModal role="Senior EIA Coordinator" isOpen={true} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/Full Name/), "Pooja Deshmukh");
    await user.type(screen.getByLabelText(/Email Address/), "pooja@gmail.com");
    await user.type(screen.getByLabelText(/Phone Number/), "+91 98602 20550");

    // Mock FileReader
    const fakeFile = new File(["dummy pdf content"], "resume.pdf", { type: "application/pdf" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Submit Application" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText("Application Submitted")).toBeInTheDocument();
    });
  });

  it("sends the turnstileToken when Turnstile is configured and blocks without it", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key-123");
    let callback: ((t: string) => void) | undefined;
    window.turnstile = {
      render: vi.fn((_el: HTMLElement, o: { callback: (t: string) => void }) => {
        callback = o.callback;
        return "w1";
      }),
      reset: vi.fn(),
      remove: vi.fn(),
    };
    const submitSpy = vi.spyOn(submitClient, "submitForm").mockResolvedValue({ success: true, message: "ok" });
    const user = userEvent.setup();
    render(<ApplicationModal role="Senior EIA Coordinator" isOpen={true} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/Full Name/), "Pooja Deshmukh");
    await user.type(screen.getByLabelText(/Email Address/), "pooja@gmail.com");
    await user.type(screen.getByLabelText(/Phone Number/), "+91 98602 20550");
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(["dummy"], "resume.pdf", { type: "application/pdf" })] },
    });
    await waitFor(() => expect(screen.getByText("resume.pdf")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Submit Application" }));
    expect(screen.getByText(/complete the verification check/)).toBeInTheDocument();
    expect(submitSpy).not.toHaveBeenCalled();

    await waitFor(() => expect(callback).toBeDefined());
    act(() => callback?.("tok-xyz"));
    await user.click(screen.getByRole("button", { name: "Submit Application" }));
    await waitFor(() => expect(submitSpy).toHaveBeenCalled());
    expect(submitSpy.mock.calls[0]![0]).toMatchObject({ turnstileToken: "tok-xyz", type: "application" });

    vi.unstubAllEnvs();
    delete window.turnstile;
  });

  describe("dialog behaviour", () => {
    function Harness() {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open application
          </button>
          <ApplicationModal role="Senior EIA Coordinator" isOpen={open} onClose={() => setOpen(false)} />
        </>
      );
    }

    it("is labelled by its title and described by its description", async () => {
      render(<ApplicationModal role="Senior EIA Coordinator" isOpen={true} onClose={vi.fn()} />);
      const dialog = await screen.findByRole("dialog");
      expect(dialog).toHaveAccessibleName("Apply for Senior EIA Coordinator");
      expect(dialog).toHaveAccessibleDescription(/curriculum vitae/i);
    });

    it("moves focus to the first field when it opens", async () => {
      render(<ApplicationModal role="Senior EIA Coordinator" isOpen={true} onClose={vi.fn()} />);
      await waitFor(() => expect(screen.getByLabelText(/Full Name/)).toHaveFocus());
    });

    it("closes on Escape and returns focus to the trigger", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      const trigger = screen.getByRole("button", { name: "Open application" });
      await user.click(trigger);
      await screen.findByRole("dialog");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    it("closes when the overlay is clicked", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<ApplicationModal role="Senior EIA Coordinator" isOpen={true} onClose={onClose} />);
      await screen.findByRole("dialog");
      const overlay = document.querySelector("[data-modal-overlay]") as HTMLElement;
      await user.click(overlay);
      expect(onClose).toHaveBeenCalled();
    });

    it("keeps Tab focus inside the dialog", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">Outside</button>
          <ApplicationModal role="Senior EIA Coordinator" isOpen={true} onClose={vi.fn()} />
        </>,
      );
      const dialog = await screen.findByRole("dialog");
      for (let i = 0; i < 25; i += 1) {
        await user.tab();
        expect(dialog.contains(document.activeElement)).toBe(true);
      }
      for (let i = 0; i < 25; i += 1) {
        await user.tab({ shift: true });
        expect(dialog.contains(document.activeElement)).toBe(true);
      }
    });

    it("marks the scrolling container so Lenis lets the form scroll", async () => {
      render(<ApplicationModal role="Senior EIA Coordinator" isOpen={true} onClose={vi.fn()} />);
      await screen.findByRole("dialog");
      const scroller = document.querySelector("[data-modal-overlay]") as HTMLElement;
      expect(scroller).toHaveAttribute("data-lenis-prevent");
      expect(scroller.className).toMatch(/overflow-y-auto/);
    });

    it("sits above the header through the --z-modal token", async () => {
      render(<ApplicationModal role="Senior EIA Coordinator" isOpen={true} onClose={vi.fn()} />);
      await screen.findByRole("dialog");
      const scroller = document.querySelector("[data-modal-overlay]") as HTMLElement;
      expect(scroller.className).toContain("z-(--z-modal)");
    });
  });
});
