import { describe, it, expect } from "vitest";
import { getConnectionState, getOtherUserId, getConnectedProfiles, getAcceptedConnectionCount } from "../connections";
import type { Connection, UserProfile } from "@/types";

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

describe("getConnectionState", () => {
  it("returns 'none' when no connection exists", () => {
    const result = getConnectionState("user-b", "user-a", []);
    expect(result).toEqual({ state: "none", connection: null });
  });

  it("returns 'connected' for accepted connection", () => {
    const conn = makeConnection({ senderId: "user-a", receiverId: "user-b", status: "accepted" });
    const result = getConnectionState("user-b", "user-a", [conn]);
    expect(result.state).toBe("connected");
    expect(result.connection).toBe(conn);
  });

  it("returns 'sent' when current user is the sender of a pending connection", () => {
    const conn = makeConnection({ senderId: "user-a", receiverId: "user-b", status: "pending" });
    const result = getConnectionState("user-b", "user-a", [conn]);
    expect(result.state).toBe("sent");
  });

  it("returns 'received' when current user is the receiver of a pending connection", () => {
    const conn = makeConnection({ senderId: "user-b", receiverId: "user-a", status: "pending" });
    const result = getConnectionState("user-b", "user-a", [conn]);
    expect(result.state).toBe("received");
  });

  it("ignores rejected connections", () => {
    const conn = makeConnection({ senderId: "user-a", receiverId: "user-b", status: "rejected" });
    const result = getConnectionState("user-b", "user-a", [conn]);
    expect(result.state).toBe("none");
  });

  it("finds connection regardless of sender/receiver order", () => {
    const conn = makeConnection({ senderId: "user-b", receiverId: "user-a", status: "accepted" });
    const result = getConnectionState("user-b", "user-a", [conn]);
    expect(result.state).toBe("connected");
  });
});

describe("getOtherUserId", () => {
  it("returns receiverId when current user is the sender", () => {
    const conn = makeConnection({ senderId: "user-a", receiverId: "user-b" });
    expect(getOtherUserId(conn, "user-a")).toBe("user-b");
  });

  it("returns senderId when current user is the receiver", () => {
    const conn = makeConnection({ senderId: "user-a", receiverId: "user-b" });
    expect(getOtherUserId(conn, "user-b")).toBe("user-a");
  });
});

describe("getConnectedProfiles", () => {
  const userA = makeUser({ id: "user-a", fullName: "User A" });
  const userB = makeUser({ id: "user-b", fullName: "User B" });
  const userC = makeUser({ id: "user-c", fullName: "User C", suspended: true });

  it("returns profiles of accepted connections", () => {
    const connections = [
      makeConnection({ senderId: "user-a", receiverId: "user-b", status: "accepted" }),
    ];
    const result = getConnectedProfiles("user-a", [userA, userB], connections);
    expect(result).toEqual([userB]);
  });

  it("excludes pending connections", () => {
    const connections = [
      makeConnection({ senderId: "user-a", receiverId: "user-b", status: "pending" }),
    ];
    const result = getConnectedProfiles("user-a", [userA, userB], connections);
    expect(result).toEqual([]);
  });

  it("excludes suspended users", () => {
    const connections = [
      makeConnection({ senderId: "user-a", receiverId: "user-c", status: "accepted" }),
    ];
    const result = getConnectedProfiles("user-a", [userA, userC], connections);
    expect(result).toEqual([]);
  });

  it("returns empty array when no connections exist", () => {
    const result = getConnectedProfiles("user-a", [userA, userB], []);
    expect(result).toEqual([]);
  });

  it("handles connections in both directions", () => {
    const connections = [
      makeConnection({ senderId: "user-b", receiverId: "user-a", status: "accepted" }),
    ];
    const result = getConnectedProfiles("user-a", [userA, userB], connections);
    expect(result).toEqual([userB]);
  });
});

describe("getAcceptedConnectionCount", () => {
  it("returns 0 when no connections exist", () => {
    expect(getAcceptedConnectionCount("user-a", [])).toBe(0);
  });

  it("counts accepted connections where user is sender", () => {
    const connections = [
      makeConnection({ senderId: "user-a", receiverId: "user-b", status: "accepted" }),
    ];
    expect(getAcceptedConnectionCount("user-a", connections)).toBe(1);
  });

  it("counts accepted connections where user is receiver", () => {
    const connections = [
      makeConnection({ senderId: "user-b", receiverId: "user-a", status: "accepted" }),
    ];
    expect(getAcceptedConnectionCount("user-a", connections)).toBe(1);
  });

  it("ignores pending connections", () => {
    const connections = [
      makeConnection({ senderId: "user-a", receiverId: "user-b", status: "pending" }),
    ];
    expect(getAcceptedConnectionCount("user-a", connections)).toBe(0);
  });

  it("counts multiple accepted connections", () => {
    const connections = [
      makeConnection({ id: "c1", senderId: "user-a", receiverId: "user-b", status: "accepted" }),
      makeConnection({ id: "c2", senderId: "user-c", receiverId: "user-a", status: "accepted" }),
      makeConnection({ id: "c3", senderId: "user-a", receiverId: "user-d", status: "pending" }),
    ];
    expect(getAcceptedConnectionCount("user-a", connections)).toBe(2);
  });
});
