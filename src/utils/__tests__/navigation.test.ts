import { describe, it, expect } from "vitest";
import { isNavigationActive, pageTitle } from "../navigation";

describe("isNavigationActive", () => {
  it("returns true for exact root match", () => {
    expect(isNavigationActive("/", "/")).toBe(true);
  });

  it("returns false for root when on another path", () => {
    expect(isNavigationActive("/network", "/")).toBe(false);
  });

  it("returns true for /opportunities on /opportunities", () => {
    expect(isNavigationActive("/opportunities", "/opportunities")).toBe(true);
  });

  it("returns true for /opportunities when on /opportunity/:id", () => {
    expect(isNavigationActive("/opportunity/abc123", "/opportunities")).toBe(true);
  });

  it("returns true for /profile paths", () => {
    expect(isNavigationActive("/profile/user-123", "/profile")).toBe(true);
  });

  it("returns true for sub-paths", () => {
    expect(isNavigationActive("/network/requests", "/network")).toBe(true);
  });

  it("returns false for unrelated paths", () => {
    expect(isNavigationActive("/settings", "/network")).toBe(false);
  });
});

describe("pageTitle", () => {
  it("returns 'Home' for /", () => {
    expect(pageTitle("/")).toBe("Home");
  });

  it("returns 'Network' for /network", () => {
    expect(pageTitle("/network")).toBe("Network");
  });

  it("returns 'Opportunities' for /opportunities", () => {
    expect(pageTitle("/opportunities")).toBe("Opportunities");
  });

  it("returns 'Opportunities' for /opportunity/:id", () => {
    expect(pageTitle("/opportunity/abc123")).toBe("Opportunities");
  });

  it("returns 'Profile' for /profile", () => {
    expect(pageTitle("/profile")).toBe("Profile");
  });

  it("returns 'Notifications' for /notifications", () => {
    expect(pageTitle("/notifications")).toBe("Notifications");
  });

  it("returns 'Messages' for /messages", () => {
    expect(pageTitle("/messages")).toBe("Messages");
  });

  it("returns 'Settings' for /settings", () => {
    expect(pageTitle("/settings")).toBe("Settings");
  });

  it("returns 'Admin' for /admin", () => {
    expect(pageTitle("/admin")).toBe("Admin");
  });

  it("returns 'Konnekt' for unknown paths", () => {
    expect(pageTitle("/unknown")).toBe("Konnekt");
  });
});
