import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitForm } from "./submit";

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
    expect(result.message).toBe("Logged to Sheet");
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
    expect(result.message).toContain("status 500");
  });

  it("catches network or fetch exception cleanly", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));
    vi.stubGlobal("fetch", mockFetch);

    const result = await submitForm({ name: "Testing" }, "https://script.google.com/macros/s/xyz/exec");
    expect(result.success).toBe(false);
    expect(result.message).toContain("Network error");
  });

  it("returns demo success in test/dev environment when endpoint is empty", async () => {
    const result = await submitForm({ name: "Testing" }, "");
    expect(result.success).toBe(true);
    expect(result.message).toContain("demo mode");
  });
});
