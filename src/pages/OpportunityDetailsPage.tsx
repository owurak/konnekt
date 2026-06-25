import { useState } from "react";
import type { Opportunity, UserProfile } from "@/types";
import { canViewOpportunity, formatDate } from "@/utils/helpers";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Avatar, Badge, Button, EmptyState, Panel, SectionTitle } from "@/components/ui";

export function OpportunityDetailsPage({
  currentUser,
  users,
  opportunities,
}: {
  currentUser: UserProfile;
  users: UserProfile[];
  opportunities: Opportunity[];
}) {
  const navigate = useNavigate();
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const [contactEmail, setContactEmail] = useState("");
  const opportunity = opportunities.find((item) => item.id === opportunityId && canViewOpportunity(item, currentUser));
  const poster = opportunity ? users.find((user) => user.id === opportunity.posterId) ?? null : null;

  if (!opportunity) {
    return <EmptyState title="Opportunity not found" description="This post may have been removed or is not approved yet." action={<Button onClick={() => navigate("/opportunities")}>Back to opportunities</Button>} />;
  }

  const applyOrContact = () => {
    if (opportunity.applyLink) {
      window.open(opportunity.applyLink, "_blank", "noopener,noreferrer");
      return;
    }
    setContactEmail(poster?.email || "No email available for this poster.");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
      <Panel className="animate-rise">
        <button className="mb-5 flex items-center gap-2 text-sm font-bold text-[#0B6B3A]" type="button" onClick={() => navigate("/opportunities")}><Icon name="arrow" className="h-4 w-4 rotate-180" /> Back to feed</button>
        <div className="flex flex-wrap gap-2">
          <Badge tone={opportunity.type === "Job" ? "primary" : opportunity.type === "Business" ? "gold" : "neutral"}>{opportunity.type}</Badge>
          <Badge tone={opportunity.status === "approved" ? "green" : "red"}>{opportunity.status === "approved" ? "Approved" : "Pending review"}</Badge>
        </div>
        <h1 className="mt-5 font-heading text-3xl font-bold text-[#142019] sm:text-4xl">{opportunity.title}</h1>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
          {opportunity.industry ? <span className="flex items-center gap-2"><Icon name="briefcase" className="h-4 w-4 text-[#0B6B3A]" />{opportunity.industry}</span> : null}
          <span className="flex items-center gap-2"><Icon name="location" className="h-4 w-4 text-[#0B6B3A]" />{opportunity.location}</span>
          {opportunity.budget ? <span>Budget: {opportunity.budget}</span> : null}
          {opportunity.deadline ? <span>Deadline: {formatDate(opportunity.deadline)}</span> : null}
          <span>Posted {formatDate(opportunity.createdAt)}</span>
        </div>
        <p className="mt-8 whitespace-pre-line text-base leading-8 text-slate-600">{opportunity.description}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button onClick={applyOrContact}>{opportunity.applyLink ? "Apply" : "Contact poster"}</Button>
          {contactEmail ? <span className="rounded-2xl bg-[#F8FAF9] px-4 py-3 text-sm font-semibold text-[#0B6B3A]">{contactEmail}</span> : null}
        </div>
      </Panel>

      <Panel>
        <SectionTitle title="Poster information" />
        {poster ? (
          <div className="mt-5">
            <div className="flex items-start gap-4">
              <Avatar user={poster} size="lg" />
              <div>
                <h2 className="font-heading text-xl font-bold text-[#142019]">{poster.fullName}</h2>
                <p className="mt-1 text-sm text-slate-500">{poster.professionalTitle}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="primary">{poster.industry}</Badge>
                  {poster.verified ? <Badge tone="gold">Verified</Badge> : null}
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-500">{poster.bio || "No bio available."}</p>
            <Button className="mt-5 w-full" variant="outline" onClick={() => navigate(`/profile/${poster.id}`)}>View poster profile</Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Poster profile is unavailable.</p>
        )}
      </Panel>
    </div>
  );
}
