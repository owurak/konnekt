import { describe, it, expect } from "vitest";
import { isAuthPath, getAuthMode, isAdminUser, getSocialAuthErrorMessage, getStorageUploadErrorMessage } from "../auth";

describe("isAuthPath", () => {
  it("returns true for /login", () => {
    expect(isAuthPath("/login")).toBe(true);
  });

  it("returns true for /register", () => {
    expect(isAuthPath("/register")).toBe(true);
  });

  it("returns true for /reset", () => {
    expect(isAuthPath("/reset")).toBe(true);
  });

  it("returns false for /", () => {
    expect(isAuthPath("/")).toBe(false);
  });

  it("returns false for /profile", () => {
    expect(isAuthPath("/profile")).toBe(false);
  });

  it("returns false for /login/extra", () => {
    expect(isAuthPath("/login/extra")).toBe(false);
  });
});

describe("getAuthMode", () => {
  it("returns 'login' for /login", () => {
    expect(getAuthMode("/login")).toBe("login");
  });

  it("returns 'register' for /register", () => {
    expect(getAuthMode("/register")).toBe("register");
  });

  it("returns 'reset' for /reset", () => {
    expect(getAuthMode("/reset")).toBe("reset");
  });

  it("returns null for non-auth paths", () => {
    expect(getAuthMode("/")).toBeNull();
    expect(getAuthMode("/home")).toBeNull();
    expect(getAuthMode("/profile")).toBeNull();
  });
});

describe("isAdminUser", () => {
  it("returns true for admin role", () => {
    expect(isAdminUser({ role: "admin" })).toBe(true);
  });

  it("returns true for admin role with different casing", () => {
    expect(isAdminUser({ role: "Admin" })).toBe(true);
    expect(isAdminUser({ role: "ADMIN" })).toBe(true);
  });

  it("returns true for admin role with whitespace", () => {
    expect(isAdminUser({ role: " admin " })).toBe(true);
  });

  it("returns false for member role", () => {
    expect(isAdminUser({ role: "member" })).toBe(false);
  });

  it("returns false for null user", () => {
    expect(isAdminUser(null)).toBe(false);
  });

  it("returns false for undefined user", () => {
    expect(isAdminUser(undefined)).toBe(false);
  });
});

describe("getSocialAuthErrorMessage", () => {
  it("returns cancel message for popup closed", () => {
    const error = new Error("auth/popup-closed-by-user");
    expect(getSocialAuthErrorMessage(error)).toBe("Sign-in was cancelled before it completed.");
  });

  it("returns popup blocked message", () => {
    const error = new Error("auth/popup-blocked");
    expect(getSocialAuthErrorMessage(error)).toContain("blocked the sign-in popup");
  });

  it("returns operation not allowed message with Google label", () => {
    const error = new Error("auth/operation-not-allowed");
    expect(getSocialAuthErrorMessage(error, "google")).toContain("Google");
  });

  it("returns operation not allowed message with social label when no provider", () => {
    const error = new Error("auth/operation-not-allowed");
    expect(getSocialAuthErrorMessage(error)).toContain("social");
  });

  it("returns unauthorized domain message", () => {
    const error = new Error("auth/unauthorized-domain");
    expect(getSocialAuthErrorMessage(error)).toContain("authorized domains");
  });

  it("returns account exists message", () => {
    const error = new Error("auth/account-exists-with-different-credential");
    expect(getSocialAuthErrorMessage(error)).toContain("already exists");
  });

  it("returns the raw message for unknown errors", () => {
    const error = new Error("Something went wrong");
    expect(getSocialAuthErrorMessage(error)).toBe("Something went wrong");
  });

  it("returns fallback for empty string error", () => {
    expect(getSocialAuthErrorMessage("")).toBe("social sign-in failed.");
  });

  it("handles non-Error objects", () => {
    expect(getSocialAuthErrorMessage("string error")).toBe("string error");
  });
});

describe("getStorageUploadErrorMessage", () => {
  it("returns unauthorized message", () => {
    const error = new Error("storage/unauthorized");
    expect(getStorageUploadErrorMessage(error)).toContain("blocked this upload");
  });

  it("returns bucket not found message", () => {
    const error = new Error("storage/bucket-not-found");
    expect(getStorageUploadErrorMessage(error)).toContain("not configured correctly");
  });

  it("returns invalid URL message", () => {
    const error = new Error("storage/invalid-url");
    expect(getStorageUploadErrorMessage(error)).toContain("not configured correctly");
  });

  it("returns quota exceeded message", () => {
    const error = new Error("storage/quota-exceeded");
    expect(getStorageUploadErrorMessage(error)).toContain("quota");
  });

  it("returns retry limit message", () => {
    const error = new Error("storage/retry-limit-exceeded");
    expect(getStorageUploadErrorMessage(error)).toContain("internet connection");
  });

  it("returns canceled message", () => {
    const error = new Error("storage/canceled");
    expect(getStorageUploadErrorMessage(error)).toContain("internet connection");
  });

  it("returns the raw message for unknown errors", () => {
    const error = new Error("Something else");
    expect(getStorageUploadErrorMessage(error)).toBe("Something else");
  });

  it("returns fallback for empty string error", () => {
    expect(getStorageUploadErrorMessage("")).toBe("Unable to upload this profile photo. Try a smaller JPG or PNG image.");
  });
});
