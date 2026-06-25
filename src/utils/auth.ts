import type { AuthMode, SocialProviderName } from "@/types";
import { normalize } from "./string";

export function isAuthPath(path: string) {
  return path === "/login" || path === "/register" || path === "/reset";
}

export function getAuthMode(path: string): AuthMode | null {
  if (path === "/register") return "register";
  if (path === "/reset") return "reset";
  if (path === "/login") return "login";
  return null;
}

export function isAdminUser(user: Pick<{ role: string }, "role"> | null | undefined) {
  return normalize(String(user?.role || "")) === "admin";
}

export function getSocialAuthErrorMessage(error: unknown, providerName?: SocialProviderName) {
  const message = error instanceof Error ? error.message : String(error);
  const providerLabel = providerName === "google" ? "Google" : "social";

  if (message.includes("auth/popup-closed-by-user")) {
    return "Sign-in was cancelled before it completed.";
  }
  if (message.includes("auth/popup-blocked")) {
    return "Your browser blocked the sign-in popup. Try again, or use email and password.";
  }
  if (message.includes("auth/operation-not-allowed")) {
    return `Enable ${providerLabel} sign-in in Firebase Authentication first.`;
  }
  if (message.includes("auth/unauthorized-domain")) {
    return "Add this domain to Firebase Authentication authorized domains.";
  }
  if (message.includes("auth/account-exists-with-different-credential")) {
    return "An account already exists with this email using another sign-in method. Login with that method first.";
  }

  return message || `${providerLabel} sign-in failed.`;
}

export function getStorageUploadErrorMessage(uploadError: unknown) {
  const message = uploadError instanceof Error ? uploadError.message : String(uploadError);

  if (message.includes("storage/unauthorized")) {
    return "Firebase Storage blocked this upload. Deploy the latest storage.rules and make sure you are signed in.";
  }
  if (message.includes("storage/bucket-not-found") || message.includes("storage/invalid-url")) {
    return "Firebase Storage is not configured correctly. Check VITE_FIREBASE_STORAGE_BUCKET in your hosting environment.";
  }
  if (message.includes("storage/quota-exceeded")) {
    return "Firebase Storage quota has been exceeded. Check your Firebase project billing or quota.";
  }
  if (message.includes("storage/retry-limit-exceeded") || message.includes("storage/canceled")) {
    return "The upload could not finish. Check your internet connection and try again.";
  }

  return message || "Unable to upload this profile photo. Try a smaller JPG or PNG image.";
}
