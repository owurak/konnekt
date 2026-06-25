import type { Connection, Opportunity, UserProfile } from "@/types";

export function nowIso() {
  return new Date().toISOString();
}

export function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

export function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function splitTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function avatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "Konnekt User"
  )}&background=0B6B3A&color=ffffff&bold=true`;
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(iso);
}

export function canViewOpportunity(opportunity: Opportunity, currentUser: UserProfile) {
  return (
    opportunity.status === "approved" ||
    opportunity.posterId === currentUser.id ||
    isAdminUser(currentUser)
  );
}

export function isAdminUser(user: Pick<UserProfile, "role"> | null | undefined) {
  return normalize(String(user?.role || "")) === "admin";
}

export function getConnectionState(targetId: string, currentUserId: string, connections: Connection[]) {
  const connection = connections.find(
    (item) =>
      item.status !== "rejected" &&
      ((item.senderId === currentUserId && item.receiverId === targetId) ||
        (item.senderId === targetId && item.receiverId === currentUserId))
  );

  if (!connection) return { state: "none" as const, connection: null };
  if (connection.status === "accepted") return { state: "connected" as const, connection };
  if (connection.senderId === currentUserId) return { state: "sent" as const, connection };
  return { state: "received" as const, connection };
}

export function getOtherUserId(connection: Connection, currentUserId: string) {
  return connection.senderId === currentUserId ? connection.receiverId : connection.senderId;
}

export function getConnectedProfiles(
  currentUserId: string,
  users: UserProfile[],
  connections: Connection[]
) {
  const connectedIds = new Set(
    connections
      .filter(
        (connection) =>
          connection.status === "accepted" &&
          (connection.senderId === currentUserId || connection.receiverId === currentUserId)
      )
      .map((connection) => getOtherUserId(connection, currentUserId))
  );

  return users.filter((user) => connectedIds.has(user.id) && !user.suspended);
}

export function getAcceptedConnectionCount(userId: string, connections: Connection[]) {
  return connections.filter(
    (connection) =>
      connection.status === "accepted" &&
      (connection.senderId === userId || connection.receiverId === userId)
  ).length;
}

export function mapSnapshot<T extends { id: string }>(snapshot: {
  docs: Array<{ id: string; data: () => unknown }>;
}) {
  return snapshot.docs.map((entry) => ({ ...(entry.data() as Record<string, unknown>), id: entry.id }) as T);
}

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

export function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return (parts.map((part) => part[0]).join("") || "K").toUpperCase();
}

export function profileToForm(profile: UserProfile) {
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

export function isNavigationActive(path: string, itemPath: string) {
  if (itemPath === "/") return path === "/";
  if (itemPath === "/opportunities") return path === "/opportunities" || path.startsWith("/opportunity/");
  if (itemPath.startsWith("/profile")) return path.startsWith("/profile");
  return path === itemPath || path.startsWith(`${itemPath}/`);
}

export function pageTitle(path: string) {
  if (path === "/") return "Dashboard";
  if (path === "/network") return "Network";
  if (path === "/opportunities" || path.startsWith("/opportunity/")) return "Opportunities";
  if (path.startsWith("/profile")) return "Profile";
  if (path === "/notifications") return "Notifications";
  if (path.startsWith("/messages")) return "Messages";
  if (path === "/settings") return "Settings";
  if (path === "/admin") return "Admin";
  return "Konnekt";
}
