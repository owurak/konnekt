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
  const userListings = listings.filter((listing) => listing.sellerId === currentUser.id);
  const pendingListingCount = userListings.filter((listing) => listing.status === "pending").length;
  const verifiedListingCount = visibleListings.filter((listing) => listing.verified).length;
  const aiSuggestions = [
    profileCompletion < 85
      ? `Complete your profile bio and skills to improve trust before customers contact you. You are at ${profileCompletion}%.`
      : "Your profile looks strong. Pin your best service or product listing next to convert profile visits.",
    userListings.length
      ? "Refresh one listing title with price, location, and delivery details so marketplace search can match it faster."
      : "Create your first listing with a clear image, price, condition, and WhatsApp number to start selling.",
    visibleOpportunities.length
      ? "Reply to one opportunity today and mention your relevant skills in the first two lines."
      : "Post a collaboration, service request, or job lead to activate the professional side of your network.",
  ];
  const monetizationCards = [
    { title: "Boosted listings", detail: "Sellers pay to rank above normal results for 7 or 30 days." },
    { title: "Verified seller badges", detail: "Charge a monthly fee for identity checks, trust badges, and priority support." },
    { title: "Lead credits", detail: "Businesses buy credits to unlock premium leads, messages, or opportunity applications." },
  ];

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr]">
      <div className="space-y-5">
        <section className="animate-rise overflow-hidden rounded-[1.75rem] bg-[#071D2B] text-white shadow-xl shadow-cyan-950/15 ring-1 ring-cyan-950/10">
          <div className="px-5 py-8 sm:px-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#2DD4BF]">LinkedIn meets marketplace</p>
                <h1 className="mt-3 max-w-2xl font-heading text-4xl font-black leading-tight text-white sm:text-5xl">
                  Build your network, sell your work, and turn attention into income.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-cyan-50/78">
                  Welcome back, {currentUser.fullName.split(" ")[0]}. Use Konnekt as your professional profile, seller storefront, opportunity board, and customer inbox.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button className="bg-[#00A86B] hover:bg-[#008F5B]" onClick={() => setShowListingForm((previous) => !previous)}>
                  <Icon name="plus" /> List item
                </Button>
                <Button className="bg-[#FFB020] text-[#241604] hover:bg-[#F5A000]" onClick={() => navigate("/opportunities")}>
                  <Icon name="briefcase" /> Create lead
                </Button>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Connections", value: acceptedConnectionCount, helper: "Professional network", icon: "network" as const },
                { label: "Marketplace", value: visibleListings.length, helper: `${pendingListingCount} pending review`, icon: "briefcase" as const },
                { label: "Opportunities", value: approvedOpportunityCount, helper: "Approved leads", icon: "mail" as const },
                { label: "Profile", value: `${profileCompletion}%`, helper: "Trust score", icon: "shield" as const },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <Icon name={stat.icon} className="h-5 w-5 text-[#2DD4BF]" />
                  <p className="mt-3 text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-sm font-bold text-white">{stat.label}</p>
                  <p className="mt-1 text-xs text-cyan-50/58">{stat.helper}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-y border-white/10 bg-[#0B2A3C] px-4 py-4">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <label className="relative block">
                <Icon name="search" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-50/50" />
                <input
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 pl-11 pr-4 text-sm text-white outline-none placeholder:text-cyan-50/48 focus:border-[#2DD4BF]"
                  placeholder="Search products, services, sellers, or categories..."
                  value={dashboardSearch}
                  onChange={(event) => setDashboardSearch(event.target.value)}
                />
              </label>
              <button className="h-12 rounded-xl bg-[#00A86B] px-4 text-sm font-extrabold text-white" type="button" onClick={() => setSelectedDashboardCategory("")}>Search</button>
            </div>
          </div>

          <div className="px-4 py-7">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#2DD4BF]">Marketplace</p>
                <h2 className="mt-1 font-heading text-2xl font-black text-white">Buy, sell, and discover services</h2>
              </div>
              <button className="text-sm font-bold text-[#FFB020]" type="button" onClick={() => setShowListingForm(true)}>Post listing</button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4">
              {dashboardCategories.map((category) => (
                <button
                  key={category.title}
                  className={cn(
                    "overflow-hidden rounded-xl bg-white/[0.06] text-left ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-[#2DD4BF]",
                    selectedDashboardCategory === category.title && "ring-2 ring-[#2DD4BF]"
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
        </section>

        <Panel className="border border-[#2DD4BF]/20 bg-[#ECFEFF]">
          <SectionTitle title="AI growth assistant" action={<Badge tone="primary">Beta</Badge>} />
          <div className="mt-4 grid gap-3">
            {aiSuggestions.map((suggestion) => (
              <div key={suggestion} className="rounded-2xl border border-cyan-200 bg-white p-4 text-sm leading-6 text-slate-700">
                <span className="font-bold text-[#0F766E]">AI suggestion: </span>
                {suggestion}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-[#071D2B] p-4 text-sm leading-6 text-cyan-50/80">
            Later, connect this panel to an OpenAI-powered backend endpoint to rewrite listings, generate outreach messages, recommend matches, and detect spam before admin review.
          </div>
        </Panel>

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
        <Panel className="border border-amber-200 bg-[#FFFBEB]">
          <SectionTitle title="Creator dashboard" action={<Badge tone="green">{verifiedListingCount} verified</Badge>} />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white p-3">
              <p className="text-xl font-black text-[#071D2B]">{userListings.length}</p>
              <p className="text-[11px] font-bold uppercase text-slate-500">Listings</p>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <p className="text-xl font-black text-[#071D2B]">{pendingListingCount}</p>
              <p className="text-[11px] font-bold uppercase text-slate-500">Pending</p>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <p className="text-xl font-black text-[#071D2B]">{visibleOpportunities.length}</p>
              <p className="text-[11px] font-bold uppercase text-slate-500">Leads</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <Button className="w-full bg-[#00A86B] hover:bg-[#008F5B]" onClick={() => setShowListingForm(true)}>
              <Icon name="plus" /> Create listing
            </Button>
            <Button className="w-full" variant="outline" onClick={() => navigate("/opportunities")}>
              <Icon name="briefcase" /> Post opportunity
            </Button>
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Revenue ideas" />
          <div className="mt-4 space-y-3">
            {monetizationCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-heading text-sm font-bold text-[#071D2B]">{card.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{card.detail}</p>
              </div>
            ))}
          </div>
        </Panel>

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
