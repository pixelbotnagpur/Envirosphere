import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationModal } from "./application-modal";
import * as submitClient from "@/lib/forms/submit";
import { forms, rx, summaryLabel } from "@tests/unit/helpers/forms";

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;
const submit = () => screen.getByRole("button", { name: forms.application.submitLabel });
const open = () => render(<ApplicationModal copy={forms} role="Senior EIA Coordinator" isOpen={true} onClose={vi.fn()} />);

async function fillDetails(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(rx(forms.application.fields.name.label)), "Pooja Deshmukh");
  await user.type(screen.getByLabelText(rx(forms.application.fields.email.label)), "pooja@gmail.com");
  await user.type(screen.getByLabelText(rx(forms.application.fields.phone.label)), "+91 98602 20550");
}

async function attachCv() {
  fireEvent.change(fileInput(), { target: { files: [new File(["x"], "resume.pdf")] } });
  await waitFor(() => expect(screen.getByText("resume.pdf")).toBeInTheDocument());
}

describe("ApplicationModal assistive technology wiring", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("marks invalid fields, ties them to their errors and focuses the first one", async () => {
    const user = userEvent.setup();
    open();
    await user.click(submit());

    const name = screen.getByLabelText(rx(forms.application.fields.name.label));
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription("Name must be at least 2 characters");
    expect(screen.getByLabelText(rx(forms.application.fields.email.label))).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(rx(forms.application.fields.phone.label))).toHaveAttribute("aria-invalid", "true");
    await waitFor(() => expect(name).toHaveFocus());
  });

  it("lists every problem, including the missing CV, in an announced summary", async () => {
    const user = userEvent.setup();
    open();
    await user.click(submit());
    const summary = screen.getByRole("alert");
    expect(summary).toHaveTextContent(rx(summaryLabel(forms.application.fields.name)));
    expect(summary).toHaveTextContent(rx(summaryLabel(forms.application.fields.email)));
    expect(summary).toHaveTextContent(rx(summaryLabel(forms.application.fields.phone)));
    expect(summary).toHaveTextContent(rx(summaryLabel(forms.application.fields.cv)));
  });

  it("focuses the CV chooser, described by its error, when only the CV is missing", async () => {
    const user = userEvent.setup();
    open();
    await fillDetails(user);
    await user.click(submit());
    await waitFor(() => expect(fileInput()).toHaveFocus());
    expect(fileInput()).toHaveAttribute("aria-invalid", "true");
    expect(fileInput()).toHaveAccessibleDescription(rx(forms.application.errors.cvRequired));
  });

  it("describes a refused file by its error as well", async () => {
    open();
    fireEvent.change(fileInput(), { target: { files: [new File(["x"], "old.doc")] } });
    await waitFor(() => expect(fileInput()).toHaveAttribute("aria-invalid", "true"));
    expect(fileInput()).toHaveAccessibleDescription(rx(forms.application.errors.wrongType));
  });

  it("announces a failed submission as an alert", async () => {
    vi.spyOn(submitClient, "submitForm").mockResolvedValue({ success: false, outcome: "rejected", serverMessage: "Server is down." });
    const user = userEvent.setup();
    open();
    await fillDetails(user);
    await attachCv();
    await user.click(submit());
    expect(await screen.findByRole("alert")).toHaveTextContent("Server is down.");
  });

  it("shows success in a live status region that receives focus", async () => {
    vi.spyOn(submitClient, "submitForm").mockResolvedValue({ success: true, outcome: "sent", serverMessage: "Sent." });
    const user = userEvent.setup();
    open();
    await fillDetails(user);
    await attachCv();
    await user.click(submit());
    const status = await screen.findByRole("status");
    await waitFor(() => expect(status).toHaveFocus());
  });

  it("gives name, email and phone the right autocomplete hints", () => {
    open();
    expect(screen.getByLabelText(rx(forms.application.fields.name.label))).toHaveAttribute("autocomplete", "name");
    expect(screen.getByLabelText(rx(forms.application.fields.email.label))).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText(rx(forms.application.fields.phone.label))).toHaveAttribute("autocomplete", "tel");
  });
});
