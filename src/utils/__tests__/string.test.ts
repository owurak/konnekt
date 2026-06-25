import { describe, it, expect } from "vitest";
import { normalize, splitTags, newId, avatarUrl, getInitials } from "../string";

describe("normalize", () => {
  it("trims and lowercases a string", () => {
    expect(normalize("  Hello World  ")).toBe("hello world");
  });

  it("handles an empty string", () => {
    expect(normalize("")).toBe("");
  });

  it("handles already-normalized input", () => {
    expect(normalize("test")).toBe("test");
  });

  it("handles mixed case with whitespace", () => {
    expect(normalize("   UPPER case  ")).toBe("upper case");
  });
});

describe("splitTags", () => {
  it("splits a comma-separated string into trimmed tags", () => {
    expect(splitTags("React, Firebase, APIs")).toEqual(["React", "Firebase", "APIs"]);
  });

  it("filters out empty entries", () => {
    expect(splitTags("React,,, Firebase")).toEqual(["React", "Firebase"]);
  });

  it("limits to 12 tags", () => {
    const manyTags = Array.from({ length: 20 }, (_, i) => `tag${i}`).join(",");
    expect(splitTags(manyTags)).toHaveLength(12);
  });

  it("returns empty array for empty string", () => {
    expect(splitTags("")).toEqual([]);
  });

  it("trims whitespace from each tag", () => {
    expect(splitTags("  a ,  b ,  c  ")).toEqual(["a", "b", "c"]);
  });
});

describe("newId", () => {
  it("starts with the given prefix", () => {
    const id = newId("user");
    expect(id.startsWith("user-")).toBe(true);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newId("test")));
    expect(ids.size).toBe(50);
  });

  it("contains two hyphens (prefix-random-timestamp)", () => {
    const id = newId("prefix");
    const parts = id.split("-");
    expect(parts.length).toBeGreaterThanOrEqual(3);
    expect(parts[0]).toBe("prefix");
  });
});

describe("avatarUrl", () => {
  it("returns a ui-avatars.com URL with encoded name", () => {
    const url = avatarUrl("Amina Ndlovu");
    expect(url).toContain("ui-avatars.com");
    expect(url).toContain("Amina%20Ndlovu");
  });

  it("falls back to 'Konnekt User' for empty name", () => {
    const url = avatarUrl("");
    expect(url).toContain("Konnekt%20User");
  });

  it("includes brand colors", () => {
    const url = avatarUrl("Test");
    expect(url).toContain("background=0B6B3A");
    expect(url).toContain("color=ffffff");
  });
});

describe("getInitials", () => {
  it("returns first letters of first two words", () => {
    expect(getInitials("Amina Ndlovu")).toBe("AN");
  });

  it("returns single letter for one-word name", () => {
    expect(getInitials("Admin")).toBe("A");
  });

  it("returns 'K' for empty string", () => {
    expect(getInitials("")).toBe("K");
  });

  it("handles extra whitespace", () => {
    expect(getInitials("  John   Doe  ")).toBe("JD");
  });

  it("limits to two initials for three-word names", () => {
    expect(getInitials("Mary Jane Watson")).toBe("MJ");
  });

  it("returns uppercase initials", () => {
    expect(getInitials("john doe")).toBe("JD");
  });
});
