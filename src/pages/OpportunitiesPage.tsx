import { useState, type FormEvent } from "react";
import type { CreateOpportunityValues, Opportunity, OpportunityType, UserProfile } from "@/types";
import { canViewOpportunity } from "@/utils/helpers";
import { INDUSTRIES, LOCATIONS, OPPORTUNITY_TYPES } from "@/utils/constants";
import { OpportunityCard } from "@/components/OpportunityCard";
import { Icon } from "@/components/Icon";
import { Button, EmptyState, ErrorMessage, Field, Panel, SectionTitle, SelectField, TextareaField } from "@/components/ui";

export function OpportunitiesPage({
  currentUser,
  users,
  opportunities,
  onCreateOpportunity,
  onDeleteOpportunity,
}: {
  currentUser: UserProfile;
  users: UserProfile[];
  opportunities: Opportunity[];
  onCreateOpportunity: (values: CreateOpportunityValues) => Promise<void>;
  onDeleteOpportunity: (opportunityId: string) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [values, setValues] = useState<CreateOpportunityValues>({
    title: "",
    description: "",
    type: "Job",
    industry: "Technology",
    location: "Remote across Africa",
    budget: "",
    deadline: "",
    applyLink: "",
  });

  const visibleOpportunities = opportunities
    .filter((opportunity) => canViewOpportunity(opportunity, currentUser))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const submitOpportunity = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onCreateOpportunity(values);
      setValues({
        title: "",
        description: "",
        type: "Job",
        industry: "Technology",
        location: "Remote across Africa",
        budget: "",
        deadline: "",
        applyLink: "",
      });
      setShowForm(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create opportunity.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <Panel className="animate-rise">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Opportunities marketplace</p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-[#142019]">Discover jobs, deals, and collaborations</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Latest posts are sorted by date. Non-admin posts stay pending until an admin approves them.</p>
          </div>
          <Button onClick={() => setShowForm((previous) => !previous)}><Icon name="plus" /> {showForm ? "Close form" : "Create opportunity"}</Button>
        </div>
      </Panel>

      {showForm ? (
        <Panel>
          <SectionTitle title="Post an opportunity" />
          {error ? <div className="mt-4"><ErrorMessage message={error} /></div> : null}
          <form className="mt-5 space-y-4" onSubmit={submitOpportunity}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title" value={values.title} onChange={(event) => setValues((previous) => ({ ...previous, title: event.target.value }))} placeholder="Senior React Developer" required />
              <SelectField label="Type" value={values.type} onChange={(event) => setValues((previous) => ({ ...previous, type: event.target.value as OpportunityType }))}>
                {OPPORTUNITY_TYPES.map((typeName) => <option key={typeName}>{typeName}</option>)}
              </SelectField>
            </div>
            <TextareaField label="Description" value={values.description} onChange={(event) => setValues((previous) => ({ ...previous, description: event.target.value }))} placeholder="Describe the role, deal, or collaboration." required />
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField label="Industry" value={values.industry} onChange={(event) => setValues((previous) => ({ ...previous, industry: event.target.value }))}>
                {INDUSTRIES.map((industryName) => <option key={industryName}>{industryName}</option>)}
              </SelectField>
              <SelectField label="Location" value={values.location} onChange={(event) => setValues((previous) => ({ ...previous, location: event.target.value }))}>
                {LOCATIONS.map((locationName) => <option key={locationName}>{locationName}</option>)}
              </SelectField>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Budget" value={values.budget} onChange={(event) => setValues((previous) => ({ ...previous, budget: event.target.value }))} placeholder="$1,000, negotiable, equity" />
              <Field label="Deadline" type="date" value={values.deadline} onChange={(event) => setValues((previous) => ({ ...previous, deadline: event.target.value }))} />
              <Field label="Apply link" value={values.applyLink} onChange={(event) => setValues((previous) => ({ ...previous, applyLink: event.target.value }))} placeholder="https://... (optional)" />
            </div>
            <Button type="submit" loading={submitting}>Publish opportunity</Button>
          </form>
        </Panel>
      ) : null}

      {visibleOpportunities.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleOpportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              poster={users.find((user) => user.id === opportunity.posterId) ?? null}
              currentUser={currentUser}
              onDeleteOpportunity={onDeleteOpportunity}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No opportunities yet — be the first to post."
          description="Create a job, business, or collaboration post for the Konnekt community."
          action={<Button onClick={() => setShowForm(true)}>Post first opportunity</Button>}
        />
      )}
    </div>
  );
}
