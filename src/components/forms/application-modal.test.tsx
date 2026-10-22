import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
});
