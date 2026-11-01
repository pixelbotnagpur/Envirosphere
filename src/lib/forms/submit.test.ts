import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadForms } from "@/lib/content";
import { submitForm, submitMessage } from "./submit";

const copy = loadForms().common.submit;

describe("submitForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts payload as text/plain and returns success when response ok", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: "Logged to Sheet" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await submitForm({ name: "Testing", email: "test@enviro.com" }, "https://script.google.com/macros/s/xyz/exec");

    expect(result.success).toBe(true);
    expect(result).toEqual({ success: true, outcome: "sent", serverMessage: "Logged to Sheet" });
    expect(submitMessage(result, copy)).toBe("Logged to Sheet");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://script.google.com/macros/s/xyz/exec",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ name: "Testing", email: "test@enviro.com" }),
      }),
    );
  });

  it("handles server error response cleanly", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await submitForm({ name: "Testing" }, "https://script.google.com/macros/s/xyz/exec");
    expect(result.success).toBe(false);
    expect(result).toEqual({ success: false, outcome: "http-error", detail: "500" });
    expect(submitMessage(result, copy)).toContain("status 500");
  });

  it("catches network or fetch exception cleanly", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));
    vi.stubGlobal("fetch", mockFetch);

    const result = await submitForm({ name: "Testing" }, "https://script.google.com/macros/s/xyz/exec");
    expect(result.success).toBe(false);
    expect(result.outcome).toBe("network-error");
    expect(submitMessage(result, copy)).toContain("Network error (Failed to fetch)");
  });

  it("returns demo success in test/dev environment when endpoint is empty", async () => {
    const result = await submitForm({ name: "Testing" }, "");
    expect(result.success).toBe(true);
    expect(result.outcome).toBe("demo");
    expect(submitMessage(result, copy)).toBe(copy.demo);
  });

  it("uses the server's own error text when it sends one, else the content text", async () => {
    const reply = (body: object) => vi.fn().mockResolvedValue({ ok: true, json: async () => body });
    vi.stubGlobal("fetch", reply({ success: false, error: "Rate limit reached" }));
    const withText = await submitForm({}, "https://script.google.com/macros/s/xyz/exec");
    expect(submitMessage(withText, copy)).toBe("Rate limit reached");
    vi.stubGlobal("fetch", reply({ success: false }));
    const without = await submitForm({}, "https://script.google.com/macros/s/xyz/exec");
    expect(submitMessage(without, copy)).toBe(copy.rejected);
    vi.stubGlobal("fetch", reply({ success: true }));
    const bare = await submitForm({}, "https://script.google.com/macros/s/xyz/exec");
    expect(submitMessage(bare, copy)).toBe(copy.sent);
  });
});
