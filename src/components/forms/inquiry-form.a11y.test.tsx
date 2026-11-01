import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InquiryForm } from "./inquiry-form";
import * as submitClient from "@/lib/forms/submit";
import { forms, rx, siteContact, summaryLabel } from "@tests/unit/helpers/forms";

const services = [{ slug: "water-audit", title: "Water Audit" }];

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(rx(forms.inquiry.fields.name.label)), "Rajesh Sharma");
  await user.type(screen.getByLabelText(rx(forms.inquiry.fields.email.label)), "rajesh@company.com");
  await user.type(screen.getByLabelText(rx(forms.inquiry.fields.phone.label)), "+91 98602 20550");
  await user.selectOptions(screen.getByLabelText(rx(forms.inquiry.fields.service.label)), "general");
  await user.type(screen.getByLabelText(rx(forms.inquiry.fields.message.label)), "We need an environmental clearance.");
}

describe("InquiryForm assistive technology wiring", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("marks invalid fields and ties each to its error message", async () => {
    const user = userEvent.setup();
    render(<InquiryForm copy={forms} phoneFallback={siteContact.phones[0]} emailFallback={siteContact.email} services={services} />);
    await user.click(screen.getByRole("button", { name: forms.inquiry.submitLabel }));

    const name = screen.getByLabelText(rx(forms.inquiry.fields.name.label));
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAttribute("aria-describedby", "inquiry-name-error");
    expect(name).toHaveAccessibleDescription("Name must be at least 2 characters");
    expect(screen.getByLabelText(rx(forms.inquiry.fields.email.label))).toHaveAccessibleDescription(
      "Please enter a valid email address",
    );
    expect(screen.getByLabelText(rx(forms.inquiry.fields.service.label))).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(rx(forms.inquiry.fields.message.label))).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementById("inquiry-website")).not.toHaveAttribute("aria-invalid");
  });

  it("moves focus to the first invalid field and announces a summary of every error", async () => {
    const user = userEvent.setup();
    render(<InquiryForm copy={forms} phoneFallback={siteContact.phones[0]} emailFallback={siteContact.email} services={services} />);
    await user.type(screen.getByLabelText(rx(forms.inquiry.fields.name.label)), "Rajesh Sharma");
    await user.click(screen.getByRole("button", { name: forms.inquiry.submitLabel }));

    await waitFor(() => expect(screen.getByLabelText(rx(forms.inquiry.fields.email.label))).toHaveFocus());
    const summary = screen.getByRole("alert");
    expect(summary).toHaveTextContent(rx(summaryLabel(forms.inquiry.fields.email)));
    expect(summary).toHaveTextContent(rx(summaryLabel(forms.inquiry.fields.phone)));
    expect(summary).toHaveTextContent(rx(summaryLabel(forms.inquiry.fields.service)));
    expect(summary).toHaveTextContent(rx(summaryLabel(forms.inquiry.fields.message)));
    expect(summary).not.toHaveTextContent(rx(summaryLabel(forms.inquiry.fields.name)));
  });

  it("clears the invalid state once the visitor edits the field", async () => {
    const user = userEvent.setup();
    render(<InquiryForm copy={forms} phoneFallback={siteContact.phones[0]} emailFallback={siteContact.email} services={services} />);
    await user.click(screen.getByRole("button", { name: forms.inquiry.submitLabel }));
    const name = screen.getByLabelText(rx(forms.inquiry.fields.name.label));
    await user.type(name, "R");
    expect(name).not.toHaveAttribute("aria-invalid");
    expect(name).not.toHaveAttribute("aria-describedby");
  });

  it("announces a failed submission as an alert", async () => {
    vi.spyOn(submitClient, "submitForm").mockResolvedValue({ success: false, outcome: "rejected", serverMessage: "Server is down." });
    const user = userEvent.setup();
    render(<InquiryForm copy={forms} phoneFallback={siteContact.phones[0]} emailFallback={siteContact.email} services={services} />);
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: forms.inquiry.submitLabel }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server is down.");
  });

  it("shows success in a live status region that receives focus", async () => {
    vi.spyOn(submitClient, "submitForm").mockResolvedValue({ success: true, outcome: "sent", serverMessage: "Sent." });
    const user = userEvent.setup();
    render(<InquiryForm copy={forms} phoneFallback={siteContact.phones[0]} emailFallback={siteContact.email} services={services} />);
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: forms.inquiry.submitLabel }));
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Sent.");
    await waitFor(() => expect(status).toHaveFocus());
  });

  it("gives name, email and phone the right autocomplete hints", () => {
    render(<InquiryForm copy={forms} phoneFallback={siteContact.phones[0]} emailFallback={siteContact.email} services={services} />);
    expect(screen.getByLabelText(rx(forms.inquiry.fields.name.label))).toHaveAttribute("autocomplete", "name");
    expect(screen.getByLabelText(rx(forms.inquiry.fields.email.label))).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText(rx(forms.inquiry.fields.phone.label))).toHaveAttribute("autocomplete", "tel");
  });
});
