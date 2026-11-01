import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { JobOpeningsList } from "./job-openings-list";

const emptyState = {
  noneHeading: "No open positions right now",
  noneBody: "You can still send us a general application.",
  generalApplyLabel: "Send a general application",
  generalRoleLabel: "General application",
  emailLabel: "Or email us",
};

describe("JobOpeningsList with no openings", () => {
  it("shows the empty state from content and no job cards", () => {
    render(<JobOpeningsList jobs={[]} contactEmail="hr@example.com" emptyState={emptyState} />);
    expect(screen.getByRole("heading", { name: emptyState.noneHeading })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Apply with CV/i })).toBeNull();
    expect(screen.getByRole("link", { name: emptyState.emailLabel })).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:hr@example.com"),
    );
  });

  it("opens the application form as a general application", async () => {
    render(<JobOpeningsList jobs={[]} contactEmail="hr@example.com" emptyState={emptyState} />);
    await userEvent.click(screen.getByRole("button", { name: emptyState.generalApplyLabel }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("General application");
    expect(dialog.querySelector("#app-cv")).not.toBeNull();
  });
});
