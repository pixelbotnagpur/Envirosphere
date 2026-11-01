import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InquiryForm } from "./inquiry-form";
import * as submitClient from "@/lib/forms/submit";

const services = [{ slug: "water-audit", title: "Water Audit" }];

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Full Name/), "Rajesh Sharma");
  await user.type(screen.getByLabelText(/Official Email Address/), "rajesh@company.com");
  await user.type(screen.getByLabelText(/Contact Number/), "+91 98602 20550");
  await user.selectOptions(screen.getByLabelText(/Service of Interest/), "general");
  await user.type(screen.getByLabelText(/Project Brief/), "We need an environmental clearance.");
}

describe("InquiryForm assistive technology wiring", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("marks invalid fields and ties each to its error message", async () => {
    const user = userEvent.setup();
    render(<InquiryForm services={services} />);
    await user.click(screen.getByRole("button", { name: "Submit Inquiry" }));

    const name = screen.getByLabelText(/Full Name/);
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAttribute("aria-describedby", "inquiry-name-error");
    expect(name).toHaveAccessibleDescription("Name must be at least 2 characters");
    expect(screen.getByLabelText(/Official Email Address/)).toHaveAccessibleDescription(
      "Please enter a valid email address",
    );
    expect(screen.getByLabelText(/Service of Interest/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/Project Brief/)).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementById("inquiry-website")).not.toHaveAttribute("aria-invalid");
  });

  it("moves focus to the first invalid field and announces a summary of every error", async () => {
    const user = userEvent.setup();
    render(<InquiryForm services={services} />);
    await user.type(screen.getByLabelText(/Full Name/), "Rajesh Sharma");
    await user.click(screen.getByRole("button", { name: "Submit Inquiry" }));

    await waitFor(() => expect(screen.getByLabelText(/Official Email Address/)).toHaveFocus());
    const summary = screen.getByRole("alert");
    expect(summary).toHaveTextContent(/Official Email Address/);
    expect(summary).toHaveTextContent(/Contact Number/);
    expect(summary).toHaveTextContent(/Service of Interest/);
    expect(summary).toHaveTextContent(/Project Brief/);
    expect(summary).not.toHaveTextContent(/Full Name/);
  });

  it("clears the invalid state once the visitor edits the field", async () => {
    const user = userEvent.setup();
    render(<InquiryForm services={services} />);
    await user.click(screen.getByRole("button", { name: "Submit Inquiry" }));
    const name = screen.getByLabelText(/Full Name/);
    await user.type(name, "R");
    expect(name).not.toHaveAttribute("aria-invalid");
    expect(name).not.toHaveAttribute("aria-describedby");
  });

  it("announces a failed submission as an alert", async () => {
    vi.spyOn(submitClient, "submitForm").mockResolvedValue({ success: false, message: "Server is down." });
    const user = userEvent.setup();
    render(<InquiryForm services={services} />);
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Submit Inquiry" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server is down.");
  });

  it("shows success in a live status region that receives focus", async () => {
    vi.spyOn(submitClient, "submitForm").mockResolvedValue({ success: true, message: "Sent." });
    const user = userEvent.setup();
    render(<InquiryForm services={services} />);
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Submit Inquiry" }));
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Sent.");
    await waitFor(() => expect(status).toHaveFocus());
  });

  it("gives name, email and phone the right autocomplete hints", () => {
    render(<InquiryForm services={services} />);
    expect(screen.getByLabelText(/Full Name/)).toHaveAttribute("autocomplete", "name");
    expect(screen.getByLabelText(/Official Email Address/)).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText(/Contact Number/)).toHaveAttribute("autocomplete", "tel");
  });
});
