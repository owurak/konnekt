import type { Connection, UserProfile } from "@/types";

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
