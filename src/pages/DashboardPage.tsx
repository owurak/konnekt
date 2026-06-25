import { useState } from "react";
import type { BusinessListing, Connection, CreateListingValues, NotificationItem, Opportunity, UserProfile } from "@/types";
import { canViewOpportunity, getAcceptedConnectionCount, getConnectedProfiles, getSuggestedUsers, isAdminUser } from "@/utils/helpers";
import { cn } from "@/utils/cn";
import { useNavigate } from "react-router-dom";
import { getDirectoryMatches, BusinessResults } from "@/components/BusinessDirectory";
import { NetworkUserCard } from "@/components/NetworkUserCard";
import { NotificationRow } from "@/components/NotificationRow";
import { OpportunityRow } from "@/components/OpportunityCard";
import { CreateListingPanel } from "@/components/CreateListingPanel";
import { Icon } from "@/components/Icon";
import { Avatar, Badge, Button, DashboardSkeleton, EmptyState, Panel, SectionTitle, SuccessMessage } from "@/components/ui";

export function DashboardPage({
  currentUser,
  users,
  connections,
  opportunities,
  listings,
  notifications,
  loading,
  onConnect,
  onRespondConnection,
  onMarkNotificationRead,
  onCreateListing,
}: {
  currentUser: UserProfile;
  users: UserProfile[];
  connections: Connection[];
  opportunities: Opportunity[];
  listings: BusinessListing[];
  notifications: NotificationItem[];
  loading: boolean;
  onConnect: (receiverId: string) => Promise<void>;
  onRespondConnection: (connectionId: string, status: "accepted" | "rejected") => Promise<void>;
  onMarkNotificationRead: (notificationId: string) => Promise<void>;
  onCreateListing: (values: CreateListingValues) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [selectedDashboardCategory, setSelectedDashboardCategory] = useState("Beauty & Makeup");
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [showListingForm, setShowListingForm] = useState(false);
  const [listingSuccess, setListingSuccess] = useState("");
  const visibleOpportunities = opportunities
    .filter((opportunity) => canViewOpportunity(opportunity, currentUser))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const suggestedUsers = getSuggestedUsers(currentUser, users, connections).slice(0, 4);
  const userNotifications = notifications
    .filter((notification) => notification.userId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
  const pendingRequests = connections
    .filter((connection) => connection.receiverId === currentUser.id && connection.status === "pending")
    .slice(0, 3);
  const connectedProfiles = getConnectedProfiles(currentUser.id, users, connections).slice(0, 5);
  const acceptedConnectionCount = getAcceptedConnectionCount(currentUser.id, connections);
  const approvedOpportunityCount = opportunities.filter((opportunity) => opportunity.status === "approved").length;
  const profileCompletionItems = [
    currentUser.fullName,
    currentUser.professionalTitle,
    currentUser.industry,
    currentUser.location,
    currentUser.bio,
    currentUser.skills.length ? "skills" : "",
  ];
  const profileCompletion = Math.round(
    (profileCompletionItems.filter(Boolean).length / profileCompletionItems.length) * 100
  );
  const dashboardCategories = [
    {
      title: "Beauty & Makeup",
      image: "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
    },
    {
      title: "Groceries & Food",
      image: "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
    },
    {
      title: "Electronics",
      image: "https://images.pexels.com/photos/1841841/pexels-photo-1841841.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
    },
    {
      title: "Shoes & Footwear",
      image: "https://images.pexels.com/photos/19090/pexels-photo.jpg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
    },
  ];
  const visibleListings = listings.filter(
    (listing) => listing.status === "approved" || listing.sellerId === currentUser.id || isAdminUser(currentUser)
  );
  const dashboardBusinesses = getDirectoryMatches(selectedDashboardCategory, dashboardSearch, visibleListings);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr]">
      <div className="space-y-5">
        <section className="animate-rise overflow-hidden rounded-[1.75rem] bg-[#1f1f1f] text-white shadow-xl shadow-slate-900/10 ring-1 ring-black/5">
          <div className="bg-[#003b1f] px-5 py-8 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-white/35">Business Directory</p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d9dedb] font-serif text-sm font-bold italic text-[#003b1f] shadow-lg">
                K
              </div>
              <h1 className="font-serif text-5xl font-black uppercase leading-none tracking-[-0.03em] text-white">KONNEKT</h1>
            </div>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/82">
              Find, connect & do business with local entrepreneurs. Welcome back, {currentUser.fullName.split(" ")[0]}.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button className="rounded-full border border-white/12 bg-[#00361d] px-4 py-2 text-sm font-medium text-white/90" type="button" onClick={() => navigate("/network")}>Find</button>
              <button className="rounded-full border border-white/12 bg-[#00361d] px-4 py-2 text-sm font-medium text-white/90" type="button" onClick={() => navigate("/messages")}>Connect</button>
              <button className="rounded-full border border-white/12 bg-[#00361d] px-4 py-2 text-sm font-medium text-white/90" type="button" onClick={() => navigate("/opportunities")}>Grow</button>
              <button className="rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-extrabold text-[#241c06]" type="button" onClick={() => setShowListingForm((previous) => !previous)}>Post Listing</button>
            </div>
          </div>

          <div className="border-b border-[#313131] px-4 py-4">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <label className="relative block">
                <Icon name="search" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/42" />
                <input
                  className="h-12 w-full rounded-xl border border-[#555663] bg-[#2a2a2a] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/42 focus:border-[#008a58]"
                  placeholder="Search business categories..."
                  value={dashboardSearch}
                  onChange={(event) => setDashboardSearch(event.target.value)}
                />
              </label>
              <button className="h-12 rounded-xl bg-[#003b1f] px-4 text-sm font-extrabold text-white" type="button" onClick={() => setSelectedDashboardCategory("")}>Search</button>
            </div>
          </div>

          <div className="px-4 py-7">
            <h2 className="font-serif text-3xl font-black uppercase leading-none tracking-[-0.02em] text-white">Featured Categories</h2>
            <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4">
              {dashboardCategories.map((category) => (
                <button
                  key={category.title}
                  className={cn(
                    "overflow-hidden rounded-xl bg-[#202020] text-left ring-1 ring-white/[0.03]",
                    selectedDashboardCategory === category.title && "ring-2 ring-[#008a58]"
                  )}
                  type="button"
                  onClick={() => {
                    setSelectedDashboardCategory(category.title);
                    setDashboardSearch("");
                  }}
                >
                  <div className="relative h-28 overflow-hidden">
                    <img className="h-full w-full object-cover opacity-72" src={category.image} alt={category.title} />
                    <div className="absolute inset-0 bg-black/18" />
                  </div>
                  <p className="px-2 py-3 text-center text-base font-normal leading-tight text-white">{category.title}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 px-4 pb-6">
            <BusinessResults title={dashboardSearch ? `Search results for "${dashboardSearch}"` : selectedDashboardCategory} businesses={dashboardBusinesses} />
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-7 bg-[#003b1f] px-4 py-7 text-center">
            <div>
              <Icon name="network" className="mx-auto h-7 w-7 text-white/70" />
              <p className="mt-2 text-lg font-extrabold text-white">{acceptedConnectionCount} Connections</p>
              <p className="text-sm text-white/68">Accepted network</p>
            </div>
            <div>
              <Icon name="briefcase" className="mx-auto h-7 w-7 text-white/70" />
              <p className="mt-2 text-lg font-extrabold text-white">{approvedOpportunityCount} Opportunities</p>
              <p className="text-sm text-white/68">Approved posts</p>
            </div>
            <div>
              <Icon name="user" className="mx-auto h-7 w-7 text-white/70" />
              <p className="mt-2 text-lg font-extrabold text-white">{profileCompletion}% Profile</p>
              <p className="text-sm text-white/68">Completion score</p>
            </div>
            <div>
              <Icon name="shield" className="mx-auto h-7 w-7 text-white/70" />
              <p className="mt-2 text-lg font-extrabold text-white">Verified</p>
              <p className="text-sm text-white/68">Trusted listings</p>
            </div>
          </div>
        </section>

        {listingSuccess ? <SuccessMessage message={listingSuccess} /> : null}
        {showListingForm ? (
          <CreateListingPanel
            currentUser={currentUser}
            onCreateListing={async (values) => {
              await onCreateListing(values);
              setListingSuccess(isAdminUser(currentUser) ? "Listing published under its category." : "Listing submitted. It will appear publicly after admin approval.");
              setShowListingForm(false);
            }}
            onCancel={() => setShowListingForm(false)}
          />
        ) : null}

        <Panel>
          <SectionTitle title="Recent opportunities" action={<button className="text-sm font-bold text-[#0B6B3A]" type="button" onClick={() => navigate("/opportunities")}>View all</button>} />
          <div className="mt-4 space-y-3">
            {visibleOpportunities.length ? (
              visibleOpportunities.map((opportunity) => (
                <OpportunityRow key={opportunity.id} opportunity={opportunity} poster={users.find((user) => user.id === opportunity.posterId) ?? null} />
              ))
            ) : (
              <EmptyState
                title="No opportunities yet — be the first to post."
                description="Share a job, business lead, or collaboration request with the Konnekt network."
                action={<Button onClick={() => navigate("/opportunities")}>Create opportunity</Button>}
              />
            )}
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Suggested connections" action={<button className="text-sm font-bold text-[#0B6B3A]" type="button" onClick={() => navigate("/network")}>Search network</button>} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {suggestedUsers.length ? (
              suggestedUsers.map((profile) => (
                <NetworkUserCard
                  key={profile.id}
                  profile={profile}
                  currentUser={currentUser}
                  connections={connections}
                  compact
                  onConnect={onConnect}
                  onRespondConnection={onRespondConnection}
                />
              ))
            ) : (
              <div className="sm:col-span-2">
                <EmptyState title="No suggestions yet" description="Add more skills to your profile to improve recommendations." />
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel>
          <SectionTitle title="Notifications preview" action={<button className="text-sm font-bold text-[#0B6B3A]" type="button" onClick={() => navigate("/notifications")}>Open</button>} />
          <div className="mt-4 space-y-3">
            {userNotifications.length ? (
              userNotifications.map((notification) => (
                <NotificationRow key={notification.id} notification={notification} onMarkRead={onMarkNotificationRead} />
              ))
            ) : (
              <EmptyState title="No alerts" description="Connection requests and opportunity matches will appear here." />
            )}
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Connection requests" />
          <div className="mt-4 space-y-3">
            {pendingRequests.length ? (
              pendingRequests.map((request) => {
                const sender = users.find((user) => user.id === request.senderId);
                if (!sender) return null;
                return (
                  <div key={request.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <Avatar user={sender} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#142019]">{sender.fullName}</p>
                        <p className="text-sm text-slate-500">{sender.professionalTitle}</p>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" onClick={() => void onRespondConnection(request.id, "accepted")}>Accept</Button>
                          <Button size="sm" variant="outline" onClick={() => void onRespondConnection(request.id, "rejected")}>Decline</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState title="No pending requests" description="When someone wants to connect, it will show up here." />
            )}
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Your connections" action={<button className="text-sm font-bold text-[#0B6B3A]" type="button" onClick={() => navigate("/network")}>Network</button>} />
          <div className="mt-4 space-y-2">
            {connectedProfiles.length ? (
              connectedProfiles.map((profile) => (
                <button key={profile.id} className="flex w-full items-center gap-3 rounded-3xl p-3 text-left transition hover:bg-[#F8FAF9]" type="button" onClick={() => navigate(`/profile/${profile.id}`)}>
                  <Avatar user={profile} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#142019]">{profile.fullName}</p>
                    <p className="truncate text-xs text-slate-500">{profile.professionalTitle}</p>
                  </div>
                  <Badge tone="green">Connected</Badge>
                </button>
              ))
            ) : (
              <EmptyState title="No connections yet" description="Search the network and send your first connection request." />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
