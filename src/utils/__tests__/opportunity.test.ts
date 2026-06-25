import { describe, it, expect } from "vitest";
import { canViewOpportunity } from "../opportunity";
import type { Opportunity, UserProfile } from "@/types";

function makeOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: "opp-1",
    title: "Test Opportunity",
    description: "A test",
    type: "Job",
    location: "Remote",
    applyLink: "https://example.com",
    posterId: "poster-1",
    status: "approved",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "user-1",
    fullName: "Test User",
    professionalTitle: "Developer",
    industry: "Technology",
    skills: [],
    location: "Remote",
    bio: "",
    photoUrl: "",
    email: "test@example.com",
    portfolioWebsite: "",
    role: "member",
    verified: false,
    suspended: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("canViewOpportunity", () => {
  it("returns true for approved opportunities", () => {
    const opp = makeOpportunity({ status: "approved" });
    const user = makeUser();
    expect(canViewOpportunity(opp, user)).toBe(true);
  });

  it("returns true when user is the poster", () => {
    const opp = makeOpportunity({ status: "pending", posterId: "user-1" });
    const user = makeUser({ id: "user-1" });
    expect(canViewOpportunity(opp, user)).toBe(true);
  });

  it("returns true when user is admin", () => {
    const opp = makeOpportunity({ status: "pending", posterId: "other" });
    const user = makeUser({ role: "admin" });
    expect(canViewOpportunity(opp, user)).toBe(true);
  });

  it("returns false for pending opportunity viewed by non-poster member", () => {
    const opp = makeOpportunity({ status: "pending", posterId: "other" });
    const user = makeUser({ id: "user-1", role: "member" });
    expect(canViewOpportunity(opp, user)).toBe(false);
  });
});
