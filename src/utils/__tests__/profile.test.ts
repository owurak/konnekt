import { describe, it, expect, vi, afterEach } from "vitest";
import { buildFirebaseProfile, profileToForm } from "../profile";
import type { UserProfile } from "@/types";

describe("buildFirebaseProfile", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds a profile from Firebase user data", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00.000Z"));

    const result = buildFirebaseProfile({
      uid: "abc123",
      email: "test@example.com",
      displayName: "Test User",
      photoURL: "https://example.com/photo.jpg",
    });

    expect(result.id).toBe("abc123");
    expect(result.fullName).toBe("Test User");
    expect(result.email).toBe("test@example.com");
    expect(result.photoUrl).toBe("https://example.com/photo.jpg");
    expect(result.role).toBe("member");
    expect(result.verified).toBe(false);
    expect(result.suspended).toBe(false);
    expect(result.industry).toBe("Professional Services");
    expect(result.createdAt).toBe("2026-06-10T12:00:00.000Z");
  });

  it("uses email prefix as fallback displayName", () => {
    const result = buildFirebaseProfile({
      uid: "abc",
      email: "john@example.com",
      displayName: null,
      photoURL: null,
    });
    expect(result.fullName).toBe("john");
  });

  it("uses 'Konnekt Member' when no displayName or email", () => {
    const result = buildFirebaseProfile({
      uid: "abc",
      email: null,
      displayName: null,
      photoURL: null,
    });
    expect(result.fullName).toBe("Konnekt Member");
  });

  it("generates avatar URL when no photoURL", () => {
    const result = buildFirebaseProfile({
      uid: "abc",
      email: null,
      displayName: "Jane",
      photoURL: null,
    });
    expect(result.photoUrl).toContain("ui-avatars.com");
    expect(result.photoUrl).toContain("Jane");
  });

  it("sets empty string for missing email", () => {
    const result = buildFirebaseProfile({
      uid: "abc",
      email: null,
      displayName: "Test",
      photoURL: null,
    });
    expect(result.email).toBe("");
  });
});

describe("profileToForm", () => {
  it("converts a UserProfile to form values", () => {
    const profile: UserProfile = {
      id: "user-1",
      fullName: "Amina Ndlovu",
      professionalTitle: "Product Strategist",
      industry: "Technology",
      skills: ["Product Strategy", "Fintech", "UX Research"],
      location: "Cape Town, South Africa",
      bio: "Building digital tools.",
      photoUrl: "https://example.com/photo.jpg",
      email: "amina@example.com",
      portfolioWebsite: "https://amina.studio",
      role: "member",
      verified: true,
      suspended: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    const form = profileToForm(profile);
    expect(form.fullName).toBe("Amina Ndlovu");
    expect(form.professionalTitle).toBe("Product Strategist");
    expect(form.industry).toBe("Technology");
    expect(form.skills).toBe("Product Strategy, Fintech, UX Research");
    expect(form.location).toBe("Cape Town, South Africa");
    expect(form.bio).toBe("Building digital tools.");
    expect(form.portfolioWebsite).toBe("https://amina.studio");
  });

  it("joins empty skills array as empty string", () => {
    const profile: UserProfile = {
      id: "user-1",
      fullName: "Test",
      professionalTitle: "",
      industry: "",
      skills: [],
      location: "",
      bio: "",
      photoUrl: "",
      email: "",
      portfolioWebsite: "",
      role: "member",
      verified: false,
      suspended: false,
      createdAt: "",
    };

    const form = profileToForm(profile);
    expect(form.skills).toBe("");
  });
});
