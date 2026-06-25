import { useState } from "react";
import type { BusinessListing, Connection, Message, NotificationItem, Opportunity, UserProfile } from "@/types";
import { isAdminUser, relativeTime } from "@/utils/helpers";
import { cn } from "@/utils/cn";
import { AdminStat, AnalyticsPanel, Avatar, Badge, Button, EmptyState, ErrorMessage, Panel, SuccessMessage } from "@/components/ui";

export function AdminPage({
  currentUser,
  users,
  connections,
  opportunities,
  listings,
  messages,
  notifications,
  onSaveUser,
  onApproveOpportunity,
  onDeleteOpportunity,
  onApproveListing,
  onDeleteListing,
  onSeedDemoData,
}: {
  currentUser: UserProfile;
  users: UserProfile[];
  connections: Connection[];
  opportunities: Opportunity[];
  listings: BusinessListing[];
  messages: Message[];
  notifications: NotificationItem[];
  onSaveUser: (userId: string, patch: Partial<UserProfile>) => Promise<void>;
  onApproveOpportunity: (opportunityId: string) => Promise<void>;
  onDeleteOpportunity: (opportunityId: string) => Promise<void>;
  onApproveListing: (listingId: string) => Promise<void>;
  onDeleteListing: (listingId: string) => Promise<void>;
  onSeedDemoData: () => Promise<void>;
}) {
  const [tab, setTab] = useState<"users" | "opportunities" | "listings" | "analytics">("users");
  const [working, setWorking] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  const pendingOpportunities = opportunities.filter((opportunity) => opportunity.status === "pending");
  const pendingListings = listings.filter((listing) => listing.status === "pending");
  const acceptedConnections = connections.filter((connection) => connection.status === "accepted");
  const engagementScore = acceptedConnections.length + messages.length + notifications.length + listings.length;

  const withWorking = async (id: string, action: () => Promise<void>) => {
    setWorking(id);
    setAdminError("");
    setAdminSuccess("");
    try {
      await action();
      setAdminSuccess("Admin action completed successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Admin action failed.";
      const permissionHint = message.toLowerCase().includes("permission")
        ? ` Firestore rejected this as non-admin. Confirm users/${currentUser.id} has role set to admin, then publish the latest firestore.rules.`
        : "";
      setAdminError(`${message}${permissionHint}`);
    } finally {
      setWorking("");
    }
  };

  return (
    <div className="space-y-5">
      <Panel className="animate-rise">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Admin panel</p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-[#142019]">Trust, moderation, and approvals</h1>
            <p className="mt-2 text-sm text-slate-500">Accessible only to admin accounts. Current admin: {currentUser.fullName}.</p>
          </div>
          <Button variant="secondary" onClick={() => void withWorking("seed", onSeedDemoData)} loading={working === "seed"}>Seed demo data</Button>
        </div>
      </Panel>

      {adminError ? <ErrorMessage message={adminError} /> : null}
      {adminSuccess ? <SuccessMessage message={adminSuccess} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStat label="Users" value={users.length} />
        <AdminStat label="Suspended" value={users.filter((user) => user.suspended).length} />
        <AdminStat label="Pending posts" value={pendingOpportunities.length} />
        <AdminStat label="Pending listings" value={pendingListings.length} />
      </div>

      <Panel>
        <div className="flex flex-wrap gap-2">
          {(["users", "opportunities", "listings", "analytics"] as const).map((item) => (
            <button key={item} className={cn("rounded-2xl px-4 py-2 text-sm font-bold capitalize transition", tab === item ? "bg-[#0B6B3A] text-white" : "bg-[#F8FAF9] text-slate-600 hover:text-[#0B6B3A]")} type="button" onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </div>

        {tab === "users" ? (
          <div className="mt-5 space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar user={user} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-[#142019]">{user.fullName}</p>
                      {isAdminUser(user) ? <Badge tone="primary">Admin</Badge> : null}
                      {user.verified ? <Badge tone="gold">Verified</Badge> : null}
                      {user.suspended ? <Badge tone="red">Suspended</Badge> : null}
                    </div>
                    <p className="text-sm text-slate-500">{user.professionalTitle} - {user.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" disabled={working === `verify-${user.id}`} loading={working === `verify-${user.id}`} onClick={() => void withWorking(`verify-${user.id}`, () => onSaveUser(user.id, { verified: !user.verified }))}>
                    {user.verified ? "Unverify" : "Verify"}
                  </Button>
                  <Button variant={user.suspended ? "success" : "danger"} size="sm" disabled={user.id === currentUser.id || working === `suspend-${user.id}`} loading={working === `suspend-${user.id}`} onClick={() => void withWorking(`suspend-${user.id}`, () => onSaveUser(user.id, { suspended: !user.suspended }))}>
                    {user.suspended ? "Restore" : "Suspend"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "opportunities" ? (
          <div className="mt-5 space-y-3">
            {opportunities.map((opportunity) => (
              <div key={opportunity.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={opportunity.status === "approved" ? "green" : "red"}>{opportunity.status}</Badge>
                    <Badge tone="primary">{opportunity.type}</Badge>
                  </div>
                  <h3 className="mt-3 font-heading text-lg font-bold text-[#142019]">{opportunity.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{opportunity.location} - {relativeTime(opportunity.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {opportunity.status !== "approved" ? (
                    <Button size="sm" loading={working === `approve-${opportunity.id}`} onClick={() => void withWorking(`approve-${opportunity.id}`, () => onApproveOpportunity(opportunity.id))}>Approve post</Button>
                  ) : null}
                  <Button variant="danger" size="sm" loading={working === `delete-${opportunity.id}`} onClick={() => void withWorking(`delete-${opportunity.id}`, () => onDeleteOpportunity(opportunity.id))}>Remove spam</Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "listings" ? (
          <div className="mt-5 space-y-3">
            {listings.length ? listings.map((listing) => (
              <div key={listing.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-4">
                  <div className="h-20 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#0B6B3A]/10">
                    {listing.imageUrl ? <img className="h-full w-full object-cover" src={listing.imageUrl} alt={listing.name} /> : null}
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={listing.status === "approved" ? "green" : "red"}>{listing.status || "approved"}</Badge>
                      <Badge tone="primary">{listing.category}</Badge>
                      {listing.price ? <Badge tone="gold">{listing.price}</Badge> : null}
                    </div>
                    <h3 className="mt-3 font-heading text-lg font-bold text-[#142019]">{listing.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">Seller: {listing.sellerName || "Unknown"} - {listing.location}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {listing.status !== "approved" ? (
                    <Button size="sm" loading={working === `approve-listing-${listing.id}`} onClick={() => void withWorking(`approve-listing-${listing.id}`, () => onApproveListing(listing.id))}>Approve listing</Button>
                  ) : null}
                  <Button variant="danger" size="sm" loading={working === `delete-listing-${listing.id}`} onClick={() => void withWorking(`delete-listing-${listing.id}`, () => onDeleteListing(listing.id))}>Remove listing</Button>
                </div>
              </div>
            )) : (
              <EmptyState title="No listings yet" description="Posted product and business listings will appear here for moderation." />
            )}
          </div>
        ) : null}

        {tab === "analytics" ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <AnalyticsPanel title="User growth" value={`${users.length} profiles`} detail={`${users.filter((user) => user.verified).length} verified profiles`} />
            <AnalyticsPanel title="Revenue" value="$0 MVP" detail="Premium accounts are excluded from this launch build." />
            <AnalyticsPanel title="Engagement" value={`${engagementScore} actions`} detail="Connections, messages, notifications, and listings combined." />
            <div className="rounded-3xl bg-[#F8FAF9] p-5 lg:col-span-3">
              <h3 className="font-heading text-lg font-bold text-[#142019]">MVP scope</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Groups, events, premium accounts, file sharing, read receipts, and complex analytics are intentionally excluded from this first build.
              </p>
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
