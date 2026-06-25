import type { Opportunity, UserProfile } from "@/types";
import { formatDate, isAdminUser, relativeTime } from "@/utils/helpers";
import { useNavigate } from "react-router-dom";
import { Avatar, Badge, Button } from "./ui";
import { Icon } from "./Icon";

export function OpportunityCard({
  opportunity,
  poster,
  currentUser,
  onDeleteOpportunity,
}: {
  opportunity: Opportunity;
  poster: UserProfile | null;
  currentUser: UserProfile;
  onDeleteOpportunity: (opportunityId: string) => Promise<void>;
}) {
  const navigate = useNavigate();
  const canDelete = isAdminUser(currentUser) || opportunity.posterId === currentUser.id;
  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70 ring-1 ring-slate-200/70 transition duration-200 hover:-translate-y-1 hover:shadow-md hover:shadow-slate-300 cursor-pointer">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={opportunity.type === "Job" ? "primary" : opportunity.type === "Business" ? "gold" : "neutral"}>{opportunity.type}</Badge>
            {opportunity.status === "pending" ? <Badge tone="red">Pending review</Badge> : null}
          </div>
          <h2 className="mt-4 font-heading text-xl font-bold text-[#142019] transition hover:text-[#0B6B3A]">{opportunity.title}</h2>
        </div>
        <p className="text-xs font-semibold text-slate-400">{relativeTime(opportunity.createdAt)}</p>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{opportunity.description}</p>
      <div className="mt-4 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
        {opportunity.industry ? <span className="flex items-center gap-2"><Icon name="briefcase" className="h-4 w-4 text-[#0B6B3A]" />{opportunity.industry}</span> : null}
        <span className="flex items-center gap-2"><Icon name="location" className="h-4 w-4 text-[#0B6B3A]" />{opportunity.location}</span>
        {opportunity.budget ? <span className="font-semibold text-[#0B6B3A]">Budget: {opportunity.budget}</span> : null}
        {opportunity.deadline ? <span>Deadline: {formatDate(opportunity.deadline)}</span> : null}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <button className="flex min-w-0 items-center gap-3 text-left transition hover:opacity-80 cursor-pointer" type="button" onClick={() => poster && navigate(`/profile/${poster.id}`)}>
          {poster ? <Avatar user={poster} /> : <div className="h-12 w-12 rounded-full bg-slate-200" />}
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-[#142019]">{poster?.fullName || "Konnekt member"}</span>
            <span className="block truncate text-xs text-slate-500">{poster?.professionalTitle || "Poster"}</span>
          </span>
        </button>
        <div className="flex flex-wrap justify-end gap-2">
          {canDelete ? <Button variant="ghost" size="sm" onClick={() => void onDeleteOpportunity(opportunity.id)}>Delete</Button> : null}
          <Button size="sm" onClick={() => navigate(`/opportunity/${opportunity.id}`)}>View Details</Button>
        </div>
      </div>
    </article>
  );
}

export function OpportunityRow({
  opportunity,
  poster,
}: {
  opportunity: Opportunity;
  poster: UserProfile | null;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl bg-[#F8FAF9] p-4 transition duration-200 hover:bg-white hover:shadow-sm hover:shadow-slate-200/70 hover:ring-1 hover:ring-slate-200/70 cursor-pointer">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-2">
          <Badge tone={opportunity.type === "Job" ? "primary" : opportunity.type === "Business" ? "gold" : "neutral"}>{opportunity.type}</Badge>
          {opportunity.status === "pending" ? <Badge tone="red">Pending</Badge> : null}
        </div>
        <p className="mt-2 truncate font-semibold text-[#142019]">{opportunity.title}</p>
        <p className="truncate text-xs text-slate-500">
          {poster?.fullName || "Konnekt member"} · {relativeTime(opportunity.createdAt)}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={() => navigate(`/opportunity/${opportunity.id}`)}>
        View
      </Button>
    </div>
  );
}
