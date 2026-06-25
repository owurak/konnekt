import type { Connection, UserProfile } from "@/types";
import { getAcceptedConnectionCount } from "@/utils/helpers";
import { useNavigate } from "react-router-dom";
import { Avatar, Badge } from "./ui";
import { Icon } from "./Icon";
import { ConnectionControls } from "./ConnectionControls";

export function NetworkUserCard({
  profile,
  currentUser,
  connections,
  compact = false,
  onConnect,
  onRespondConnection,
}: {
  profile: UserProfile;
  currentUser: UserProfile;
  connections: Connection[];
  compact?: boolean;
  onConnect: (receiverId: string) => Promise<void>;
  onRespondConnection: (connectionId: string, status: "accepted" | "rejected") => Promise<void>;
}) {
  const navigate = useNavigate();
  const connectionCount = getAcceptedConnectionCount(profile.id, connections);

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70 ring-1 ring-slate-200/70 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200">
      <div className="flex items-start gap-4">
        <button type="button" onClick={() => navigate(`/profile/${profile.id}`)}>
          <Avatar user={profile} size={compact ? "md" : "lg"} />
        </button>
        <div className="min-w-0 flex-1">
          <button className="block truncate text-left font-heading text-lg font-bold text-[#142019] hover:text-[#0B6B3A]" type="button" onClick={() => navigate(`/profile/${profile.id}`)}>
            {profile.fullName}
          </button>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{profile.professionalTitle}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="primary">{profile.industry}</Badge>
            <Badge tone="neutral">{connectionCount} connection{connectionCount === 1 ? "" : "s"}</Badge>
            {profile.verified ? <Badge tone="gold">Verified</Badge> : null}
          </div>
        </div>
      </div>
      {!compact ? (
        <div className="mt-4 space-y-2 text-sm text-slate-500">
          <p className="flex items-center gap-2"><Icon name="location" className="h-4 w-4 text-[#0B6B3A]" />{profile.location}</p>
          <div className="flex flex-wrap gap-2">
            {profile.skills.slice(0, 3).map((skillName) => <span key={skillName} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{skillName}</span>)}
          </div>
        </div>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <ConnectionControls currentUser={currentUser} target={profile} connections={connections} onConnect={onConnect} onRespondConnection={onRespondConnection} />
      </div>
    </article>
  );
}
