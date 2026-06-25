import type { Connection, UserProfile } from "@/types";
import { getConnectionState } from "@/utils/helpers";
import { useNavigate } from "react-router-dom";
import { Button, Badge } from "./ui";
import { Icon } from "./Icon";

export function ConnectionControls({
  currentUser,
  target,
  connections,
  onConnect,
  onRespondConnection,
}: {
  currentUser: UserProfile;
  target: UserProfile;
  connections: Connection[];
  onConnect: (receiverId: string) => Promise<void>;
  onRespondConnection: (connectionId: string, status: "accepted" | "rejected") => Promise<void>;
}) {
  const navigate = useNavigate();
  const { state, connection } = getConnectionState(target.id, currentUser.id, connections);

  if (state === "connected") {
    return (
      <>
        <Badge tone="green">Connected</Badge>
        <Button variant="outline" size="sm" onClick={() => navigate(`/messages/${target.id}`)}>
          <Icon name="message" className="h-4 w-4" /> Message
        </Button>
      </>
    );
  }
  if (state === "sent") return <Badge tone="gold">Request sent</Badge>;
  if (state === "received" && connection) {
    return (
      <>
        <Button size="sm" onClick={() => void onRespondConnection(connection.id, "accepted")}>Accept</Button>
        <Button size="sm" variant="outline" onClick={() => void onRespondConnection(connection.id, "rejected")}>Decline</Button>
      </>
    );
  }
  return (
    <Button size="sm" onClick={() => void onConnect(target.id)}>
      <Icon name="plus" className="h-4 w-4" /> Connect
    </Button>
  );
}
