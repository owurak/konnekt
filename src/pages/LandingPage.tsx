import { useState } from "react";
import type { BusinessListing, IconName } from "@/types";
import { usePwaInstallPrompt } from "@/hooks/usePwaInstallPrompt";
import { useNavigate } from "react-router-dom";
import { BUSINESS_LISTINGS } from "@/data/listings";
import { BusinessResults, DirectorySection, getDirectoryMatches } from "@/components/BusinessDirectory";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui";

export function LandingPage({ listings }: { listings: BusinessListing[] }) {
  const navigate = useNavigate();
  const pwaInstall = usePwaInstallPrompt();
  const [selectedCategory, setSelectedCategory] = useState("Beauty & Makeup");
  const [directorySearch, setDirectorySearch] = useState("");
  const featuredCategories = [
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

  const moreCategories = [
    {
      title: "Printing Services",
      image: "https://images.pexels.com/photos/5691622/pexels-photo-5691622.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
    },
    {
      title: "Fashion & Clothing",
      image: "https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
    },
    {
      title: "Books & Education",
      image: "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
    },
    {
      title: "Phones & Accessories",
      image: "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
    },
  ];

  const stats = [
    { label: "100+ Businesses", helper: "Listed & growing", icon: "briefcase" as IconName },
    { label: "Active Community", helper: "Consumers & vendors", icon: "network" as IconName },
    { label: "Direct Contact", helper: "Reach businesses easily", icon: "mail" as IconName },
    { label: "Verified Listings", helper: "Trusted businesses", icon: "shield" as IconName },
  ];

  const publicListings = listings.length ? listings : BUSINESS_LISTINGS;
  const visibleBusinesses = getDirectoryMatches(selectedCategory, directorySearch, publicListings);

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    setDirectorySearch("");
    document.getElementById("business-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const runSearch = () => {
    if (!directorySearch.trim() && !selectedCategory) setSelectedCategory("Beauty & Makeup");
    scrollToSection("business-results");
  };

  const handleInstall = async () => {
    if (pwaInstall.canInstall) {
      await pwaInstall.installApp();
      return;
    }
    window.alert("To install Konnekt, open your browser menu and choose Install app or Add to Home screen.");
  };

  return (
    <main className="min-h-screen bg-[#1f1f1f] text-white">
      <section id="home" className="relative overflow-hidden border-b border-[#323232] bg-[#003b1f] px-4 pb-12 pt-9 text-center sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(8,88,45,0.65),transparent_22rem)]" />
        <div className="relative mx-auto max-w-5xl">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-white/32">Business Directory</p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#d9dedb] font-serif text-base font-bold italic text-[#003b1f] shadow-lg">K</div>
            <h1 className="font-serif text-[3.15rem] font-black uppercase leading-none tracking-[-0.03em] text-white drop-shadow sm:text-7xl">KONNEKT</h1>
          </div>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/86 sm:text-lg">Find, connect & do business with local entrepreneurs</p>
          <div className="mt-6 flex justify-center gap-3">
            <button className="rounded-full border border-white/12 bg-[#00361d] px-5 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10" type="button" onClick={() => scrollToSection("categories")}>Find</button>
            <button className="rounded-full border border-white/12 bg-[#00361d] px-5 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10" type="button" onClick={() => navigate("/login")}>Connect</button>
            <button className="rounded-full border border-white/12 bg-[#00361d] px-5 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10" type="button" onClick={() => navigate("/register")}>Grow</button>
          </div>
        </div>
      </section>

      <header className="sticky top-0 z-40 border-b border-[#3a3a3a] bg-[#242424]">
        <div className="mx-auto flex max-w-6xl items-center gap-7 overflow-x-auto px-5 py-4 text-base font-medium text-white/90 sm:justify-center">
          <button className="shrink-0 border-b-4 border-[#008a58] pb-2 text-white" type="button" onClick={() => scrollToSection("home")}>Home</button>
          <button className="shrink-0 pb-2 hover:text-white" type="button" onClick={() => scrollToSection("categories")}>Categories</button>
          <button className="shrink-0 pb-2 hover:text-white" type="button" onClick={() => scrollToSection("about")}>About Us</button>
          <button className="shrink-0 pb-2 hover:text-white" type="button" onClick={() => navigate("/register")}>Register</button>
          <button className="shrink-0 pb-2 hover:text-white" type="button" onClick={() => scrollToSection("contact")}>Contact Us</button>
          <button className="shrink-0 rounded-full bg-[#003b1f] px-4 py-2 text-sm font-bold text-white" type="button" onClick={() => void handleInstall()}>Install</button>
        </div>
      </header>

      <section className="border-b border-[#313131] px-5 py-5">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] gap-3">
          <label className="relative block">
            <Icon name="search" className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-white/42" />
            <input
              className="h-[3.35rem] w-full rounded-xl border border-[#555663] bg-[#2a2a2a] pl-12 pr-4 text-base text-white outline-none placeholder:text-white/42 focus:border-[#008a58] focus:ring-2 focus:ring-[#008a58]/25"
              placeholder="Search business categories..."
              value={directorySearch}
              onChange={(event) => setDirectorySearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") runSearch();
              }}
            />
          </label>
          <button className="h-[3.35rem] rounded-xl bg-[#003b1f] px-6 text-base font-extrabold text-white transition hover:bg-[#00502b]" type="button" onClick={runSearch}>Search</button>
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-6xl px-5 py-10">
        <DirectorySection title="Featured Categories" categories={featuredCategories} selectedCategory={selectedCategory} onSelect={selectCategory} />
        <div className="mt-14">
          <DirectorySection title="More Categories" categories={moreCategories} selectedCategory={selectedCategory} onSelect={selectCategory} />
        </div>
        <div id="business-results" className="mt-12 scroll-mt-24">
          <BusinessResults title={directorySearch ? `Search results for "${directorySearch}"` : selectedCategory} businesses={visibleBusinesses} />
        </div>
      </section>

      <section id="about" className="scroll-mt-24 bg-[#003b1f] py-9">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-8 text-center">
            <h2 className="font-serif text-3xl font-black uppercase text-white">About Us</h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-white/70">
              Konnekt helps customers discover trusted local businesses and helps entrepreneurs, freelancers, SMEs, and professionals build stronger networks across Africa.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <Icon name={stat.icon} className="mx-auto h-8 w-8 text-white/67" />
                <p className="mt-3 text-lg font-extrabold leading-snug text-white sm:text-xl">{stat.label}</p>
                <p className="mt-1 text-base text-white/68">{stat.helper}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">Contact Us</p>
        <h2 className="mt-3 font-serif text-3xl font-black uppercase text-white">List, connect, grow</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/58">
          Want your business listed? Register your Konnekt profile, post opportunities, or contact the platform team at hello@konnekt.africa.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button className="bg-[#003b1f] hover:bg-[#00502b]" size="lg" onClick={() => navigate("/register")}>Register</Button>
          <Button className="border-white/15 bg-white/5 text-white hover:bg-white/10" variant="outline" size="lg" onClick={() => navigate("/login")}>Login</Button>
          <Button className="border-white/15 bg-white/5 text-white hover:bg-white/10" variant="outline" size="lg" onClick={() => void handleInstall()}>Install App</Button>
        </div>
      </section>
    </main>
  );
}
