import { describe, expect, it } from "vitest";
import { isNewProduct, toTimestamp } from "@/lib/productFreshness";

describe("productFreshness", () => {
  it("returns 0 for invalid timestamps", () => {
    expect(toTimestamp("")).toBe(0);
    expect(toTimestamp("invalid-date")).toBe(0);
  });

  it("detects a recent product as new", () => {
    const now = Date.now();
    const recent = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(isNewProduct(recent, now)).toBe(true);
  });

  it("marks very old products as not new", () => {
    const now = Date.now();
    const old = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString();
    expect(isNewProduct(old, now)).toBe(false);
  });
});
