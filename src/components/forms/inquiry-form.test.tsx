import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InquiryForm } from "./inquiry-form";
import * as submitClient from "@/lib/forms/submit";
import { forms, rx, siteContact } from "@tests/unit/helpers/forms";

describe("InquiryForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const services = [
    { slug: "environmental-clearance", title: "Environmental Clearance" },
    { slug: "water-audit", title: "Water Audit" },
  ];

  it("renders all form fields and submit button", () => {
    render(<InquiryForm copy={forms} phoneFallback={siteContact.phones[0]} emailFallback={siteContact.email} services={services} />);
    expect(screen.getByLabelText(rx(forms.inquiry.fields.name.label))).toBeInTheDocument();
    expect(screen.getByLabelText(rx(forms.inquiry.fields.organization.label))).toBeInTheDocument();
    expect(screen.getByLabelText(rx(forms.inquiry.fields.email.label))).toBeInTheDocument();
    expect(screen.getByLabelText(rx(forms.inquiry.fields.phone.label))).toBeInTheDocument();
    expect(screen.getByLabelText(rx(forms.inquiry.fields.service.label))).toBeInTheDocument();
    expect(screen.getByLabelText(rx(forms.inquiry.fields.message.label))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: forms.inquiry.submitLabel })).toBeInTheDocument();
  });

  it("validates required fields on empty submit without calling submitForm", async () => {
    const submitSpy = vi.spyOn(submitClient, "submitForm");
    const user = userEvent.setup();

    render(<InquiryForm copy={forms} phoneFallback={siteContact.phones[0]} emailFallback={siteContact.email} services={services} />);
    await user.click(screen.getByRole("button", { name: forms.inquiry.submitLabel }));

    expect(screen.getByText(rx(forms.inquiry.errors.nameMin))).toBeInTheDocument();
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it("submits the form successfully and displays confirmation state", async () => {
    vi.spyOn(submitClient, "submitForm").mockResolvedValue({
      success: true,
      outcome: "sent",
      serverMessage: "Your inquiry has been registered.",
    });

    const user = userEvent.setup();
    render(<InquiryForm copy={forms} phoneFallback={siteContact.phones[0]} emailFallback={siteContact.email} services={services} />);

    await user.type(screen.getByLabelText(rx(forms.inquiry.fields.name.label)), "Dr. Rajesh Sharma");
    await user.type(screen.getByLabelText(rx(forms.inquiry.fields.email.label)), "rajesh@bharatchem.in");
    await user.type(screen.getByLabelText(rx(forms.inquiry.fields.phone.label)), "+91 98602 20550");
    await user.selectOptions(
      screen.getByLabelText(rx(forms.inquiry.fields.service.label)),
      "environmental-clearance",
    );
    await user.type(
      screen.getByLabelText(rx(forms.inquiry.fields.message.label)),
      "We require full EIA scoping and appraisal.",
    );

    await user.click(screen.getByRole("button", { name: forms.inquiry.submitLabel }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText(forms.inquiry.success.heading)).toBeInTheDocument();
      expect(screen.getByText("Your inquiry has been registered.")).toBeInTheDocument();
    });
  });

  it("shows error banner and fallback direct contact links when submission fails", async () => {
    vi.spyOn(submitClient, "submitForm").mockResolvedValue({
      success: false,
      outcome: "rejected",
      serverMessage: "Gateway timeout. Please contact support.",
    });

    const user = userEvent.setup();
    render(
      <InquiryForm
        copy={forms}
        services={services}
        phoneFallback={siteContact.phones[0]}
        emailFallback={siteContact.email}
      />,
    );

    await user.type(screen.getByLabelText(rx(forms.inquiry.fields.name.label)), "Dr. Rajesh Sharma");
    await user.type(screen.getByLabelText(rx(forms.inquiry.fields.email.label)), "rajesh@bharatchem.in");
    await user.type(screen.getByLabelText(rx(forms.inquiry.fields.phone.label)), "+91 98602 20550");
    await user.selectOptions(screen.getByLabelText(rx(forms.inquiry.fields.service.label)), "water-audit");
    await user.type(
      screen.getByLabelText(rx(forms.inquiry.fields.message.label)),
      "Comprehensive water balance and audit required.",
    );

    await user.click(screen.getByRole("button", { name: forms.inquiry.submitLabel }));

    await waitFor(() => {
      expect(screen.getByText("Gateway timeout. Please contact support.")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: siteContact.phones[0] })).toHaveAttribute(
        "href",
        `tel:${siteContact.phones[0].replace(/\s/g, "")}`,
      );
      expect(screen.getByRole("link", { name: siteContact.email })).toHaveAttribute(
        "href",
        `mailto:${siteContact.email}`,
      );
    });
  });

  describe("with Turnstile configured", () => {
    type Widget = { callback: (t: string) => void };
    let widget: Widget | undefined;

    beforeEach(() => {
      widget = undefined;
      vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key-123");
      window.turnstile = {
        render: vi.fn((_el: HTMLElement, o: Widget) => {
          widget = o;
          return "w1";
        }),
        reset: vi.fn(),
        remove: vi.fn(),
      };
    });

    afterEach(() => {
      vi.unstubAllEnvs();
      delete window.turnstile;
    });

    const fill = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByLabelText(rx(forms.inquiry.fields.name.label)), "Dr. Rajesh Sharma");
      await user.type(screen.getByLabelText(rx(forms.inquiry.fields.email.label)), "rajesh@bharatchem.in");
      await user.type(screen.getByLabelText(rx(forms.inquiry.fields.phone.label)), "+91 98602 20550");
      await user.selectOptions(screen.getByLabelText(rx(forms.inquiry.fields.service.label)), "water-audit");
      await user.type(
        screen.getByLabelText(rx(forms.inquiry.fields.message.label)),
        "Comprehensive water balance and audit required.",
      );
    };

    it("blocks submission until the challenge is solved", async () => {
      const submitSpy = vi.spyOn(submitClient, "submitForm");
      const user = userEvent.setup();
      render(<InquiryForm copy={forms} phoneFallback={siteContact.phones[0]} emailFallback={siteContact.email} services={services} />);
      await fill(user);
      await user.click(screen.getByRole("button", { name: forms.inquiry.submitLabel }));
      expect(screen.getByText(/complete the verification check/)).toBeInTheDocument();
      expect(submitSpy).not.toHaveBeenCalled();
    });

    it("sends the turnstileToken in the payload", async () => {
      const submitSpy = vi
        .spyOn(submitClient, "submitForm")
        .mockResolvedValue({ success: true, outcome: "sent", serverMessage: "ok" });
      const user = userEvent.setup();
      render(<InquiryForm copy={forms} phoneFallback={siteContact.phones[0]} emailFallback={siteContact.email} services={services} />);
      await fill(user);
      await waitFor(() => expect(widget).toBeDefined());
      act(() => widget?.callback("tok-abc"));
      await user.click(screen.getByRole("button", { name: forms.inquiry.submitLabel }));
      await waitFor(() => expect(submitSpy).toHaveBeenCalled());
      expect(submitSpy.mock.calls[0]![0]).toMatchObject({
        turnstileToken: "tok-abc",
        type: "inquiry",
      });
    });
  });

  describe("honeypot", () => {
    async function fillValid(user: ReturnType<typeof userEvent.setup>) {
      await user.type(screen.getByLabelText(rx(forms.inquiry.fields.name.label)), "Rajesh Sharma");
      await user.type(screen.getByLabelText(rx(forms.inquiry.fields.email.label)), "rajesh@company.com");
      await user.type(screen.getByLabelText(rx(forms.inquiry.fields.phone.label)), "+91 98602 20550");
      await user.selectOptions(screen.getByLabelText(rx(forms.inquiry.fields.service.label)), "general");
      await user.type(
        screen.getByLabelText(rx(forms.inquiry.fields.message.label)),
        "We need an environmental clearance.",
      );
    }
    const fill = () =>
      fireEvent.change(document.getElementById("inquiry-website") as HTMLInputElement, {
        target: { value: "https://autofilled.example" },
      });

    it("fakes success without sending when only the honeypot is filled", async () => {
      const submitSpy = vi.spyOn(submitClient, "submitForm");
      const user = userEvent.setup();
      render(<InquiryForm copy={forms} phoneFallback={siteContact.phones[0]} emailFallback={siteContact.email} services={services} />);
      await fillValid(user);
      fill();
      await user.click(screen.getByRole("button", { name: forms.inquiry.submitLabel }));
      expect(await screen.findByRole("status")).toBeInTheDocument();
      expect(submitSpy).not.toHaveBeenCalled();
    });

    it("still shows real errors, never the honeypot error, when a field is invalid", async () => {
      const user = userEvent.setup();
      render(<InquiryForm copy={forms} phoneFallback={siteContact.phones[0]} emailFallback={siteContact.email} services={services} />);
      fill();
      await user.click(screen.getByRole("button", { name: forms.inquiry.submitLabel }));
      expect(await screen.findByText(rx(forms.inquiry.errors.nameMin))).toBeInTheDocument();
      expect(screen.queryByText(/Bot detected/)).toBeNull();
    });
  });
});
