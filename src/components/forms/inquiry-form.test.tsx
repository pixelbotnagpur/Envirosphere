import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InquiryForm } from "./inquiry-form";
import * as submitClient from "@/lib/forms/submit";

describe("InquiryForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const services = [
    { slug: "environmental-clearance", title: "Environmental Clearance" },
    { slug: "water-audit", title: "Water Audit" },
  ];

  it("renders all form fields and submit button", () => {
    render(<InquiryForm services={services} />);
    expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Company/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Official Email Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Required Service/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Project Brief/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit Inquiry" })).toBeInTheDocument();
  });

  it("validates required fields on empty submit without calling submitForm", async () => {
    const submitSpy = vi.spyOn(submitClient, "submitForm");
    const user = userEvent.setup();

    render(<InquiryForm services={services} />);
    await user.click(screen.getByRole("button", { name: "Submit Inquiry" }));

    expect(screen.getByText(/Name must be at least 2 characters/)).toBeInTheDocument();
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it("submits the form successfully and displays confirmation state", async () => {
    vi.spyOn(submitClient, "submitForm").mockResolvedValue({
      success: true,
      message: "Your inquiry has been registered.",
    });

    const user = userEvent.setup();
    render(<InquiryForm services={services} />);

    await user.type(screen.getByLabelText(/Full Name/), "Dr. Rajesh Sharma");
    await user.type(screen.getByLabelText(/Official Email Address/), "rajesh@bharatchem.in");
    await user.type(screen.getByLabelText(/Contact Number/), "+91 98602 20550");
    await user.selectOptions(screen.getByLabelText(/Required Service/), "environmental-clearance");
    await user.type(screen.getByLabelText(/Project Brief/), "We require full EIA scoping and appraisal.");

    await user.click(screen.getByRole("button", { name: "Submit Inquiry" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText("Inquiry Received")).toBeInTheDocument();
      expect(screen.getByText("Your inquiry has been registered.")).toBeInTheDocument();
    });
  });

  it("shows error banner and fallback direct contact links when submission fails", async () => {
    vi.spyOn(submitClient, "submitForm").mockResolvedValue({
      success: false,
      message: "Gateway timeout. Please contact support.",
    });

    const user = userEvent.setup();
    render(<InquiryForm services={services} phoneFallback="+91 98602 20550" emailFallback="info@envirosphere.co.in" />);

    await user.type(screen.getByLabelText(/Full Name/), "Dr. Rajesh Sharma");
    await user.type(screen.getByLabelText(/Official Email Address/), "rajesh@bharatchem.in");
    await user.type(screen.getByLabelText(/Contact Number/), "+91 98602 20550");
    await user.selectOptions(screen.getByLabelText(/Required Service/), "water-audit");
    await user.type(screen.getByLabelText(/Project Brief/), "Comprehensive water balance and audit required.");

    await user.click(screen.getByRole("button", { name: "Submit Inquiry" }));

    await waitFor(() => {
      expect(screen.getByText("Gateway timeout. Please contact support.")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "+91 98602 20550" })).toHaveAttribute("href", "tel:+919860220550");
      expect(screen.getByRole("link", { name: "info@envirosphere.co.in" })).toHaveAttribute("href", "mailto:info@envirosphere.co.in");
    });
  });
});
