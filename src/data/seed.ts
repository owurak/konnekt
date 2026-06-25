import type { DemoStore, UserProfile } from "@/types";
import { avatarUrl, daysAgo, nowIso } from "@/utils/helpers";
import { DEMO_STORE_KEY } from "@/utils/constants";
import { BUSINESS_LISTINGS } from "./listings";

export function createSeedStore(): DemoStore {
  const users: UserProfile[] = [
    {
      id: "admin-demo",
      fullName: "Konnekt Admin",
      professionalTitle: "Platform Operations Lead",
      industry: "Professional Services",
      skills: ["Compliance", "Community", "Moderation", "Analytics"],
      location: "Lagos, Nigeria",
      bio: "Responsible for keeping Konnekt useful, trusted, and safe for African professionals.",
      photoUrl: avatarUrl("Konnekt Admin"),
      email: "admin@konnekt.africa",
      portfolioWebsite: "https://konnekt.africa",
      role: "admin",
      verified: true,
      suspended: false,
      createdAt: daysAgo(90),
    },
    {
      id: "user-amina",
      fullName: "Amina Ndlovu",
      professionalTitle: "Founder and Product Strategist",
      industry: "Technology",
      skills: ["Product Strategy", "Fintech", "Fundraising", "UX Research"],
      location: "Cape Town, South Africa",
      bio: "Building digital finance tools for informal merchants and growth-stage African startups.",
      photoUrl: avatarUrl("Amina Ndlovu"),
      email: "amina@konnekt.africa",
      portfolioWebsite: "https://amina.studio",
      role: "member",
      verified: true,
      suspended: false,
      createdAt: daysAgo(68),
    },
    {
      id: "user-kwame",
      fullName: "Kwame Mensah",
      professionalTitle: "Angel Investor and Growth Advisor",
      industry: "Finance",
      skills: ["Venture Capital", "Go-to-market", "Fintech", "Partnerships"],
      location: "Accra, Ghana",
      bio: "Backing resilient founders solving commerce, payments, and logistics challenges across West Africa.",
      photoUrl: avatarUrl("Kwame Mensah"),
      email: "kwame@konnekt.africa",
      portfolioWebsite: "https://mensahcapital.example",
      role: "member",
      verified: true,
      suspended: false,
      createdAt: daysAgo(53),
    },
    {
      id: "user-fatima",
      fullName: "Fatima Bello",
      professionalTitle: "Recruiter, Climate and Energy",
      industry: "Energy",
      skills: ["Recruiting", "Solar", "Talent Mapping", "Operations"],
      location: "Lagos, Nigeria",
      bio: "Connecting mission-driven technical teams with energy operators and climate founders.",
      photoUrl: avatarUrl("Fatima Bello"),
      email: "fatima@konnekt.africa",
      portfolioWebsite: "",
      role: "member",
      verified: false,
      suspended: false,
      createdAt: daysAgo(35),
    },
    {
      id: "user-chinedu",
      fullName: "Chinedu Okoro",
      professionalTitle: "Full-stack Developer",
      industry: "Technology",
      skills: ["React", "Firebase", "Mobile Apps", "APIs"],
      location: "Remote across Africa",
      bio: "Freelance engineer helping founders move from validated idea to reliable web and mobile products.",
      photoUrl: avatarUrl("Chinedu Okoro"),
      email: "chinedu@konnekt.africa",
      portfolioWebsite: "https://okorodev.example",
      role: "member",
      verified: false,
      suspended: false,
      createdAt: daysAgo(21),
    },
    {
      id: "user-nala",
      fullName: "Nala Wanjiku",
      professionalTitle: "Agribusiness Partnership Manager",
      industry: "Agribusiness",
      skills: ["Supply Chains", "Cooperatives", "Export", "Partnerships"],
      location: "Nairobi, Kenya",
      bio: "Creating market access programs for smallholder farmers, processors, and sustainable buyers.",
      photoUrl: avatarUrl("Nala Wanjiku"),
      email: "nala@konnekt.africa",
      portfolioWebsite: "",
      role: "member",
      verified: true,
      suspended: false,
      createdAt: daysAgo(14),
    },
  ];

  return {
    currentUserId: null,
    accounts: [
      { userId: "admin-demo", email: "admin@konnekt.africa", password: "Admin123!" },
      { userId: "user-amina", email: "amina@konnekt.africa", password: "Konnekt123!" },
    ],
    users,
    connections: [
      {
        id: "connection-amina-kwame",
        senderId: "user-amina",
        receiverId: "user-kwame",
        status: "accepted",
        createdAt: daysAgo(11),
      },
      {
        id: "connection-fatima-amina",
        senderId: "user-fatima",
        receiverId: "user-amina",
        status: "pending",
        createdAt: daysAgo(1),
      },
      {
        id: "connection-amina-chinedu",
        senderId: "user-amina",
        receiverId: "user-chinedu",
        status: "pending",
        createdAt: daysAgo(2),
      },
    ],
    listings: BUSINESS_LISTINGS,
    opportunities: [
      {
        id: "opportunity-fintech-designer",
        title: "Product Designer for Pan-African Fintech",
        description:
          "A seed-stage fintech team is hiring a product designer to lead research, prototyping, and design systems for merchant finance tools.",
        type: "Job",
        industry: "Technology",
        location: "Remote across Africa",
        budget: "$2,500 - $4,000/month",
        deadline: "2026-07-15",
        applyLink: "https://example.com/apply/product-designer",
        posterId: "user-kwame",
        status: "approved",
        createdAt: daysAgo(1),
      },
      {
        id: "opportunity-solar-partner",
        title: "Solar Distribution Partner in Nigeria",
        description:
          "Climate operator looking for a logistics and retail partner to expand solar kits into peri-urban markets.",
        type: "Business",
        industry: "Energy",
        location: "Lagos, Nigeria",
        budget: "Revenue share",
        deadline: "2026-08-01",
        applyLink: "",
        posterId: "user-fatima",
        status: "approved",
        createdAt: daysAgo(3),
      },
      {
        id: "opportunity-agri-export",
        title: "Cocoa Export Collaboration",
        description:
          "Seeking a brand strategist and ecommerce freelancer for a traceable cocoa export pilot with cooperatives in Ghana and Kenya.",
        type: "Collaboration",
        industry: "Agribusiness",
        location: "Accra, Ghana",
        budget: "Project-based",
        deadline: "2026-07-30",
        applyLink: "",
        posterId: "user-nala",
        status: "approved",
        createdAt: daysAgo(5),
      },
      {
        id: "opportunity-market-advisor",
        title: "Market Expansion Advisor",
        description:
          "Pending review: advisory support for an edtech company entering Rwanda and Senegal.",
        type: "Business",
        industry: "Education",
        location: "Kigali, Rwanda",
        budget: "Negotiable",
        deadline: "2026-08-12",
        applyLink: "",
        posterId: "user-amina",
        status: "pending",
        createdAt: daysAgo(0),
      },
    ],
    notifications: [
      {
        id: "notification-request-fatima",
        userId: "user-amina",
        type: "connection_request",
        message: "Fatima Bello wants to connect with you.",
        read: false,
        createdAt: daysAgo(1),
      },
      {
        id: "notification-match-fintech",
        userId: "user-amina",
        type: "opportunity_match",
        message: "New job opportunity may match your fintech and product strategy skills.",
        read: false,
        createdAt: daysAgo(1),
      },
      {
        id: "notification-welcome",
        userId: "user-amina",
        type: "system",
        message: "Welcome to Konnekt. Complete your profile to improve recommendations.",
        read: true,
        createdAt: daysAgo(6),
      },
    ],
    messages: [
      {
        id: "message-1",
        senderId: "user-kwame",
        receiverId: "user-amina",
        body: "Your merchant finance idea looks strong. Are you raising this quarter?",
        createdAt: daysAgo(2),
      },
      {
        id: "message-2",
        senderId: "user-amina",
        receiverId: "user-kwame",
        body: "Yes. I can share our deck and traction summary this week.",
        createdAt: daysAgo(1),
      },
    ],
  };
}

export function loadDemoStore(): DemoStore {
  if (typeof window === "undefined") return createSeedStore();
  const stored = window.localStorage.getItem(DEMO_STORE_KEY);
  if (!stored) return createSeedStore();

  try {
    const parsed = JSON.parse(stored) as DemoStore;
    if (!Array.isArray(parsed.users) || !Array.isArray(parsed.accounts)) return createSeedStore();
    if (!Array.isArray(parsed.listings)) parsed.listings = BUSINESS_LISTINGS;
    return parsed;
  } catch {
    return createSeedStore();
  }
}

export function saveDemoStore(store: DemoStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(store));
}

export function buildFirebaseProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): UserProfile {
  const displayName = user.displayName || user.email?.split("@")[0] || "Konnekt Member";
  return {
    id: user.uid,
    fullName: displayName,
    professionalTitle: "Professional",
    industry: "Professional Services",
    skills: [],
    location: "Remote across Africa",
    bio: "",
    photoUrl: user.photoURL || avatarUrl(displayName),
    email: user.email || "",
    portfolioWebsite: "",
    role: "member",
    verified: false,
    suspended: false,
    createdAt: nowIso(),
  };
}
