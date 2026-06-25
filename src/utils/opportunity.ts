import type { Opportunity, UserProfile } from "@/types";
import { isAdminUser } from "./auth";

export function canViewOpportunity(opportunity: Opportunity, currentUser: UserProfile) {
  return (
    opportunity.status === "approved" ||
    opportunity.posterId === currentUser.id ||
    isAdminUser(currentUser)
  );
}
