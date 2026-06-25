import type { ProfileFormValues, UserProfile } from "@/types";
import { avatarUrl } from "./string";
import { nowIso } from "./date";

export function buildFirebaseProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): UserProfile {
  const displayName = user.displayName || user.email?.split("@")[0] || "Konnekt Member";
  return {
    id: user.uid,
    fullName: displayName,
    professionalTitle: "Professional",
    industry: "Professional Services",
    skills: [],
    location: "Remote across Africa",
    bio: "",
    photoUrl: user.photoURL || avatarUrl(displayName),
    email: user.email || "",
    portfolioWebsite: "",
    role: "member",
    verified: false,
    suspended: false,
    createdAt: nowIso(),
  };
}

export function profileToForm(profile: UserProfile): ProfileFormValues {
  return {
    fullName: profile.fullName,
    professionalTitle: profile.professionalTitle,
    industry: profile.industry,
    skills: profile.skills.join(", "),
    location: profile.location,
    bio: profile.bio,
    portfolioWebsite: profile.portfolioWebsite,
  };
}
