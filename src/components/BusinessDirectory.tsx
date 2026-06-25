import type { BusinessListing } from "@/types";
import { normalize } from "@/utils/helpers";
import { cn } from "@/utils/cn";
import { Badge } from "./ui";
import { Icon } from "./Icon";
import { BUSINESS_LISTINGS } from "@/data/listings";

export function getDirectoryMatches(category: string, search: string, source: BusinessListing[] = BUSINESS_LISTINGS) {
  const query = normalize(search);
  return source
    .filter((business) => (business.status || "approved") === "approved" || business.status === "pending")
    .filter((business) => {
      const matchesCategory = !category || business.category === category;
      const matchesSearch =
        !query ||
        [business.name, business.category, business.description, business.location, business.sellerName, business.price]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesSearch && (query ? true : matchesCategory);
    })
    .sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime());
}

export function DirectorySection({
  title,
  categories,
  selectedCategory,
  onSelect,
}: {
  title: string;
  categories: Array<{ title: string; image: string }>;
  selectedCategory: string;
  onSelect: (category: string) => void;
}) {
  return (
    <div>
      <h2 className="font-heading text-[2rem] font-black leading-tight text-white sm:text-4xl">{title}</h2>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
        {categories.map((category) => (
          <button
            key={category.title}
            className={cn(
              "group overflow-hidden rounded-xl bg-[#0B2A3C] text-left shadow-lg shadow-black/10 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-[#2DD4BF]/70",
              selectedCategory === category.title && "ring-2 ring-[#2DD4BF]"
            )}
            type="button"
            onClick={() => onSelect(category.title)}
          >
            <div className="relative h-[9.55rem] overflow-hidden sm:h-48">
              <img className="h-full w-full object-cover opacity-72 transition duration-300 group-hover:scale-105 group-hover:opacity-90" src={category.image} alt={category.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071D2B]/70 to-transparent" />
            </div>
            <p className="px-3 py-3 text-center text-base font-bold leading-tight text-white sm:text-xl">{category.title}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function BusinessResults({ title, businesses }: { title: string; businesses: BusinessListing[] }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-heading text-2xl font-black text-white sm:text-3xl">{title || "Listings"}</h2>
        <span className="rounded-full bg-[#00A86B] px-3 py-1 text-xs font-bold text-white">{businesses.length} found</span>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {businesses.length ? businesses.map((business) => (
          <article key={business.id} className="overflow-hidden rounded-2xl bg-white text-[#071D2B] shadow-lg shadow-cyan-950/10 ring-1 ring-slate-200">
            <div className="relative h-44 bg-[#E6F7F4]">
              {business.imageUrl ? (
                <img className="h-full w-full object-cover" src={business.imageUrl} alt={business.name} />
              ) : (
                <div className="flex h-full items-center justify-center bg-[#0B2A3C] px-5 text-center font-heading text-2xl font-black text-white/80">
                  {business.category}
                </div>
              )}
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                {business.verified ? <Badge tone="green">Verified</Badge> : <Badge>New seller</Badge>}
                {business.status === "pending" ? <Badge tone="red">Pending approval</Badge> : null}
              </div>
              {business.price ? (
                <div className="absolute bottom-3 left-3 rounded-full bg-[#FFB020] px-3 py-1 text-sm font-extrabold text-[#241604] shadow-lg">
                  {business.price}
                </div>
              ) : null}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-lg font-bold text-[#071D2B]">{business.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#0F766E]">{business.category}</p>
                </div>
                {business.condition ? <Badge tone="primary">{business.condition}</Badge> : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{business.description}</p>
              <div className="mt-4 grid gap-2 text-sm text-slate-500">
                <p className="flex items-center gap-2"><Icon name="location" className="h-4 w-4 text-[#00A86B]" />{business.location}</p>
                {business.phone ? <p className="flex items-center gap-2"><Icon name="mail" className="h-4 w-4 text-[#00A86B]" />{business.phone}</p> : null}
                {business.sellerName ? <p className="flex items-center gap-2"><Icon name="user" className="h-4 w-4 text-[#00A86B]" />{business.sellerName}</p> : null}
              </div>
            </div>
          </article>
        )) : (
          <div className="col-span-full rounded-2xl border border-dashed border-cyan-200 bg-white/8 p-8 text-center">
            <p className="text-base font-semibold text-white/65">No businesses found in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
