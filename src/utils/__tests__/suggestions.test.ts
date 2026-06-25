import { describe, it, expect } from "vitest";
import { getSuggestedUsers } from "../suggestions";
import type { Connection, UserProfile } from "@/types";

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

function makeConnection(overrides: Partial<Connection> = {}): Connection {
  return {
    id: "conn-1",
    senderId: "user-a",
    receiverId: "user-b",
    status: "accepted",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getSuggestedUsers", () => {
  const currentUser = makeUser({
    id: "current",
    industry: "Technology",
    skills: ["React", "Firebase"],
    location: "Lagos, Nigeria",
  });

  it("excludes the current user from suggestions", () => {
    const users = [currentUser, makeUser({ id: "other" })];
    const result = getSuggestedUsers(currentUser, users, []);
    expect(result.find((u) => u.id === "current")).toBeUndefined();
  });

  it("excludes suspended users", () => {
    const users = [
      currentUser,
      makeUser({ id: "suspended-user", suspended: true }),
    ];
    const result = getSuggestedUsers(currentUser, users, []);
    expect(result).toHaveLength(0);
  });

  it("ranks users with same industry higher", () => {
    const sameIndustry = makeUser({ id: "same", industry: "Technology", fullName: "A" });
    const diffIndustry = makeUser({ id: "diff", industry: "Finance", fullName: "B" });
    const users = [currentUser, diffIndustry, sameIndustry];
    const result = getSuggestedUsers(currentUser, users, []);
    expect(result[0].id).toBe("same");
  });

  it("ranks users with shared skills higher", () => {
    const sharedSkills = makeUser({ id: "shared", skills: ["React", "Firebase"], fullName: "A" });
    const noShared = makeUser({ id: "none", skills: ["Python"], fullName: "B" });
    const users = [currentUser, noShared, sharedSkills];
    const result = getSuggestedUsers(currentUser, users, []);
    expect(result[0].id).toBe("shared");
  });

  it("ranks users with same location higher (among otherwise equal)", () => {
    const sameLocation = makeUser({ id: "same-loc", location: "Lagos, Nigeria", fullName: "A" });
    const diffLocation = makeUser({ id: "diff-loc", location: "Nairobi, Kenya", fullName: "B" });
    const users = [currentUser, diffLocation, sameLocation];
    const result = getSuggestedUsers(currentUser, users, []);
    expect(result[0].id).toBe("same-loc");
  });

  it("deprioritizes already-connected users", () => {
    const connected = makeUser({ id: "connected", industry: "Technology", fullName: "A" });
    const notConnected = makeUser({ id: "not-connected", industry: "Technology", fullName: "B" });
    const connections = [
      makeConnection({ senderId: "current", receiverId: "connected", status: "accepted" }),
    ];
    const users = [currentUser, connected, notConnected];
    const result = getSuggestedUsers(currentUser, users, connections);
    expect(result[0].id).toBe("not-connected");
  });

  it("returns empty when only current user exists", () => {
    const result = getSuggestedUsers(currentUser, [currentUser], []);
    expect(result).toHaveLength(0);
  });

  it("sorts alphabetically when scores are equal", () => {
    const userA = makeUser({ id: "a", fullName: "Alpha" });
    const userB = makeUser({ id: "b", fullName: "Beta" });
    const users = [currentUser, userB, userA];
    const result = getSuggestedUsers(currentUser, users, []);
    expect(result[0].fullName).toBe("Alpha");
    expect(result[1].fullName).toBe("Beta");
  });
});
