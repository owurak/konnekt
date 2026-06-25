import type { UserProfile } from "@/types";
import { EmptyState, InfoLine, Panel } from "@/components/ui";

export function AccessDenied({ currentUser }: { currentUser?: UserProfile }) {
  return (
    <div className="space-y-4">
      <EmptyState
        title="Admin access required"
        description="Only admin accounts can view moderation tools and platform controls."
      />
      {currentUser ? (
        <Panel>
          <h2 className="font-heading text-lg font-bold text-[#142019]">Current account check</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoLine icon="shield" label="Current role" value={currentUser.role} />
            <InfoLine icon="user" label="Current user ID" value={currentUser.id} />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            In Firebase Authentication, copy this exact user ID. In Firestore, open users/{currentUser.id} and set the role field to admin as a string.
          </p>
        </Panel>
      ) : null}
    </div>
  );
}
