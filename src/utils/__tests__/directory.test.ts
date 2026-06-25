import { describe, it, expect } from "vitest";
import { getDirectoryMatches } from "../directory";
import type { BusinessListing } from "@/types";

function makeListing(overrides: Partial<BusinessListing> = {}): BusinessListing {
  return {
    id: "listing-1",
    name: "Test Business",
    category: "Electronics",
    description: "A test business listing",
    location: "Lagos, Nigeria",
    phone: "+234 80 0000 0000",
    website: "https://example.com",
    verified: true,
    status: "approved",
    createdAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getDirectoryMatches", () => {
  const listings: BusinessListing[] = [
    makeListing({
      id: "l1",
      name: "Glow Beauty Studio",
      category: "Beauty & Makeup",
      status: "approved",
      createdAt: "2026-06-01T00:00:00.000Z",
    }),
    makeListing({
      id: "l2",
      name: "TechHub Electronics",
      category: "Electronics",
      status: "approved",
      createdAt: "2026-06-05T00:00:00.000Z",
    }),
    makeListing({
      id: "l3",
      name: "Fresh Food Market",
      category: "Groceries & Food",
      status: "pending",
      createdAt: "2026-06-03T00:00:00.000Z",
    }),
  ];

  it("returns all listings when no category or search", () => {
    const result = getDirectoryMatches("", "", listings);
    expect(result).toHaveLength(3);
  });

  it("filters by category when no search query", () => {
    const result = getDirectoryMatches("Electronics", "", listings);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("TechHub Electronics");
  });

  it("filters by search query across multiple fields", () => {
    const result = getDirectoryMatches("", "glow", listings);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Glow Beauty Studio");
  });

  it("search query ignores category filter", () => {
    const result = getDirectoryMatches("Electronics", "glow", listings);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Glow Beauty Studio");
  });

  it("sorts results by createdAt descending", () => {
    const result = getDirectoryMatches("", "", listings);
    expect(result[0].id).toBe("l2");
    expect(result[1].id).toBe("l3");
    expect(result[2].id).toBe("l1");
  });

  it("returns empty for no matches", () => {
    const result = getDirectoryMatches("", "nonexistent", listings);
    expect(result).toHaveLength(0);
  });

  it("search is case-insensitive", () => {
    const result = getDirectoryMatches("", "TECHHUB", listings);
    expect(result).toHaveLength(1);
  });

  it("includes both approved and pending listings", () => {
    const result = getDirectoryMatches("", "", listings);
    const statuses = result.map((l) => l.status);
    expect(statuses).toContain("approved");
    expect(statuses).toContain("pending");
  });

  it("treats missing status as approved", () => {
    const noStatusListing = makeListing({ id: "l4", status: undefined });
    const result = getDirectoryMatches("", "", [noStatusListing]);
    expect(result).toHaveLength(1);
  });
});
