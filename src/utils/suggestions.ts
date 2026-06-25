import type { Connection, UserProfile } from "@/types";
import { getConnectionState } from "./connections";
import { normalize } from "./string";

export function getSuggestedUsers(currentUser: UserProfile, users: UserProfile[], connections: Connection[]) {
  return users
    .filter((user) => user.id !== currentUser.id && !user.suspended)
    .map((user) => {
      const connectionState = getConnectionState(user.id, currentUser.id, connections).state;
      const sharedSkills = user.skills.filter((skill) =>
        currentUser.skills.some((currentSkill) => normalize(currentSkill) === normalize(skill))
      ).length;
      const score =
        (user.industry === currentUser.industry ? 4 : 0) +
        sharedSkills * 2 +
        (user.location === currentUser.location ? 1 : 0) -
        (connectionState === "connected" ? 5 : 0) -
        (connectionState === "sent" ? 3 : 0);
      return { user, score };
    })
    .filter((item) => item.score > -4)
    .sort((a, b) => b.score - a.score || a.user.fullName.localeCompare(b.user.fullName))
    .map((item) => item.user);
}
