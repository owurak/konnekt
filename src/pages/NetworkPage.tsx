import { useState } from "react";
import type { Connection, UserProfile } from "@/types";
import { normalize } from "@/utils/helpers";
import { NetworkUserCard } from "@/components/NetworkUserCard";
import { Icon } from "@/components/Icon";
import { Badge, EmptyState, Panel } from "@/components/ui";

export function NetworkPage({
  currentUser,
  users,
  connections,
  onConnect,
  onRespondConnection,
}: {
  currentUser: UserProfile;
  users: UserProfile[];
  connections: Connection[];
  onConnect: (receiverId: string) => Promise<void>;
  onRespondConnection: (connectionId: string, status: "accepted" | "rejected") => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("All");
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("All");

  const availableIndustries = Array.from(new Set(users.map((user) => user.industry).filter(Boolean))).sort();
  const availableLocations = Array.from(new Set(users.map((user) => user.location).filter(Boolean))).sort();

  const filteredUsers = users
    .filter((user) => user.id !== currentUser.id && !user.suspended)
    .filter((user) => {
      const query = normalize(search);
      const matchesSearch =
        !query ||
        [user.fullName, user.professionalTitle, user.industry, user.location, user.bio, user.skills.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesIndustry = industry === "All" || user.industry === industry;
      const matchesLocation = location === "All" || user.location === location;
      const matchesSkill = !skill || user.skills.some((item) => normalize(item).includes(normalize(skill)));
      return matchesSearch && matchesIndustry && matchesLocation && matchesSkill;
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <div className="space-y-5">
      <Panel className="animate-rise">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Network page</p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-[#142019]">Find African professionals</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Search by name, industry, skills, and location. Filters update in real time as you type.
            </p>
          </div>
          <Badge tone="primary">{filteredUsers.length} professionals</Badge>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative block md:col-span-2 xl:col-span-1">
            <span className="sr-only">Search users</span>
            <Icon name="search" className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#0B6B3A] focus:ring-4 focus:ring-[#0B6B3A]/10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search people, roles, skills"
            />
          </label>
          <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition cursor-pointer focus:border-[#0B6B3A] focus:ring-4 focus:ring-[#0B6B3A]/10 hover:border-slate-300" value={industry} onChange={(event) => setIndustry(event.target.value)}>
            <option>All</option>
            {availableIndustries.map((item) => <option key={item}>{item}</option>)}
          </select>
          <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0B6B3A] focus:ring-4 focus:ring-[#0B6B3A]/10" value={skill} onChange={(event) => setSkill(event.target.value)} placeholder="Filter by skill" />
          <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition cursor-pointer focus:border-[#0B6B3A] focus:ring-4 focus:ring-[#0B6B3A]/10 hover:border-slate-300" value={location} onChange={(event) => setLocation(event.target.value)}>
            <option>All</option>
            {availableLocations.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </Panel>

      {filteredUsers.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredUsers.map((profile) => (
            <NetworkUserCard
              key={profile.id}
              profile={profile}
              currentUser={currentUser}
              connections={connections}
              onConnect={onConnect}
              onRespondConnection={onRespondConnection}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No professionals found" description="Try a broader skill, industry, or location filter." />
      )}
    </div>
  );
}
