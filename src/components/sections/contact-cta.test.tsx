import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactCta } from "./contact-cta";

const props = {
  index: "007",
  label: "Contact",
  heading: "Tell us about your project.",
  body: "We will help you work out the approvals.",
  primaryCta: { label: "Start a conversation", href: "/contact/" },
  phone: "+91 9860220550",
  email: "info@envirosphere.co.in",
  phoneLabel: "Call us",
  emailLabel: "Email us",
};

describe("ContactCta", () => {
  it("links to the contact page and offers phone and email shortcuts", () => {
    render(<ContactCta {...props} />);
    expect(screen.getByRole("link", { name: "Start a conversation" })).toHaveAttribute("href", "/contact/");
    expect(screen.getByRole("link", { name: /\+91 9860220550/ })).toHaveAttribute("href", "tel:+919860220550");
    expect(screen.getByRole("link", { name: /info@envirosphere\.co\.in/ })).toHaveAttribute(
      "href",
      "mailto:info@envirosphere.co.in",
    );
  });

  it("renders the heading as an h2", () => {
    render(<ContactCta {...props} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Tell us about your project.");
  });
});
