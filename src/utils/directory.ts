import type { BusinessListing } from "@/types";
import { normalize } from "./string";

export function getDirectoryMatches(category: string, search: string, source: BusinessListing[]) {
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
