import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { JobOpeningsList } from "./job-openings-list";
import { loadCareers } from "@/lib/content";
import { forms } from "@tests/unit/helpers/forms";

const copy = loadCareers().openings;

describe("JobOpeningsList with no openings", () => {
  it("shows the empty state from content and no job cards", () => {
    render(<JobOpeningsList jobs={[]} contactEmail="hr@example.com" copy={copy} forms={forms} />);
    expect(screen.getByRole("heading", { name: copy.noneHeading })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.applyWithCvLabel })).toBeNull();
    expect(screen.getByRole("link", { name: copy.emailLabel })).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:hr@example.com"),
    );
  });

  it("opens the application form as a general application", async () => {
    render(<JobOpeningsList jobs={[]} contactEmail="hr@example.com" copy={copy} forms={forms} />);
    await userEvent.click(screen.getByRole("button", { name: copy.generalApplyLabel }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(copy.generalRoleLabel);
    expect(dialog.querySelector("#app-cv")).not.toBeNull();
  });
});

describe("JobOpeningsList with openings", () => {
  const job = {
    id: "chemist",
    title: "Field Chemist",
    department: "Laboratory",
    location: "Pune",
    type: "Full-time",
    experience: "2 years",
    description: "Samples water.",
    requirements: ["B.Sc. Chemistry"],
  };

  it("labels each opening from content and builds the email subject from the job title", () => {
    render(<JobOpeningsList jobs={[job]} contactEmail="hr@example.com" copy={copy} forms={forms} />);
    expect(screen.getByText(copy.requirementsLabel)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.applyWithCvLabel })).toBeInTheDocument();
    const mail = screen.getByRole("link", { name: copy.applyByEmailLabel });
    expect(mail).toHaveAttribute(
      "href",
      `mailto:hr@example.com?subject=${encodeURIComponent(copy.emailSubject.replace("{title}", job.title))}`,
    );
  });

  it("opens the application window titled with the job", async () => {
    render(<JobOpeningsList jobs={[job]} contactEmail="hr@example.com" copy={copy} forms={forms} />);
    await userEvent.click(screen.getByRole("button", { name: copy.applyWithCvLabel }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(forms.application.title.replace("{role}", job.title));
  });
});
