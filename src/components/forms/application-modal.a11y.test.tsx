import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationModal } from "./application-modal";
import * as submitClient from "@/lib/forms/submit";

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;
const submit = () => screen.getByRole("button", { name: "Submit Application" });
const open = () => render(<ApplicationModal role="Senior EIA Coordinator" isOpen={true} onClose={vi.fn()} />);

async function fillDetails(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Full Name/), "Pooja Deshmukh");
  await user.type(screen.getByLabelText(/Email Address/), "pooja@gmail.com");
  await user.type(screen.getByLabelText(/Phone Number/), "+91 98602 20550");
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

    const name = screen.getByLabelText(/Full Name/);
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription("Name must be at least 2 characters");
    expect(screen.getByLabelText(/Email Address/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/Phone Number/)).toHaveAttribute("aria-invalid", "true");
    await waitFor(() => expect(name).toHaveFocus());
  });

  it("lists every problem, including the missing CV, in an announced summary", async () => {
    const user = userEvent.setup();
    open();
    await user.click(submit());
    const summary = screen.getByRole("alert");
    expect(summary).toHaveTextContent(/Full Name/);
    expect(summary).toHaveTextContent(/Email Address/);
    expect(summary).toHaveTextContent(/Phone Number/);
    expect(summary).toHaveTextContent(/Curriculum Vitae/);
  });

  it("focuses the CV chooser, described by its error, when only the CV is missing", async () => {
    const user = userEvent.setup();
    open();
    await fillDetails(user);
    await user.click(submit());
    await waitFor(() => expect(fileInput()).toHaveFocus());
    expect(fileInput()).toHaveAttribute("aria-invalid", "true");
    expect(fileInput()).toHaveAccessibleDescription(/Please upload your CV document/);
  });

  it("describes a refused file by its error as well", async () => {
    open();
    fireEvent.change(fileInput(), { target: { files: [new File(["x"], "old.doc")] } });
    await waitFor(() => expect(fileInput()).toHaveAttribute("aria-invalid", "true"));
    expect(fileInput()).toHaveAccessibleDescription(/PDF or DOCX file/);
  });

  it("announces a failed submission as an alert", async () => {
    vi.spyOn(submitClient, "submitForm").mockResolvedValue({ success: false, message: "Server is down." });
    const user = userEvent.setup();
    open();
    await fillDetails(user);
    await attachCv();
    await user.click(submit());
    expect(await screen.findByRole("alert")).toHaveTextContent("Server is down.");
  });

  it("shows success in a live status region that receives focus", async () => {
    vi.spyOn(submitClient, "submitForm").mockResolvedValue({ success: true, message: "Sent." });
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
    expect(screen.getByLabelText(/Full Name/)).toHaveAttribute("autocomplete", "name");
    expect(screen.getByLabelText(/Email Address/)).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText(/Phone Number/)).toHaveAttribute("autocomplete", "tel");
  });
});
