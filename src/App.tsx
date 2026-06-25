import {
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  setPersistence,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, isFirebaseConfigured, storage } from "./lib/firebase";
import { cn } from "./utils/cn";
import { getErrorMessage } from "./utils/getErrorMessage";
import { sortByDateDesc, sortByDateAsc } from "./utils/sortByDate";
import { firestoreCreate, firestoreUpdate, firestoreDelete } from "./utils/firestoreHelpers";
import { useAsyncAction } from "./hooks/useAsyncAction";
import { usePwaInstallAction } from "./hooks/usePwaInstallAction";
import { FEATURED_CATEGORIES, MORE_CATEGORIES, ALL_CATEGORY_TITLES } from "./data/categories";

type Role = "member" | "admin";
type ConnectionStatus = "pending" | "accepted" | "rejected";
type OpportunityType = "Job" | "Business" | "Collaboration";
type OpportunityStatus = "pending" | "approved";
type NotificationType =
  | "connection_request"
  | "connection_accepted"
  | "opportunity_match"
  | "message"
  | "system";

type UserProfile = {
  id: string;
  fullName: string;
  professionalTitle: string;
  industry: string;
  skills: string[];
  location: string;
  bio: string;
  photoUrl: string;
  email: string;
  portfolioWebsite: string;
  role: Role;
  verified: boolean;
  suspended: boolean;
  createdAt: string;
};

type Connection = {
  id: string;
  senderId: string;
  receiverId: string;
  status: ConnectionStatus;
  createdAt: string;
};

type Opportunity = {
  id: string;
  title: string;
  description: string;
  type: OpportunityType;
  industry?: string;
  location: string;
  budget?: string;
  deadline?: string;
  applyLink: string;
  posterId: string;
  status: OpportunityStatus;
  createdAt: string;
};

type ListingStatus = "pending" | "approved";

type BusinessListing = {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  phone: string;
  website: string;
  verified: boolean;
  price?: string;
  condition?: string;
  imageUrl?: string;
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
  status?: ListingStatus;
  createdAt?: string;
};

type NotificationItem = {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
};

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  body: string;
  createdAt: string;
};

type DemoAccount = {
  userId: string;
  email: string;
  password: string;
};

type DemoStore = {
  accounts: DemoAccount[];
  currentUserId: string | null;
  users: UserProfile[];
  connections: Connection[];
  opportunities: Opportunity[];
  listings: BusinessListing[];
  notifications: NotificationItem[];
  messages: Message[];
};

type LoginValues = {
  email: string;
  password: string;
};

type RegisterValues = {
  fullName: string;
  email: string;
  password: string;
  professionalTitle: string;
  industry: string;
  skills: string;
  location: string;
  bio: string;
  portfolioWebsite: string;
};

type ProfileFormValues = {
  fullName: string;
  professionalTitle: string;
  industry: string;
  skills: string;
  location: string;
  bio: string;
  portfolioWebsite: string;
};

type CreateOpportunityValues = {
  title: string;
  description: string;
  type: OpportunityType;
  industry: string;
  location: string;
  budget: string;
  deadline: string;
  applyLink: string;
};

type CreateListingValues = {
  name: string;
  category: string;
  description: string;
  price: string;
  condition: string;
  location: string;
  phone: string;
  website: string;
  imageUrl: string;
};

type AuthMode = "login" | "register" | "reset";
type SocialProviderName = "google";

type IconName =
  | "admin"
  | "arrow"
  | "bell"
  | "briefcase"
  | "check"
  | "edit"
  | "filter"
  | "home"
  | "link"
  | "location"
  | "logout"
  | "mail"
  | "message"
  | "network"
  | "plus"
  | "search"
  | "settings"
  | "shield"
  | "user"
  | "x";

const HERO_IMAGE_URL =
  "https://images.pexels.com/photos/8555600/pexels-photo-8555600.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";

const DEMO_STORE_KEY = "konnekt.demo.store.v2";
const MAX_PROFILE_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_SOURCE_PROFILE_PHOTO_SIZE_BYTES = 15 * 1024 * 1024;
const PROFILE_PHOTO_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Agribusiness",
  "Creative Economy",
  "Energy",
  "Health",
  "Education",
  "Real Estate",
  "Logistics",
  "Professional Services",
];

const LOCATIONS = [
  "Lagos, Nigeria",
  "Accra, Ghana",
  "Nairobi, Kenya",
  "Kigali, Rwanda",
  "Cape Town, South Africa",
  "Addis Ababa, Ethiopia",
  "Dakar, Senegal",
  "Remote across Africa",
];

const OPPORTUNITY_TYPES: OpportunityType[] = ["Job", "Business", "Collaboration"];

const BUSINESS_LISTINGS: BusinessListing[] = [
  {
    id: "beauty-1",
    name: "Glow Beauty Studio",
    category: "Beauty & Makeup",
    description: "Makeup, brows, bridal styling, and beauty consultations for events and everyday confidence.",
    location: "Accra, Ghana",
    phone: "+233 24 000 1001",
    website: "https://example.com/glow-beauty",
    verified: true,
    price: "From GHS 250",
    condition: "Service",
    imageUrl: "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
    sellerId: "user-amina",
    sellerName: "Amina Ndlovu",
    sellerEmail: "amina@konnekt.africa",
    status: "approved",
    createdAt: daysAgo(12),
  },
  {
    id: "food-1",
    name: "Fresh Basket Market",
    category: "Groceries & Food",
    description: "Fresh groceries, pantry supplies, local produce, and same-day food essentials.",
    location: "Lagos, Nigeria",
    phone: "+234 80 0000 1002",
    website: "https://example.com/fresh-basket",
    verified: true,
    price: "From NGN 5,000",
    condition: "New",
    imageUrl: "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
    sellerId: "user-fatima",
    sellerName: "Fatima Bello",
    sellerEmail: "fatima@konnekt.africa",
    status: "approved",
    createdAt: daysAgo(10),
  },
  {
    id: "electronics-1",
    name: "TechHub Electronics",
    category: "Electronics",
    description: "Phones, laptops, accessories, repairs, and small business technology support.",
    location: "Nairobi, Kenya",
    phone: "+254 70 000 1003",
    website: "https://example.com/techhub",
    verified: false,
    price: "From KES 2,500",
    condition: "New / Used",
    imageUrl: "https://images.pexels.com/photos/1841841/pexels-photo-1841841.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
    sellerId: "user-chinedu",
    sellerName: "Chinedu Okoro",
    sellerEmail: "chinedu@konnekt.africa",
    status: "approved",
    createdAt: daysAgo(8),
  },
  {
    id: "shoes-1",
    name: "StepUp Footwear",
    category: "Shoes & Footwear",
    description: "Retail and custom footwear for professionals, students, events, and everyday wear.",
    location: "Kumasi, Ghana",
    phone: "+233 55 000 1004",
    website: "https://example.com/stepup",
    verified: true,
    price: "From GHS 180",
    condition: "New",
    imageUrl: "https://images.pexels.com/photos/19090/pexels-photo.jpg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
    sellerId: "user-kwame",
    sellerName: "Kwame Mensah",
    sellerEmail: "kwame@konnekt.africa",
    status: "approved",
    createdAt: daysAgo(7),
  },
  {
    id: "printing-1",
    name: "Prime Print Services",
    category: "Printing Services",
    description: "Flyers, banners, packaging labels, business cards, menus, and fast commercial printing.",
    location: "Accra, Ghana",
    phone: "+233 27 000 1005",
    website: "https://example.com/prime-print",
    verified: true,
    price: "Quote on request",
    condition: "Service",
    imageUrl: "https://images.pexels.com/photos/5691622/pexels-photo-5691622.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
    sellerId: "user-amina",
    sellerName: "Amina Ndlovu",
    sellerEmail: "amina@konnekt.africa",
    status: "approved",
    createdAt: daysAgo(6),
  },
  {
    id: "fashion-1",
    name: "Nia Fashion House",
    category: "Fashion & Clothing",
    description: "Ready-to-wear fashion, tailoring, African prints, styling, and boutique collections.",
    location: "Cape Town, South Africa",
    phone: "+27 60 000 1006",
    website: "https://example.com/nia-fashion",
    verified: false,
    price: "From ZAR 450",
    condition: "New",
    imageUrl: "https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
    sellerId: "user-nala",
    sellerName: "Nala Wanjiku",
    sellerEmail: "nala@konnekt.africa",
    status: "approved",
    createdAt: daysAgo(5),
  },
  {
    id: "books-1",
    name: "Bright Pages Bookshop",
    category: "Books & Education",
    description: "Books, school supplies, educational resources, exam prep materials, and learning tools.",
    location: "Kigali, Rwanda",
    phone: "+250 78 000 1007",
    website: "https://example.com/bright-pages",
    verified: true,
    price: "From RWF 8,000",
    condition: "New",
    imageUrl: "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
    sellerId: "user-nala",
    sellerName: "Nala Wanjiku",
    sellerEmail: "nala@konnekt.africa",
    status: "approved",
    createdAt: daysAgo(4),
  },
  {
    id: "phones-1",
    name: "MobileMart Accessories",
    category: "Phones & Accessories",
    description: "Phone accessories, chargers, cases, screen protectors, repairs, and mobile gadgets.",
    location: "Dakar, Senegal",
    phone: "+221 77 000 1008",
    website: "https://example.com/mobilemart",
    verified: true,
    price: "From XOF 7,500",
    condition: "New",
    imageUrl: "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=260&w=520",
    sellerId: "user-chinedu",
    sellerName: "Chinedu Okoro",
    sellerEmail: "chinedu@konnekt.africa",
    status: "approved",
    createdAt: daysAgo(3),
  },
];

function nowIso() {
  return new Date().toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function avatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "Konnekt User"
  )}&background=0B6B3A&color=ffffff&bold=true`;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(iso);
}

function isAuthPath(path: string) {
  return path === "/login" || path === "/register" || path === "/reset";
}

function getAuthMode(path: string): AuthMode | null {
  if (path === "/register") return "register";
  if (path === "/reset") return "reset";
  if (path === "/login") return "login";
  return null;
}

function canViewOpportunity(opportunity: Opportunity, currentUser: UserProfile) {
  return (
    opportunity.status === "approved" ||
    opportunity.posterId === currentUser.id ||
    isAdminUser(currentUser)
  );
}

function isAdminUser(user: Pick<UserProfile, "role"> | null | undefined) {
  return normalize(String(user?.role || "")) === "admin";
}

function getConnectionState(targetId: string, currentUserId: string, connections: Connection[]) {
  const connection = connections.find(
    (item) =>
      item.status !== "rejected" &&
      ((item.senderId === currentUserId && item.receiverId === targetId) ||
        (item.senderId === targetId && item.receiverId === currentUserId))
  );

  if (!connection) return { state: "none" as const, connection: null };
  if (connection.status === "accepted") return { state: "connected" as const, connection };
  if (connection.senderId === currentUserId) return { state: "sent" as const, connection };
  return { state: "received" as const, connection };
}

function getOtherUserId(connection: Connection, currentUserId: string) {
  return connection.senderId === currentUserId ? connection.receiverId : connection.senderId;
}

function getConnectedProfiles(
  currentUserId: string,
  users: UserProfile[],
  connections: Connection[]
) {
  const connectedIds = new Set(
    connections
      .filter(
        (connection) =>
          connection.status === "accepted" &&
          (connection.senderId === currentUserId || connection.receiverId === currentUserId)
      )
      .map((connection) => getOtherUserId(connection, currentUserId))
  );

  return users.filter((user) => connectedIds.has(user.id) && !user.suspended);
}

function getAcceptedConnectionCount(userId: string, connections: Connection[]) {
  return connections.filter(
    (connection) =>
      connection.status === "accepted" &&
      (connection.senderId === userId || connection.receiverId === userId)
  ).length;
}

function mapSnapshot<T extends { id: string }>(snapshot: {
  docs: Array<{ id: string; data: () => unknown }>;
}) {
  return snapshot.docs.map((entry) => ({ ...(entry.data() as Record<string, unknown>), id: entry.id }) as T);
}

function createSeedStore(): DemoStore {
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

function loadDemoStore() {
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

function saveDemoStore(store: DemoStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(store));
}

function getInitialPath() {
  if (typeof window === "undefined") return "/";
  return window.location.pathname;
}

function buildFirebaseProfile(user: {
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

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read selected image."));
    reader.readAsDataURL(file);
  });
}

function validateProfilePhotoFile(file: File, stage: "source" | "upload" = "source") {
  if (!PROFILE_PHOTO_ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("Choose a JPG, PNG, WebP, or GIF image for your profile photo.");
  }

  const maxSize = stage === "source" ? MAX_SOURCE_PROFILE_PHOTO_SIZE_BYTES : MAX_PROFILE_PHOTO_SIZE_BYTES;
  if (file.size > maxSize) {
    throw new Error(
      stage === "source"
        ? "Choose an image that is 15 MB or smaller."
        : "Profile photo must be 5 MB or smaller after optimization."
    );
  }
}

function loadImageElement(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("We could not read that image. Try a JPG, PNG, or WebP file."));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("We could not prepare that image for upload."));
      },
      type,
      quality
    );
  });
}

async function optimizeProfilePhotoFile(file: File) {
  validateProfilePhotoFile(file, "source");

  if (file.type === "image/gif" && file.size <= MAX_PROFILE_PHOTO_SIZE_BYTES) {
    return file;
  }

  if (file.size <= 900 * 1024 && file.type !== "image/png") {
    return file;
  }

  const image = await loadImageElement(file);
  const maxDimension = 1200;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare that image for upload.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const baseName = file.name.replace(/\.[^.]+$/, "") || "profile-photo";
  const qualities = [0.88, 0.8, 0.72, 0.64];
  let latestBlob: Blob | null = null;

  for (const quality of qualities) {
    latestBlob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (latestBlob.size <= MAX_PROFILE_PHOTO_SIZE_BYTES) {
      return new File([latestBlob], `${baseName}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    }
  }

  if (latestBlob) {
    throw new Error("That image is still too large after optimization. Try a smaller photo.");
  }

  return file;
}

function getStorageUploadErrorMessage(uploadError: unknown) {
  const message = uploadError instanceof Error ? uploadError.message : String(uploadError);

  if (message.includes("storage/unauthorized")) {
    return "Firebase Storage blocked this upload. Deploy the latest storage.rules and make sure you are signed in.";
  }
  if (message.includes("storage/bucket-not-found") || message.includes("storage/invalid-url")) {
    return "Firebase Storage is not configured correctly. Check VITE_FIREBASE_STORAGE_BUCKET in your hosting environment.";
  }
  if (message.includes("storage/quota-exceeded")) {
    return "Firebase Storage quota has been exceeded. Check your Firebase project billing or quota.";
  }
  if (message.includes("storage/retry-limit-exceeded") || message.includes("storage/canceled")) {
    return "The upload could not finish. Check your internet connection and try again.";
  }

  return message || "Unable to upload this profile photo. Try a smaller JPG or PNG image.";
}

function shouldUseRedirectSignIn() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

function getSocialAuthErrorMessage(error: unknown, providerName?: SocialProviderName) {
  const message = error instanceof Error ? error.message : String(error);
  const providerLabel = providerName === "google" ? "Google" : "social";

  if (message.includes("auth/popup-closed-by-user")) {
    return "Sign-in was cancelled before it completed.";
  }
  if (message.includes("auth/popup-blocked")) {
    return "Your browser blocked the sign-in popup. Try again, or use email and password.";
  }
  if (message.includes("auth/operation-not-allowed")) {
    return `Enable ${providerLabel} sign-in in Firebase Authentication first.`;
  }
  if (message.includes("auth/unauthorized-domain")) {
    return "Add this domain to Firebase Authentication authorized domains.";
  }
  if (message.includes("auth/account-exists-with-different-credential")) {
    return "An account already exists with this email using another sign-in method. Login with that method first.";
  }

  return message || `${providerLabel} sign-in failed.`;
}

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}



export default function App() {
  const initialDemoStore = useMemo(() => loadDemoStore(), []);
  const [path, setPath] = useState(getInitialPath);
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  const [loadingData, setLoadingData] = useState(isFirebaseConfigured);
  const [runtimeError, setRuntimeError] = useState("");
  const [accounts, setAccounts] = useState<DemoAccount[]>(() =>
    isFirebaseConfigured ? [] : initialDemoStore.accounts
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    isFirebaseConfigured ? null : initialDemoStore.currentUserId
  );
  const [users, setUsers] = useState<UserProfile[]>(() =>
    isFirebaseConfigured ? [] : initialDemoStore.users
  );
  const [connections, setConnections] = useState<Connection[]>(() =>
    isFirebaseConfigured ? [] : initialDemoStore.connections
  );
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() =>
    isFirebaseConfigured ? [] : initialDemoStore.opportunities
  );
  const [listings, setListings] = useState<BusinessListing[]>(() =>
    isFirebaseConfigured ? [] : initialDemoStore.listings
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    isFirebaseConfigured ? [] : initialDemoStore.notifications
  );
  const [messages, setMessages] = useState<Message[]>(() =>
    isFirebaseConfigured ? [] : initialDemoStore.messages
  );

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? null,
    [currentUserId, users]
  );
  const isOnline = useOnlineStatus();

  const unreadNotifications = useMemo(
    () =>
      currentUser
        ? notifications.filter((notification) => notification.userId === currentUser.id && !notification.read)
            .length
        : 0,
    [currentUser, notifications]
  );

  const navigate = (to: string) => {
    if (typeof window === "undefined") return;
    if (window.location.pathname !== to) {
      window.history.pushState({}, "", to);
    }
    setPath(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handlePopState = () => setPath(getInitialPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return undefined;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    setAuthReady(false);

    void (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        const result = await getRedirectResult(auth);
        if (!cancelled && result?.user) {
          setCurrentUserId(result.user.uid);
          navigate("/");
        }
      } catch (redirectError) {
        if (!cancelled) {
          setRuntimeError(getSocialAuthErrorMessage(redirectError));
        }
      }

      if (!cancelled) {
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          setCurrentUserId(firebaseUser ? firebaseUser.uid : null);
          setAuthReady(true);
        });
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const firestore = db;
    if (!firestore || currentUserId) return undefined;

    const unsubscribePublicListings = onSnapshot(
      query(collection(firestore, "listings"), where("status", "==", "approved")),
      (snapshot) => setListings(mapSnapshot<BusinessListing>(snapshot)),
      (error) => setRuntimeError(error.message)
    );

    return () => unsubscribePublicListings();
  }, [currentUserId]);

  useEffect(() => {
    const firestore = db;
    if (!firestore || !currentUserId) {
      if (isFirebaseConfigured) {
        setLoadingData(false);
      }
      return undefined;
    }

    setLoadingData(true);
    const handleSnapshotError = (error: Error) => {
      setRuntimeError(error.message);
      setLoadingData(false);
    };

    const unsubscribeUsers = onSnapshot(
      collection(firestore, "users"),
      (snapshot) => {
        const nextUsers = mapSnapshot<UserProfile>(snapshot);
        setUsers(nextUsers);
        if (auth?.currentUser && !nextUsers.some((user) => user.id === currentUserId)) {
          void setDoc(doc(firestore, "users", currentUserId), buildFirebaseProfile(auth.currentUser), {
            merge: true,
          });
        }
        setLoadingData(false);
      },
      handleSnapshotError
    );

    let sentConnections: Connection[] = [];
    let receivedConnections: Connection[] = [];
    const syncConnections = () => {
      const unique = new Map<string, Connection>();
      [...sentConnections, ...receivedConnections].forEach((connection) => {
        unique.set(connection.id, connection);
      });
      setConnections(Array.from(unique.values()));
    };

    const unsubscribeSentConnections = onSnapshot(
      query(collection(firestore, "connections"), where("senderId", "==", currentUserId)),
      (snapshot) => {
        sentConnections = mapSnapshot<Connection>(snapshot);
        syncConnections();
      },
      handleSnapshotError
    );
    const unsubscribeReceivedConnections = onSnapshot(
      query(collection(firestore, "connections"), where("receiverId", "==", currentUserId)),
      (snapshot) => {
        receivedConnections = mapSnapshot<Connection>(snapshot);
        syncConnections();
      },
      handleSnapshotError
    );
    const unsubscribeOpportunities = onSnapshot(
      collection(firestore, "opportunities"),
      (snapshot) => setOpportunities(mapSnapshot<Opportunity>(snapshot)),
      handleSnapshotError
    );
    const unsubscribeListings = onSnapshot(
      collection(firestore, "listings"),
      (snapshot) => setListings(mapSnapshot<BusinessListing>(snapshot)),
      handleSnapshotError
    );
    const unsubscribeNotifications = onSnapshot(
      query(collection(firestore, "notifications"), where("userId", "==", currentUserId)),
      (snapshot) => setNotifications(mapSnapshot<NotificationItem>(snapshot)),
      handleSnapshotError
    );

    let sentMessages: Message[] = [];
    let receivedMessages: Message[] = [];
    const syncMessages = () => {
      const unique = new Map<string, Message>();
      [...sentMessages, ...receivedMessages].forEach((message) => {
        unique.set(message.id, message);
      });
      setMessages(Array.from(unique.values()));
    };

    const unsubscribeSentMessages = onSnapshot(
      query(collection(firestore, "messages"), where("senderId", "==", currentUserId)),
      (snapshot) => {
        sentMessages = mapSnapshot<Message>(snapshot);
        syncMessages();
      },
      handleSnapshotError
    );
    const unsubscribeReceivedMessages = onSnapshot(
      query(collection(firestore, "messages"), where("receiverId", "==", currentUserId)),
      (snapshot) => {
        receivedMessages = mapSnapshot<Message>(snapshot);
        syncMessages();
      },
      handleSnapshotError
    );

    return () => {
      unsubscribeUsers();
      unsubscribeSentConnections();
      unsubscribeReceivedConnections();
      unsubscribeOpportunities();
      unsubscribeListings();
      unsubscribeNotifications();
      unsubscribeSentMessages();
      unsubscribeReceivedMessages();
    };
  }, [currentUserId]);

  useEffect(() => {
    if (isFirebaseConfigured) return;
    saveDemoStore({
      accounts,
      currentUserId,
      users,
      connections,
      opportunities,
      listings,
      notifications,
      messages,
    });
  }, [accounts, currentUserId, users, connections, opportunities, listings, notifications, messages]);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUserId && path !== "/" && !isAuthPath(path)) {
      navigate("/");
    }
    if (currentUserId && isAuthPath(path)) {
      navigate("/");
    }
  }, [authReady, currentUserId, path]);

  const handleLogin = async (values: LoginValues) => {
    setRuntimeError("");
    if (auth) {
      await setPersistence(auth, browserLocalPersistence);
      const credential = await signInWithEmailAndPassword(auth, values.email, values.password);
      setCurrentUserId(credential.user.uid);
      navigate("/");
      return;
    }

    const account = accounts.find(
      (item) => item.email.toLowerCase() === values.email.trim().toLowerCase()
    );
    if (!account || account.password !== values.password) {
      throw new Error("Invalid email or password.");
    }
    const profile = users.find((user) => user.id === account.userId);
    if (!profile) throw new Error("This account no longer has a profile.");
    if (profile.suspended) throw new Error("This account is suspended. Contact an administrator.");
    setCurrentUserId(account.userId);
    navigate("/");
  };

 const handleSocialLogin = async (providerName: SocialProviderName) => {
  setRuntimeError("");
  if (!auth) {
    throw new Error("Social sign-in is available only when Firebase is connected.");
  }

  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    await setPersistence(auth, browserLocalPersistence);
    const credential = await signInWithPopup(auth, provider);
    setCurrentUserId(credential.user.uid);
    navigate("/");
  } catch (socialError) {
    const message = getErrorMessage(socialError, "");
    if (shouldUseRedirectSignIn() && message.includes("auth/popup-blocked")) {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw new Error(getSocialAuthErrorMessage(socialError, providerName));
  }
};

  const handleDemoLogin = async (kind: "member" | "admin") => {
    if (isFirebaseConfigured) {
      throw new Error("Demo login is only available when Firebase environment variables are not set.");
    }
    await handleLogin({
      email: kind === "admin" ? "admin@konnekt.africa" : "amina@konnekt.africa",
      password: kind === "admin" ? "Admin123!" : "Konnekt123!",
    });
  };

  const handleRegister = async (values: RegisterValues) => {
    setRuntimeError("");
    if (!values.fullName.trim()) throw new Error("Full name is required.");
    if (values.password.length < 8) throw new Error("Use at least 8 characters for your password.");

    const profileName = values.fullName.trim();
    const cleanEmail = values.email.trim().toLowerCase();
    const newProfile: UserProfile = {
      id: newId("user"),
      fullName: profileName,
      professionalTitle: values.professionalTitle.trim() || "Professional",
      industry: values.industry || "Professional Services",
      skills: splitTags(values.skills),
      location: values.location || "Remote across Africa",
      bio: values.bio.trim(),
      photoUrl: avatarUrl(profileName),
      email: cleanEmail,
      portfolioWebsite: values.portfolioWebsite.trim(),
      role: "member",
      verified: false,
      suspended: false,
      createdAt: nowIso(),
    };

    if (auth && db) {
      await setPersistence(auth, browserLocalPersistence);
      const credential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseProfile = {
        ...newProfile,
        id: credential.user.uid,
        role: "member",
        verified: false,
      } satisfies UserProfile;
      await setDoc(doc(db, "users", credential.user.uid), firebaseProfile);
      setCurrentUserId(credential.user.uid);
      navigate("/");
      return;
    }

    const emailExists = accounts.some(
      (account) => account.email.toLowerCase() === values.email.trim().toLowerCase()
    );
    if (emailExists) throw new Error("An account with this email already exists.");

    setAccounts((previous) => [
      ...previous,
      { userId: newProfile.id, email: newProfile.email, password: values.password },
    ]);
    setUsers((previous) => [newProfile, ...previous]);
    setCurrentUserId(newProfile.id);
    navigate("/");
  };

  const handlePasswordReset = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error("Enter your email address.");
    if (auth) {
      await sendPasswordResetEmail(auth, cleanEmail);
      return;
    }
    const exists = accounts.some((account) => account.email.toLowerCase() === cleanEmail);
    if (!exists) throw new Error("No demo account was found for that email.");
  };

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    setCurrentUserId(null);
    navigate("/login");
  };

  const saveUserProfile = async (userId: string, patch: Partial<UserProfile>) => {
    await firestoreUpdate(db, "users", userId, patch, setUsers);
  };

  const createNotification = async (
    userId: string,
    type: NotificationType,
    message: string
  ) => {
    const notification: NotificationItem = {
      id: newId("notification"),
      userId,
      type,
      message,
      read: false,
      createdAt: nowIso(),
    };
    await firestoreCreate(db, "notifications", notification, setNotifications);
  };

  const markNotificationRead = async (notificationId: string) => {
    await firestoreUpdate(db, "notifications", notificationId, { read: true }, setNotifications);
  };

  const markAllNotificationsRead = async () => {
    if (!currentUser) return;
    const unread = notifications.filter(
      (notification) => notification.userId === currentUser.id && !notification.read
    );
    await Promise.all(unread.map((notification) => markNotificationRead(notification.id)));
  };

  const upsertConnection = async (connection: Connection) => {
    if (db) {
      await setDoc(doc(db, "connections", connection.id), connection);
      return;
    }
    setConnections((previous) => {
      const exists = previous.some((item) => item.id === connection.id);
      return exists
        ? previous.map((item) => (item.id === connection.id ? connection : item))
        : [connection, ...previous];
    });
  };

  const updateConnection = async (connectionId: string, patch: Partial<Connection>) => {
    await firestoreUpdate(db, "connections", connectionId, patch, setConnections);
  };

  const handleSendConnection = async (receiverId: string) => {
    if (!currentUser) throw new Error("Sign in to connect with professionals.");
    const receiver = users.find((user) => user.id === receiverId && !user.suspended);
    if (!receiver) throw new Error("This profile is not available.");

    const existing = connections.find(
      (connection) =>
        (connection.senderId === currentUser.id && connection.receiverId === receiverId) ||
        (connection.senderId === receiverId && connection.receiverId === currentUser.id)
    );

    if (existing?.status === "accepted" || existing?.status === "pending") return;

    const connection: Connection = {
      id: existing?.id || newId("connection"),
      senderId: currentUser.id,
      receiverId,
      status: "pending",
      createdAt: nowIso(),
    };
    await upsertConnection(connection);
    await createNotification(receiverId, "connection_request", `${currentUser.fullName} wants to connect with you.`);
  };

  const handleRespondConnection = async (
    connectionId: string,
    nextStatus: "accepted" | "rejected"
  ) => {
    if (!currentUser) return;
    const connection = connections.find((item) => item.id === connectionId);
    if (!connection || connection.receiverId !== currentUser.id) return;
    await updateConnection(connectionId, { status: nextStatus });
    if (nextStatus === "accepted") {
      await createNotification(
        connection.senderId,
        "connection_accepted",
        `${currentUser.fullName} accepted your connection request.`
      );
    }
  };

  const notifyOpportunityMatches = async (opportunity: Opportunity) => {
    const title = normalize(opportunity.title);
    const description = normalize(opportunity.description);
    const matches = users.filter((user) => {
      if (user.id === opportunity.posterId || user.suspended) return false;
      const industryMatch =
        user.industry && (title.includes(normalize(user.industry)) || description.includes(normalize(user.industry)));
      const skillMatch = user.skills.some((skill) => title.includes(normalize(skill)) || description.includes(normalize(skill)));
      const locationMatch = normalize(user.location) === normalize(opportunity.location);
      return industryMatch || skillMatch || locationMatch;
    });

    await Promise.all(
      matches.slice(0, 10).map((user) =>
        createNotification(
          user.id,
          "opportunity_match",
          `New ${opportunity.type.toLowerCase()} opportunity may match your profile: ${opportunity.title}.`
        )
      )
    );
  };

  const createOpportunity = async (values: CreateOpportunityValues) => {
    if (!currentUser) throw new Error("Sign in to post opportunities.");
    const opportunity: Opportunity = {
      id: newId("opportunity"),
      title: values.title.trim(),
      description: values.description.trim(),
      type: values.type,
      industry: values.industry.trim() || "Professional Services",
      location: values.location.trim() || "Remote across Africa",
      budget: values.budget.trim(),
      deadline: values.deadline,
      applyLink: values.applyLink.trim(),
      posterId: currentUser.id,
      status: "pending",
      createdAt: nowIso(),
    };

    if (!opportunity.title || !opportunity.description) {
      throw new Error("Add a title and description before posting.");
    }

    await firestoreCreate(db, "opportunities", opportunity, setOpportunities);

    // Keep every new post pending first. Admins approve from the Admin panel.
  };

  const updateOpportunity = async (opportunityId: string, patch: Partial<Opportunity>) => {
    await firestoreUpdate(db, "opportunities", opportunityId, patch, setOpportunities);
  };

  const approveOpportunity = async (opportunityId: string) => {
    const opportunity = opportunities.find((item) => item.id === opportunityId);
    if (!opportunity) return;
    await updateOpportunity(opportunityId, { status: "approved" });
    try {
      await notifyOpportunityMatches({ ...opportunity, status: "approved" });
    } catch (notificationError) {
      const msg = getErrorMessage(notificationError, "");
      setRuntimeError(
        msg
          ? `Opportunity approved, but match notifications failed: ${msg}`
          : "Opportunity approved, but match notifications failed."
      );
    }
  };

  const deleteOpportunity = async (opportunityId: string) => {
    await firestoreDelete(db, "opportunities", opportunityId, setOpportunities);
  };

  const createListing = async (values: CreateListingValues) => {
    if (!currentUser) throw new Error("Sign in before posting a listing.");
    const listing: BusinessListing = {
      id: newId("listing"),
      name: values.name.trim(),
      category: values.category,
      description: values.description.trim(),
      price: values.price.trim(),
      condition: values.condition,
      location: values.location.trim() || currentUser.location || "Remote across Africa",
      phone: values.phone.trim(),
      website: values.website.trim(),
      imageUrl: values.imageUrl.trim(),
      verified: currentUser.verified,
      sellerId: currentUser.id,
      sellerName: currentUser.fullName,
      sellerEmail: currentUser.email,
      status: isAdminUser(currentUser) ? "approved" : "pending",
      createdAt: nowIso(),
    };

    if (!listing.name || !listing.description || !listing.category) {
      throw new Error("Add a title, category, and description before posting.");
    }

    await firestoreCreate(db, "listings", listing, setListings);
  };

  const updateListing = async (listingId: string, patch: Partial<BusinessListing>) => {
    await firestoreUpdate(db, "listings", listingId, patch, setListings);
  };

  const approveListing = async (listingId: string) => {
    await updateListing(listingId, { status: "approved" });
  };

  const deleteListing = async (listingId: string) => {
    await firestoreDelete(db, "listings", listingId, setListings);
  };

  const uploadProfilePhoto = async (file: File) => {
    if (!currentUser) throw new Error("Sign in before uploading a photo.");
    const uploadFile = await optimizeProfilePhotoFile(file);
    validateProfilePhotoFile(uploadFile, "upload");
    if (storage) {
      const safeName = uploadFile.name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
      const imageRef = ref(storage, `profile-photos/${currentUser.id}/${Date.now()}-${safeName}`);
      try {
        await uploadBytes(imageRef, uploadFile, {
          cacheControl: "public,max-age=31536000",
          contentType: uploadFile.type || "image/jpeg",
        });
        return getDownloadURL(imageRef);
      } catch (uploadError) {
        throw new Error(getStorageUploadErrorMessage(uploadError));
      }
    }
    if (isFirebaseConfigured) {
      throw new Error("Profile photo uploads are disabled until Firebase Storage is enabled.");
    }
    return fileToDataUrl(uploadFile);
  };

  const sendMessage = async (receiverId: string, body: string) => {
    if (!currentUser) throw new Error("Sign in to send messages.");
    const state = getConnectionState(receiverId, currentUser.id, connections);
    if (state.state !== "connected") throw new Error("You can message accepted connections only.");

    const message: Message = {
      id: newId("message"),
      senderId: currentUser.id,
      receiverId,
      body: body.trim(),
      createdAt: nowIso(),
    };
    if (!message.body) throw new Error("Write a message first.");

    await firestoreCreate(db, "messages", message, setMessages);
    await createNotification(receiverId, "message", `${currentUser.fullName} sent you a message.`);
  };

  const seedDemoData = async () => {
    const seed = createSeedStore();
    const firestore = db;
    if (firestore) {
      const batch = writeBatch(firestore);
      const seedUsers = currentUser
        ? [currentUser, ...seed.users.filter((user) => user.id !== currentUser.id)]
        : seed.users;
      seedUsers.forEach((user) => batch.set(doc(firestore, "users", user.id), user));
      seed.connections.forEach((connection) =>
        batch.set(doc(firestore, "connections", connection.id), connection)
      );
      seed.opportunities.forEach((opportunity) =>
        batch.set(doc(firestore, "opportunities", opportunity.id), opportunity)
      );
      seed.listings.forEach((listing) =>
        batch.set(doc(firestore, "listings", listing.id), listing)
      );
      seed.notifications.forEach((notification) =>
        batch.set(doc(firestore, "notifications", notification.id), notification)
      );
      seed.messages.forEach((message) => batch.set(doc(firestore, "messages", message.id), message));
      await batch.commit();
      return;
    }

    setAccounts(seed.accounts);
    const preservedUserId = currentUser?.id;
    setCurrentUserId(
      preservedUserId && seed.users.some((user) => user.id === preservedUserId)
        ? preservedUserId
        : "admin-demo"
    );
    setUsers(seed.users);
    setConnections(seed.connections);
    setOpportunities(seed.opportunities);
    setListings(seed.listings);
    setNotifications(seed.notifications);
    setMessages(seed.messages);
  };

  if (!isOnline) {
    return <OfflineScreen />;
  }

  if (!authReady) {
    return <FullScreenLoader label="Loading Konnekt" />;
  }

  const authMode = getAuthMode(path);
  if (!currentUserId) {
    if (authMode) {
      return (
        <AuthPage
          mode={authMode}
          firebaseEnabled={isFirebaseConfigured}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onReset={handlePasswordReset}
          onSocialLogin={handleSocialLogin}
          onDemoLogin={handleDemoLogin}
          navigate={navigate}
        />
      );
    }

    return <LandingPage navigate={navigate} listings={listings} />;
  }

  if (authMode) {
    return <FullScreenLoader label="Opening your Konnekt workspace" />;
  }

  if (loadingData && !currentUser) {
    return <FullScreenLoader label="Preparing your professional network" />;
  }

  if (!currentUser) {
    return <FullScreenLoader label="Preparing your profile" />;
  }

  if (currentUser.suspended) {
    return <SuspendedScreen onLogout={handleLogout} />;
  }

  const pageSegments = path.split("/").filter(Boolean);
  const page = (() => {
    if (path === "/") {
      return (
        <DashboardPage
          currentUser={currentUser}
          users={users}
          connections={connections}
          opportunities={opportunities}
          listings={listings}
          notifications={notifications}
          loading={loadingData}
          navigate={navigate}
          onConnect={handleSendConnection}
          onRespondConnection={handleRespondConnection}
          onMarkNotificationRead={markNotificationRead}
          onCreateListing={createListing}
        />
      );
    }

    if (path === "/network") {
      return (
        <NetworkPage
          currentUser={currentUser}
          users={users}
          connections={connections}
          navigate={navigate}
          onConnect={handleSendConnection}
          onRespondConnection={handleRespondConnection}
        />
      );
    }

    if (path === "/opportunities") {
      return (
        <OpportunitiesPage
          currentUser={currentUser}
          users={users}
          opportunities={opportunities}
          navigate={navigate}
          onCreateOpportunity={createOpportunity}
          onDeleteOpportunity={deleteOpportunity}
        />
      );
    }

    if (pageSegments[0] === "opportunity" && pageSegments[1]) {
      return (
        <OpportunityDetailsPage
          opportunityId={pageSegments[1]}
          currentUser={currentUser}
          users={users}
          opportunities={opportunities}
          navigate={navigate}
        />
      );
    }

    if (pageSegments[0] === "profile") {
      const profileId = pageSegments[1] || currentUser.id;
      const profile = users.find((user) => user.id === profileId && !user.suspended) ?? null;
      return (
        <ProfilePage
          profile={profile}
          currentUser={currentUser}
          connections={connections}
          opportunities={opportunities}
          navigate={navigate}
          onSaveProfile={saveUserProfile}
          onUploadPhoto={uploadProfilePhoto}
          profilePhotoUploadAvailable={
            !isFirebaseConfigured ||
            (Boolean(storage) && import.meta.env.VITE_ENABLE_FIREBASE_STORAGE === "true")
          }
          onConnect={handleSendConnection}
          onRespondConnection={handleRespondConnection}
        />
      );
    }

    if (path === "/notifications") {
      return (
        <NotificationsPage
          currentUser={currentUser}
          notifications={notifications}
          onMarkRead={markNotificationRead}
          onMarkAllRead={markAllNotificationsRead}
        />
      );
    }

    if (pageSegments[0] === "messages") {
      return (
        <MessagesPage
          currentUser={currentUser}
          users={users}
          connections={connections}
          messages={messages}
          routeContactId={pageSegments[1]}
          navigate={navigate}
          onSendMessage={sendMessage}
        />
      );
    }

    if (path === "/settings") {
      return (
        <SettingsPage
          currentUser={currentUser}
          firebaseEnabled={isFirebaseConfigured}
          storageEnabled={Boolean(storage) && import.meta.env.VITE_ENABLE_FIREBASE_STORAGE === "true"}
          navigate={navigate}
          onLogout={handleLogout}
        />
      );
    }

    if (path === "/admin") {
      if (!isAdminUser(currentUser)) return <AccessDenied currentUser={currentUser} />;
      return (
        <AdminPage
          currentUser={currentUser}
          users={users}
          connections={connections}
          opportunities={opportunities}
          listings={listings}
          messages={messages}
          notifications={notifications}
          onSaveUser={saveUserProfile}
          onApproveOpportunity={approveOpportunity}
          onDeleteOpportunity={deleteOpportunity}
          onApproveListing={approveListing}
          onDeleteListing={deleteListing}
          onSeedDemoData={seedDemoData}
        />
      );
    }

    return <NotFound navigate={navigate} />;
  })();

  return (
    <AppShell
      currentUser={currentUser}
      path={path}
      unreadNotifications={unreadNotifications}
      navigate={navigate}
      onLogout={handleLogout}
    >
      {runtimeError ? (
        <div className="mb-4 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span>{runtimeError}</span>
            <button className="font-semibold" type="button" onClick={() => setRuntimeError("")}>Dismiss</button>
          </div>
        </div>
      ) : null}
      {page}
    </AppShell>
  );
}

function Spinner({ label = "Loading", size = "md" }: { label?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
          size === "sm" && "h-3.5 w-3.5",
          size === "md" && "h-5 w-5",
          size === "lg" && "h-8 w-8"
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAF9] p-6">
      <div className="animate-rise text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0B6B3A] text-white shadow-xl shadow-emerald-900/10">
          <Spinner size="lg" label={label} />
        </div>
        <p className="font-heading text-lg font-semibold text-[#142019]">{label}</p>
        <p className="mt-2 text-sm text-slate-500">Connecting opportunities. Building success.</p>
      </div>
    </div>
  );
}

function OfflineScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAF9] p-6 text-[#142019]">
      <Panel className="max-w-xl text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0B6B3A]/10 text-[#0B6B3A]">
          <Icon name="link" className="h-8 w-8" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Connection required</p>
        <h1 className="mt-3 font-heading text-3xl font-bold">Konnekt is offline</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          This is a live networking platform, so profiles, messages, uploads, and opportunities need an internet connection.
        </p>
        <Button className="mt-6" type="button" onClick={() => window.location.reload()}>
          Retry connection
        </Button>
      </Panel>
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#0B6B3A]/15",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-[#0B6B3A] text-white shadow-lg shadow-emerald-900/10 hover:bg-[#095a31]",
        variant === "secondary" && "bg-[#D4AF37] text-[#241c06] hover:bg-[#c8a32f]",
        variant === "outline" && "border border-slate-200 bg-white text-[#142019] hover:border-[#0B6B3A]/40 hover:text-[#0B6B3A]",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100 hover:text-[#0B6B3A]",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        variant === "success" && "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
        size === "sm" && "px-3 py-2 text-xs",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-5 py-3 text-base",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size="sm" label="Working" /> : null}
      {children}
    </button>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helper?: string;
};

function Field({ label, helper, className, ...props }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        className={cn(
          "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#142019] outline-none transition focus:border-[#0B6B3A] focus:ring-4 focus:ring-[#0B6B3A]/10",
          className
        )}
        {...props}
      />
      {helper ? <span className="block text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}

type PasswordFieldProps = Omit<FieldProps, "type">;

function PasswordField({ label, helper, className, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="relative block">
        <input
          className={cn(
            "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-24 text-sm text-[#142019] outline-none transition focus:border-[#0B6B3A] focus:ring-4 focus:ring-[#0B6B3A]/10",
            className
          )}
          type={visible ? "text" : "password"}
          {...props}
        />
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0B6B3A] transition hover:bg-[#0B6B3A]/10"
          type="button"
          onClick={() => setVisible((previous) => !previous)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </span>
      {helper ? <span className="block text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  helper?: string;
};

function TextareaField({ label, helper, className, ...props }: TextareaFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        className={cn(
          "min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#142019] outline-none transition focus:border-[#0B6B3A] focus:ring-4 focus:ring-[#0B6B3A]/10",
          className
        )}
        {...props}
      />
      {helper ? <span className="block text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
};

function SelectField({ label, children, className, ...props }: SelectFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        className={cn(
          "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#142019] outline-none transition focus:border-[#0B6B3A] focus:ring-4 focus:ring-[#0B6B3A]/10",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70 ring-1 ring-slate-200/70", className)}>
      {children}
    </section>
  );
}

function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "primary" | "gold" | "green" | "red";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "neutral" && "bg-slate-100 text-slate-600",
        tone === "primary" && "bg-[#0B6B3A]/10 text-[#0B6B3A]",
        tone === "gold" && "bg-[#D4AF37]/20 text-[#7b6112]",
        tone === "green" && "bg-emerald-100 text-emerald-700",
        tone === "red" && "bg-red-100 text-red-700",
        className
      )}
    >
      {children}
    </span>
  );
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return (parts.map((part) => part[0]).join("") || "K").toUpperCase();
}

function Avatar({
  user,
  size = "md",
  className,
}: {
  user: Pick<UserProfile, "fullName" | "photoUrl">;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const generatedAvatar = !user.photoUrl || user.photoUrl.includes("ui-avatars.com");
  const sizeClasses = cn(
    size === "sm" && "h-9 w-9 text-xs",
    size === "md" && "h-12 w-12 text-sm",
    size === "lg" && "h-16 w-16 text-lg",
    size === "xl" && "h-24 w-24 text-2xl"
  );

  if (generatedAvatar) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B6B3A] to-[#13965a] font-heading font-bold text-white shadow-sm ring-2 ring-white",
          sizeClasses,
          className
        )}
        aria-label={`${user.fullName} profile initials`}
        title={user.fullName}
      >
        {getInitials(user.fullName)}
      </div>
    );
  }

  return (
    <img
      className={cn(
        "shrink-0 rounded-full object-cover ring-2 ring-white",
        sizeClasses,
        className
      )}
      src={user.photoUrl}
      alt={`${user.fullName} profile`}
    />
  );
}

function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = "h-5 w-5";
  const props = {
    className: cn(common, className),
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return <svg {...props}><path d="m3 10 9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>;
    case "network":
      return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case "briefcase":
      return <svg {...props}><path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" /><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 12h18" /><path d="M12 12v2" /></svg>;
    case "user":
      return <svg {...props}><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>;
    case "bell":
      return <svg {...props}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
    case "message":
      return <svg {...props}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /></svg>;
    case "admin":
    case "shield":
      return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>;
    case "logout":
      return <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>;
    case "search":
      return <svg {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
    case "settings":
      return <svg {...props}><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.35.5.65.86.86.32.19.7.3 1.09.3H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15" /></svg>;
    case "plus":
      return <svg {...props}><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
    case "check":
      return <svg {...props}><path d="m20 6-11 11-5-5" /></svg>;
    case "x":
      return <svg {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
    case "location":
      return <svg {...props}><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>;
    case "edit":
      return <svg {...props}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;
    case "mail":
      return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
    case "link":
      return <svg {...props}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>;
    case "filter":
      return <svg {...props}><path d="M22 3H2l8 9.46V19l4 2v-8.54Z" /></svg>;
    case "arrow":
      return <svg {...props}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>;
    default:
      return null;
  }
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
      <svg className="mx-auto mb-4 h-28 w-28 text-[#0B6B3A]/70" viewBox="0 0 160 120" fill="none" aria-hidden="true">
        <rect x="30" y="28" width="100" height="64" rx="18" fill="currentColor" opacity="0.12" />
        <circle cx="63" cy="60" r="14" fill="currentColor" opacity="0.22" />
        <path d="M43 88c8-16 32-16 40 0" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <path d="M94 52h26M94 68h18" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <path d="M27 42c-10 7-13 19-7 30" stroke="#D4AF37" strokeWidth="5" strokeLinecap="round" />
        <path d="M133 78c10-7 13-19 7-30" stroke="#D4AF37" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <h3 className="font-heading text-lg font-semibold text-[#142019]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded-2xl", className)} />;
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr]">
      <div className="space-y-5">
        <SkeletonBlock className="h-44" />
        <SkeletonBlock className="h-80" />
      </div>
      <div className="space-y-5">
        <SkeletonBlock className="h-64" />
        <SkeletonBlock className="h-48" />
      </div>
    </div>
  );
}

function LandingPage({ navigate, listings }: { navigate: (to: string) => void; listings: BusinessListing[] }) {
  const pwaInstall = usePwaInstallAction();
  const [selectedCategory, setSelectedCategory] = useState("Beauty & Makeup");
  const [directorySearch, setDirectorySearch] = useState("");

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

  const handleInstall = () => void pwaInstall.triggerInstall();

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
          <button className="shrink-0 rounded-full bg-[#003b1f] px-4 py-2 text-sm font-bold text-white" type="button" onClick={handleInstall}>Install</button>
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
        <DirectorySection title="Featured Categories" categories={FEATURED_CATEGORIES} selectedCategory={selectedCategory} onSelect={selectCategory} />
        <div className="mt-14">
          <DirectorySection title="More Categories" categories={MORE_CATEGORIES} selectedCategory={selectedCategory} onSelect={selectCategory} />
        </div>
        <div id="business-results" className="mt-12 scroll-mt-24">
          <BusinessResults title={directorySearch ? `Search results for “${directorySearch}”` : selectedCategory} businesses={visibleBusinesses} />
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
          <Button className="border-white/15 bg-white/5 text-white hover:bg-white/10" variant="outline" size="lg" onClick={handleInstall}>Install App</Button>
        </div>
      </section>
    </main>
  );
}

function getDirectoryMatches(category: string, search: string, source: BusinessListing[] = BUSINESS_LISTINGS) {
  const q = normalize(search);
  const filtered = source
    .filter((business) => (business.status || "approved") === "approved" || business.status === "pending")
    .filter((business) => {
      const matchesCategory = !category || business.category === category;
      const matchesSearch =
        !q ||
        [business.name, business.category, business.description, business.location, business.sellerName, business.price]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return matchesSearch && (q ? true : matchesCategory);
    });
  return filtered.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime());
}

function DirectorySection({
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
      <h2 className="font-serif text-[2rem] font-black uppercase leading-none tracking-[-0.02em] text-white sm:text-4xl">{title}</h2>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
        {categories.map((category) => (
          <button
            key={category.title}
            className={cn(
              "group overflow-hidden rounded-xl bg-[#202020] text-left shadow-lg shadow-black/10 ring-1 ring-white/[0.03] transition hover:-translate-y-0.5 hover:ring-[#008a58]/60",
              selectedCategory === category.title && "ring-2 ring-[#008a58]"
            )}
            type="button"
            onClick={() => onSelect(category.title)}
          >
            <div className="relative h-[9.55rem] overflow-hidden sm:h-48">
              <img className="h-full w-full object-cover opacity-72 transition duration-300 group-hover:scale-105 group-hover:opacity-90" src={category.image} alt={category.title} />
              <div className="absolute inset-0 bg-black/18" />
            </div>
            <p className="px-2 py-3 text-center text-[1.35rem] font-normal leading-tight text-white sm:text-2xl">{category.title}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function BusinessResults({ title, businesses }: { title: string; businesses: BusinessListing[] }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-serif text-3xl font-black uppercase text-white">{title || "Listings"}</h2>
        <span className="rounded-full bg-[#003b1f] px-3 py-1 text-xs font-bold text-white">{businesses.length} found</span>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {businesses.length ? businesses.map((business) => (
          <article key={business.id} className="overflow-hidden rounded-2xl bg-[#242424] ring-1 ring-white/10">
            <div className="relative h-44 bg-[#1b1b1b]">
              {business.imageUrl ? (
                <img className="h-full w-full object-cover opacity-85" src={business.imageUrl} alt={business.name} />
              ) : (
                <div className="flex h-full items-center justify-center bg-[#003b1f] text-center font-serif text-2xl font-black uppercase text-white/70">
                  {business.category}
                </div>
              )}
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                {business.verified ? <Badge tone="green">Verified</Badge> : <Badge>New seller</Badge>}
                {business.status === "pending" ? <Badge tone="red">Pending approval</Badge> : null}
              </div>
              {business.price ? (
                <div className="absolute bottom-3 left-3 rounded-full bg-[#D4AF37] px-3 py-1 text-sm font-extrabold text-[#241c06]">
                  {business.price}
                </div>
              ) : null}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-lg font-bold text-white">{business.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#D4AF37]">{business.category}</p>
                </div>
                {business.condition ? <Badge tone="primary">{business.condition}</Badge> : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-white/65">{business.description}</p>
              <div className="mt-4 grid gap-2 text-sm text-white/60">
                <span className="flex items-center gap-2"><Icon name="location" className="h-4 w-4 text-[#008a58]" />{business.location}</span>
                <span className="flex items-center gap-2"><Icon name="user" className="h-4 w-4 text-[#008a58]" />Seller: {business.sellerName || "Konnekt seller"}</span>
                <span className="flex items-center gap-2"><Icon name="mail" className="h-4 w-4 text-[#008a58]" />{business.phone || business.sellerEmail || "Contact seller in app"}</span>
                {business.website ? <span className="flex items-center gap-2 break-all"><Icon name="link" className="h-4 w-4 text-[#008a58]" />{business.website}</span> : null}
              </div>
            </div>
          </article>
        )) : (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-white/60 md:col-span-2">
            No businesses found. Try another category or search term.
          </div>
        )}
      </div>
    </div>
  );
}

function CreateListingPanel({
  currentUser,
  onCreateListing,
  onCancel,
}: {
  currentUser: UserProfile;
  onCreateListing: (values: CreateListingValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<CreateListingValues>({
    name: "",
    category: "Beauty & Makeup",
    description: "",
    price: "",
    condition: "New",
    location: currentUser.location || "Remote across Africa",
    phone: "",
    website: "",
    imageUrl: "",
  });
  const { submitting, error, handleSubmit } = useAsyncAction();

  return (
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Jiji-style marketplace</p>
          <h2 className="mt-1 font-heading text-2xl font-bold text-[#142019]">Post a product, service, or business listing</h2>
          <p className="mt-1 text-sm text-slate-500">Seller details are taken from your registered profile: {currentUser.fullName}.</p>
        </div>
        <Button variant="ghost" type="button" onClick={onCancel}>Close</Button>
      </div>
      {error ? <div className="mt-4"><ErrorMessage message={error} /></div> : null}
      <form className="mt-5 space-y-4" onSubmit={handleSubmit(() => onCreateListing(values), "Unable to post listing.")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Listing title" value={values.name} onChange={(event) => setValues((previous) => ({ ...previous, name: event.target.value }))} placeholder="iPhone 13 Pro / Makeup service / Printing package" required />
          <SelectField label="Category" value={values.category} onChange={(event) => setValues((previous) => ({ ...previous, category: event.target.value }))}>
            {ALL_CATEGORY_TITLES.map((category) => <option key={category}>{category}</option>)}
          </SelectField>
        </div>
        <TextareaField label="Description" value={values.description} onChange={(event) => setValues((previous) => ({ ...previous, description: event.target.value }))} placeholder="Describe the product/service, quality, delivery, and what buyers should know." required />
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Price" value={values.price} onChange={(event) => setValues((previous) => ({ ...previous, price: event.target.value }))} placeholder="GHS 500 / Negotiable" />
          <SelectField label="Condition" value={values.condition} onChange={(event) => setValues((previous) => ({ ...previous, condition: event.target.value }))}>
            {['New', 'Used', 'Service', 'Wholesale', 'Negotiable'].map((condition) => <option key={condition}>{condition}</option>)}
          </SelectField>
          <Field label="Location" value={values.location} onChange={(event) => setValues((previous) => ({ ...previous, location: event.target.value }))} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Phone / WhatsApp" value={values.phone} onChange={(event) => setValues((previous) => ({ ...previous, phone: event.target.value }))} placeholder="+233..." />
          <Field label="Website/social link" value={values.website} onChange={(event) => setValues((previous) => ({ ...previous, website: event.target.value }))} placeholder="https://..." />
          <Field label="Image URL" value={values.imageUrl} onChange={(event) => setValues((previous) => ({ ...previous, imageUrl: event.target.value }))} placeholder="Paste image link for now" helper="No Firebase Storage needed. Uploads can be added later with Cloudinary or Storage." />
        </div>
        <div className="rounded-2xl bg-[#F8FAF9] p-4 text-sm leading-6 text-slate-600">
          <strong>Approval:</strong> normal member listings are submitted for admin approval before appearing publicly. Admin listings publish immediately.
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={submitting}>Post listing</Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </Panel>
  );
}

function AuthPage({
  mode,
  firebaseEnabled,
  onLogin,
  onRegister,
  onReset,
  onSocialLogin,
  onDemoLogin,
  navigate,
}: {
  mode: AuthMode;
  firebaseEnabled: boolean;
  onLogin: (values: LoginValues) => Promise<void>;
  onRegister: (values: RegisterValues) => Promise<void>;
  onReset: (email: string) => Promise<void>;
  onSocialLogin: (providerName: SocialProviderName) => Promise<void>;
  onDemoLogin: (kind: "member" | "admin") => Promise<void>;
  navigate: (to: string) => void;
}) {
  const [loginValues, setLoginValues] = useState<LoginValues>({ email: "", password: "" });
  const [registerValues, setRegisterValues] = useState<RegisterValues>({
    fullName: "",
    email: "",
    password: "",
    professionalTitle: "",
    industry: "Technology",
    skills: "",
    location: "Remote across Africa",
    bio: "",
    portfolioWebsite: "",
  });
  const [resetEmail, setResetEmail] = useState("");
  const [success, setSuccess] = useState("");
  const { submitting, error, setError, run, handleSubmit } = useAsyncAction();
  const [socialSubmitting, setSocialSubmitting] = useState<SocialProviderName | "">("");

  useEffect(() => {
    setError("");
    setSuccess("");
  }, [mode]);

  const submitLogin = handleSubmit(() => onLogin(loginValues), "Unable to login.");

  const submitRegister = handleSubmit(() => onRegister(registerValues), "Unable to create account.");

  const submitReset = handleSubmit(async () => {
    setSuccess("");
    await onReset(resetEmail);
    setSuccess("If the email is registered, password reset instructions have been sent.");
  }, "Unable to send reset email.");

  const runDemoLogin = (kind: "member" | "admin") => void run(() => onDemoLogin(kind), "Demo login failed.");

  const runSocialLogin = async (providerName: SocialProviderName) => {
    setSocialSubmitting(providerName);
    setError("");
    setSuccess("");
    try {
      await onSocialLogin(providerName);
    } catch (socialError) {
      setError(getErrorMessage(socialError, "Social sign-in failed."));
    } finally {
      setSocialSubmitting("");
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAF9] text-[#142019]">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-[#0B6B3A] lg:block">
          <img className="absolute inset-0 h-full w-full object-cover opacity-70" src={HERO_IMAGE_URL} alt="African professionals networking in a modern office" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#073b22] via-[#0B6B3A]/82 to-[#0B6B3A]/45" />
          <div className="relative flex h-full flex-col justify-between p-12 text-white">
            <div className="animate-fade-soft">
              <LogoMark />
            </div>
            <div className="max-w-2xl animate-rise">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.32em] text-[#D4AF37]">Konnekt Africa</p>
              <h1 className="font-heading text-6xl font-bold leading-tight">Konnekt</h1>
              <p className="mt-5 max-w-xl text-2xl font-semibold leading-snug text-white">Connecting Opportunities. Building Success.</p>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/80">
                A professional network for African entrepreneurs, freelancers, investors, recruiters, and business builders.
              </p>
            </div>
            <div className="grid max-w-xl grid-cols-3 gap-3 text-sm text-white/80">
              <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-sm">Profiles</div>
              <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-sm">Connections</div>
              <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-sm">Opportunities</div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
          <div className="w-full max-w-xl animate-rise">
            <div className="mb-8 lg:hidden">
              <LogoMark />
              <h1 className="mt-8 font-heading text-5xl font-bold text-[#0B6B3A]">Konnekt</h1>
              <p className="mt-3 text-lg font-semibold text-[#142019]">Connecting Opportunities. Building Success.</p>
            </div>

            <Panel className="p-6 sm:p-8">
              <div className="mb-7">
                <Badge tone="gold">{firebaseEnabled ? "Firebase connected" : "Demo mode ready"}</Badge>
                <h2 className="mt-4 font-heading text-3xl font-bold text-[#142019]">
                  {mode === "login" && "Welcome back"}
                  {mode === "register" && "Create your profile"}
                  {mode === "reset" && "Reset password"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {mode === "login" && "Sign in to manage your network, messages, and opportunities."}
                  {mode === "register" && "Build a public professional profile for discovery across Africa."}
                  {mode === "reset" && "We will send a password reset link to your email address."}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2 rounded-3xl bg-[#F8FAF9] p-1">
                  <button
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm font-bold transition",
                      mode === "login" ? "bg-white text-[#0B6B3A] shadow-sm" : "text-slate-500 hover:text-[#0B6B3A]"
                    )}
                    type="button"
                    onClick={() => navigate("/login")}
                  >
                    I have an account
                  </button>
                  <button
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm font-bold transition",
                      mode === "register" ? "bg-white text-[#0B6B3A] shadow-sm" : "text-slate-500 hover:text-[#0B6B3A]"
                    )}
                    type="button"
                    onClick={() => navigate("/register")}
                  >
                    Create account
                  </button>
                </div>
              </div>

              {error ? <ErrorMessage message={error} /> : null}
              {success ? <SuccessMessage message={success} /> : null}

              {mode !== "reset" ? (
                <div className="mb-5 space-y-3">
                  <div className="grid gap-3">
                    <Button
                      className="w-full"
                      type="button"
                      variant="outline"
                      disabled={!firebaseEnabled || Boolean(socialSubmitting)}
                      loading={socialSubmitting === "google"}
                      onClick={() => void runSocialLogin("google")}
                    >
                      <span className="font-heading text-base">G</span>
                      Continue with Google
                    </Button>
                  </div>
                  {!firebaseEnabled ? (
                    <p className="text-center text-xs text-slate-500">Social sign-in appears after Firebase is connected.</p>
                  ) : null}
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span>Email</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                </div>
              ) : null}

              {mode === "login" ? (
                <form className="space-y-4" onSubmit={submitLogin}>
                  <Field
                    label="Email"
                    type="email"
                    value={loginValues.email}
                    onChange={(event) => setLoginValues((previous) => ({ ...previous, email: event.target.value }))}
                    placeholder="you@example.com"
                    required
                  />
                  <PasswordField
                    label="Password"
                    value={loginValues.password}
                    onChange={(event) => setLoginValues((previous) => ({ ...previous, password: event.target.value }))}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button className="text-sm font-semibold text-[#0B6B3A] hover:underline" type="button" onClick={() => navigate("/reset")}>
                      Forgot password?
                    </button>
                    <Button type="submit" loading={submitting}>Login</Button>
                  </div>

                  <div className="rounded-3xl bg-[#F8FAF9] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Demo credentials</p>
                    <p className="mt-2 text-sm text-slate-600">Member: amina@konnekt.africa / Konnekt123!</p>
                    <p className="text-sm text-slate-600">Admin: admin@konnekt.africa / Admin123!</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" disabled={firebaseEnabled || submitting} onClick={() => void runDemoLogin("member")}>Use member demo</Button>
                      <Button type="button" variant="outline" size="sm" disabled={firebaseEnabled || submitting} onClick={() => void runDemoLogin("admin")}>Use admin demo</Button>
                    </div>
                  </div>

                  <p className="text-center text-sm text-slate-500">
                    New to Konnekt?{" "}
                    <button className="font-semibold text-[#0B6B3A] hover:underline" type="button" onClick={() => navigate("/register")}>Create account</button>
                  </p>
                </form>
              ) : null}

              {mode === "register" ? (
                <form className="space-y-4" onSubmit={submitRegister}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Full name"
                      value={registerValues.fullName}
                      onChange={(event) => setRegisterValues((previous) => ({ ...previous, fullName: event.target.value }))}
                      placeholder="Amina Ndlovu"
                      required
                    />
                    <Field
                      label="Email"
                      type="email"
                      value={registerValues.email}
                      onChange={(event) => setRegisterValues((previous) => ({ ...previous, email: event.target.value }))}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PasswordField
                      label="Password"
                      value={registerValues.password}
                      onChange={(event) => setRegisterValues((previous) => ({ ...previous, password: event.target.value }))}
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      required
                    />
                    <Field
                      label="Professional title"
                      value={registerValues.professionalTitle}
                      onChange={(event) => setRegisterValues((previous) => ({ ...previous, professionalTitle: event.target.value }))}
                      placeholder="Founder, Designer, Recruiter"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Industry"
                      value={registerValues.industry}
                      onChange={(event) => setRegisterValues((previous) => ({ ...previous, industry: event.target.value }))}
                    >
                      {INDUSTRIES.map((industry) => <option key={industry}>{industry}</option>)}
                    </SelectField>
                    <SelectField
                      label="Location"
                      value={registerValues.location}
                      onChange={(event) => setRegisterValues((previous) => ({ ...previous, location: event.target.value }))}
                    >
                      {LOCATIONS.map((location) => <option key={location}>{location}</option>)}
                    </SelectField>
                  </div>
                  <Field
                    label="Skills"
                    helper="Separate multiple skills with commas."
                    value={registerValues.skills}
                    onChange={(event) => setRegisterValues((previous) => ({ ...previous, skills: event.target.value }))}
                    placeholder="Fundraising, React, Product Strategy"
                  />
                  <TextareaField
                    label="Bio"
                    value={registerValues.bio}
                    onChange={(event) => setRegisterValues((previous) => ({ ...previous, bio: event.target.value }))}
                    placeholder="Tell the network what you build, invest in, or hire for."
                  />
                  <Field
                    label="Portfolio website"
                    value={registerValues.portfolioWebsite}
                    onChange={(event) => setRegisterValues((previous) => ({ ...previous, portfolioWebsite: event.target.value }))}
                    placeholder="https://example.com"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button className="text-sm font-semibold text-[#0B6B3A] hover:underline" type="button" onClick={() => navigate("/login")}>
                      Already have an account?
                    </button>
                    <Button type="submit" loading={submitting}>Register</Button>
                  </div>
                </form>
              ) : null}

              {mode === "reset" ? (
                <form className="space-y-4" onSubmit={submitReset}>
                  <Field
                    label="Email"
                    type="email"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button className="text-sm font-semibold text-[#0B6B3A] hover:underline" type="button" onClick={() => navigate("/login")}>
                      Back to login
                    </button>
                    <Button type="submit" loading={submitting}>Send reset link</Button>
                  </div>
                </form>
              ) : null}
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}

function LogoMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#0B6B3A] text-white shadow-lg shadow-emerald-900/20 ring-1 ring-white/20">
        <span className="font-heading text-2xl font-bold">K</span>
      </div>
      <div>
        <p className="font-heading text-xl font-bold leading-5 text-[#0B6B3A] lg:text-white">Konnekt</p>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">Africa</p>
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}

function SuccessMessage({ message }: { message: string }) {
  return <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>;
}

function SuspendedScreen({ onLogout }: { onLogout: () => Promise<void> }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAF9] p-6">
      <Panel className="max-w-lg text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-600">
          <Icon name="shield" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-[#142019]">Account suspended</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          This profile has been suspended by a Konnekt administrator. Contact support if you believe this is a mistake.
        </p>
        <Button className="mt-6" variant="outline" onClick={() => void onLogout()}>Logout</Button>
      </Panel>
    </div>
  );
}

function AppShell({
  currentUser,
  path,
  unreadNotifications,
  navigate,
  onLogout,
  children,
}: {
  currentUser: UserProfile;
  path: string;
  unreadNotifications: number;
  navigate: (to: string) => void;
  onLogout: () => Promise<void>;
  children: ReactNode;
}) {
  const navigationItems = [
    { label: "Home", mobileLabel: "Home", path: "/", icon: "home" as IconName },
    { label: "Network", mobileLabel: "Network", path: "/network", icon: "network" as IconName },
    { label: "Opportunities", mobileLabel: "Opps", path: "/opportunities", icon: "briefcase" as IconName },
    { label: "Messages", mobileLabel: "Chat", path: "/messages", icon: "message" as IconName },
    { label: "Profile", mobileLabel: "Profile", path: `/profile/${currentUser.id}`, icon: "user" as IconName },
  ];

  const settingsItem = { label: "Settings", mobileLabel: "Settings", path: "/settings", icon: "settings" as IconName };
  const adminItem = isAdminUser(currentUser) ? [{ label: "Admin", path: "/admin", icon: "admin" as IconName }] : [];
  const allItems = [...navigationItems, settingsItem, ...adminItem];
  const mobileItems = navigationItems;
  const pwaInstall = usePwaInstallAction();
  const handleInstallClick = () => void pwaInstall.triggerInstall();

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#142019]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200/80 bg-white/90 p-5 backdrop-blur-xl lg:flex">
        <LogoMark />
        <nav className="mt-10 flex flex-1 flex-col gap-2">
          {allItems.map((item) => (
            <NavButton key={item.path} item={item} active={isNavigationActive(path, item.path)} onClick={() => navigate(item.path)} />
          ))}
        </nav>
        <div className="rounded-3xl bg-[#F8FAF9] p-4">
          <div className="flex items-center gap-3">
            <Avatar user={currentUser} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#142019]">{currentUser.fullName}</p>
              <p className="truncate text-xs text-slate-500">{currentUser.professionalTitle}</p>
            </div>
          </div>
          <Button className="mt-4 w-full" variant="ghost" onClick={() => void onLogout()}>
            <Icon name="logout" /> Logout
          </Button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#F8FAF9]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0B6B3A] text-white">
                <span className="font-heading text-xl font-bold">K</span>
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-[#0B6B3A]">Konnekt</p>
                <p className="text-xs text-slate-500">Professional network</p>
              </div>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Konnekt</p>
              <h1 className="font-heading text-2xl font-bold text-[#142019]">{pageTitle(path)}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="hidden h-11 items-center justify-center gap-2 rounded-2xl border border-[#0B6B3A]/20 bg-white px-3 text-sm font-bold text-[#0B6B3A] shadow-sm transition hover:bg-[#0B6B3A]/10 sm:flex"
                type="button"
                onClick={handleInstallClick}
              >
                <Icon name="plus" className="h-4 w-4" />
                Install
              </button>
              <button
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-[#0B6B3A]",
                  path === "/settings" && "border-[#0B6B3A]/30 text-[#0B6B3A]"
                )}
                type="button"
                onClick={() => navigate("/settings")}
                aria-label="Settings"
              >
                <Icon name="settings" />
              </button>
              {isAdminUser(currentUser) ? (
                <button
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-[#0B6B3A]",
                    path === "/admin" && "border-[#0B6B3A]/30 text-[#0B6B3A]"
                  )}
                  type="button"
                  onClick={() => navigate("/admin")}
                  aria-label="Admin panel"
                >
                  <Icon name="admin" />
                </button>
              ) : null}
              <button
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-[#0B6B3A]",
                  path === "/notifications" && "border-[#0B6B3A]/30 text-[#0B6B3A]"
                )}
                type="button"
                onClick={() => navigate("/notifications")}
                aria-label="Notifications"
              >
                <Icon name="bell" />
                {unreadNotifications > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[10px] font-bold text-[#241c06]">
                    {unreadNotifications}
                  </span>
                ) : null}
              </button>
              <button
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-[#0B6B3A]",
                  path.startsWith("/messages") && "border-[#0B6B3A]/30 text-[#0B6B3A]"
                )}
                type="button"
                onClick={() => navigate("/messages")}
                aria-label="Messages"
              >
                <Icon name="message" />
              </button>
              <button className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:flex" type="button" onClick={() => navigate(`/profile/${currentUser.id}`)} aria-label="Profile">
                <Avatar user={currentUser} size="sm" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 pb-36 sm:px-6 lg:px-8 lg:pb-10">
          <div className="animate-fade-soft">{children}</div>
        </main>
      </div>

      {isAdminUser(currentUser) ? (
        <button
          className={cn(
            "fixed bottom-24 right-4 z-50 inline-flex items-center gap-2 rounded-2xl bg-[#D4AF37] px-4 py-3 text-sm font-bold text-[#241c06] shadow-xl shadow-slate-900/20 transition hover:bg-[#c8a32f] lg:hidden",
            path === "/admin" && "bg-[#0B6B3A] text-white"
          )}
          type="button"
          onClick={() => navigate("/admin")}
          aria-label="Open admin panel"
        >
          <Icon name="admin" className="h-5 w-5" />
          Admin
        </button>
      ) : null}

      <button
        className="fixed bottom-40 right-4 z-50 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#0B6B3A] shadow-xl shadow-slate-900/20 ring-1 ring-[#0B6B3A]/15 transition hover:bg-[#0B6B3A]/10 sm:hidden"
        type="button"
        onClick={handleInstallClick}
        aria-label="Install Konnekt app"
      >
        <Icon name="plus" className="h-5 w-5" />
        Install
      </button>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-1 pt-1.5 shadow-2xl shadow-slate-900/10 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {mobileItems.map((item) => (
            <button
              key={item.path}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-semibold leading-none transition duration-200",
                isNavigationActive(path, item.path)
                  ? "-translate-y-0.5 bg-[#0B6B3A] text-white shadow-lg shadow-emerald-900/20"
                  : "text-slate-500 hover:bg-slate-100 hover:text-[#0B6B3A]"
              )}
              type="button"
              onClick={() => navigate(item.path)}
            >
              <Icon name={item.icon} className="h-5 w-5" />
              <span className="block w-full truncate text-center">{item.mobileLabel}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: { label: string; path: string; icon: IconName };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        active ? "bg-[#0B6B3A] text-white shadow-lg shadow-emerald-900/10" : "text-slate-600 hover:bg-[#F8FAF9] hover:text-[#0B6B3A]"
      )}
      type="button"
      onClick={onClick}
    >
      <Icon name={item.icon} />
      {item.label}
    </button>
  );
}

function isNavigationActive(path: string, itemPath: string) {
  if (itemPath === "/") return path === "/";
  if (itemPath === "/opportunities") return path === "/opportunities" || path.startsWith("/opportunity/");
  if (itemPath.startsWith("/profile")) return path.startsWith("/profile");
  return path === itemPath || path.startsWith(`${itemPath}/`);
}

function pageTitle(path: string) {
  if (path === "/") return "Home";
  if (path.startsWith("/network")) return "Network";
  if (path.startsWith("/opportunit") || path.startsWith("/opportunity")) return "Opportunities";
  if (path.startsWith("/profile")) return "Profile";
  if (path.startsWith("/notifications")) return "Notifications";
  if (path.startsWith("/messages")) return "Messages";
  if (path.startsWith("/settings")) return "Settings";
  if (path.startsWith("/admin")) return "Admin";
  return "Konnekt";
}

function DashboardPage({
  currentUser,
  users,
  connections,
  opportunities,
  listings,
  notifications,
  loading,
  navigate,
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
  navigate: (to: string) => void;
  onConnect: (receiverId: string) => Promise<void>;
  onRespondConnection: (connectionId: string, status: "accepted" | "rejected") => Promise<void>;
  onMarkNotificationRead: (notificationId: string) => Promise<void>;
  onCreateListing: (values: CreateListingValues) => Promise<void>;
}) {
  const [selectedDashboardCategory, setSelectedDashboardCategory] = useState("Beauty & Makeup");
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [showListingForm, setShowListingForm] = useState(false);
  const [listingSuccess, setListingSuccess] = useState("");
  const visibleOpportunities = sortByDateDesc(
    opportunities.filter((opportunity) => canViewOpportunity(opportunity, currentUser))
  ).slice(0, 3);

  const suggestedUsers = getSuggestedUsers(currentUser, users, connections).slice(0, 4);
  const userNotifications = sortByDateDesc(
    notifications.filter((notification) => notification.userId === currentUser.id)
  ).slice(0, 4);
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
  const dashboardCategories = FEATURED_CATEGORIES;
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
            <BusinessResults title={dashboardSearch ? `Search results for “${dashboardSearch}”` : selectedDashboardCategory} businesses={dashboardBusinesses} />
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
                <OpportunityRow key={opportunity.id} opportunity={opportunity} poster={users.find((user) => user.id === opportunity.posterId) ?? null} navigate={navigate} />
              ))
            ) : (
              <EmptyState
                title="No opportunities yet \u2014 be the first to post."
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
                  navigate={navigate}
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
              <p className="rounded-2xl bg-[#F8FAF9] p-4 text-sm text-slate-500">No pending connection requests.</p>
            )}
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Existing connections" />
          <div className="mt-4 flex flex-wrap gap-2">
            {connectedProfiles.length ? (
              connectedProfiles.map((profile) => (
                <button key={profile.id} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm font-semibold text-slate-700 transition hover:border-[#0B6B3A]/30 hover:text-[#0B6B3A]" type="button" onClick={() => navigate(`/profile/${profile.id}`)}>
                  <Avatar user={profile} size="sm" />
                  {profile.fullName.split(" ")[0]}
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-500">Accepted connections will appear here.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="font-heading text-xl font-bold text-[#142019]">{title}</h2>
      {action}
    </div>
  );
}

function getSuggestedUsers(currentUser: UserProfile, users: UserProfile[], connections: Connection[]) {
  return users
    .filter((user) => user.id !== currentUser.id && !user.suspended)
    .map((user) => {
      const connectionState = getConnectionState(user.id, currentUser.id, connections).state;
      const sharedSkills = user.skills.filter((skill) =>
        currentUser.skills.some((currentSkill) => normalize(currentSkill) === normalize(skill))
      ).length;
      const score =
        (user.industry === currentUser.industry ? 4 : 0) +
        sharedSkills * 2 +
        (user.location === currentUser.location ? 1 : 0) -
        (connectionState === "connected" ? 5 : 0) -
        (connectionState === "sent" ? 3 : 0);
      return { user, score };
    })
    .filter((item) => item.score > -4)
    .sort((a, b) => b.score - a.score || a.user.fullName.localeCompare(b.user.fullName))
    .map((item) => item.user);
}

function NetworkPage({
  currentUser,
  users,
  connections,
  navigate,
  onConnect,
  onRespondConnection,
}: {
  currentUser: UserProfile;
  users: UserProfile[];
  connections: Connection[];
  navigate: (to: string) => void;
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
          <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0B6B3A]" value={industry} onChange={(event) => setIndustry(event.target.value)}>
            <option>All</option>
            {availableIndustries.map((item) => <option key={item}>{item}</option>)}
          </select>
          <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0B6B3A]" value={skill} onChange={(event) => setSkill(event.target.value)} placeholder="Filter by skill" />
          <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0B6B3A]" value={location} onChange={(event) => setLocation(event.target.value)}>
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
              navigate={navigate}
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

function NetworkUserCard({
  profile,
  currentUser,
  connections,
  compact = false,
  navigate,
  onConnect,
  onRespondConnection,
}: {
  profile: UserProfile;
  currentUser: UserProfile;
  connections: Connection[];
  compact?: boolean;
  navigate: (to: string) => void;
  onConnect: (receiverId: string) => Promise<void>;
  onRespondConnection: (connectionId: string, status: "accepted" | "rejected") => Promise<void>;
}) {
  const connectionCount = getAcceptedConnectionCount(profile.id, connections);

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70 ring-1 ring-slate-200/70 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200">
      <div className="flex items-start gap-4">
        <button type="button" onClick={() => navigate(`/profile/${profile.id}`)}>
          <Avatar user={profile} size={compact ? "md" : "lg"} />
        </button>
        <div className="min-w-0 flex-1">
          <button className="block truncate text-left font-heading text-lg font-bold text-[#142019] hover:text-[#0B6B3A]" type="button" onClick={() => navigate(`/profile/${profile.id}`)}>
            {profile.fullName}
          </button>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{profile.professionalTitle}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="primary">{profile.industry}</Badge>
            <Badge tone="neutral">{connectionCount} connection{connectionCount === 1 ? "" : "s"}</Badge>
            {profile.verified ? <Badge tone="gold">Verified</Badge> : null}
          </div>
        </div>
      </div>
      {!compact ? (
        <div className="mt-4 space-y-2 text-sm text-slate-500">
          <p className="flex items-center gap-2"><Icon name="location" className="h-4 w-4 text-[#0B6B3A]" />{profile.location}</p>
          <div className="flex flex-wrap gap-2">
            {profile.skills.slice(0, 3).map((skillName) => <span key={skillName} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{skillName}</span>)}
          </div>
        </div>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <ConnectionControls currentUser={currentUser} target={profile} connections={connections} navigate={navigate} onConnect={onConnect} onRespondConnection={onRespondConnection} />
      </div>
    </article>
  );
}

function ConnectionControls({
  currentUser,
  target,
  connections,
  navigate,
  onConnect,
  onRespondConnection,
}: {
  currentUser: UserProfile;
  target: UserProfile;
  connections: Connection[];
  navigate: (to: string) => void;
  onConnect: (receiverId: string) => Promise<void>;
  onRespondConnection: (connectionId: string, status: "accepted" | "rejected") => Promise<void>;
}) {
  const state = getConnectionState(target.id, currentUser.id, connections);

  if (state.state === "connected") {
    return (
      <>
        <Button variant="success" size="sm" disabled><Icon name="check" /> Connected</Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`/messages/${target.id}`)}><Icon name="message" /> Message</Button>
      </>
    );
  }

  if (state.state === "sent") return <Button variant="outline" size="sm" disabled>Pending</Button>;

  if (state.state === "received" && state.connection) {
    return (
      <>
        <Button size="sm" onClick={() => void onRespondConnection(state.connection.id, "accepted")}>Accept</Button>
        <Button variant="outline" size="sm" onClick={() => void onRespondConnection(state.connection.id, "rejected")}>Decline</Button>
      </>
    );
  }

  return <Button size="sm" onClick={() => void onConnect(target.id)}>Connect</Button>;
}

function ProfilePage({
  profile,
  currentUser,
  connections,
  opportunities,
  navigate,
  onSaveProfile,
  onUploadPhoto,
  profilePhotoUploadAvailable,
  onConnect,
  onRespondConnection,
}: {
  profile: UserProfile | null;
  currentUser: UserProfile;
  connections: Connection[];
  opportunities: Opportunity[];
  navigate: (to: string) => void;
  onSaveProfile: (userId: string, patch: Partial<UserProfile>) => Promise<void>;
  onUploadPhoto: (file: File) => Promise<string>;
  profilePhotoUploadAvailable: boolean;
  onConnect: (receiverId: string) => Promise<void>;
  onRespondConnection: (connectionId: string, status: "accepted" | "rejected") => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(() => (profile || currentUser).photoUrl);
  const [formValues, setFormValues] = useState<ProfileFormValues>(() => profileToForm(profile || currentUser));

  useEffect(() => {
    setEditing(false);
    setPhotoFile(null);
    setPhotoPreviewUrl((profile || currentUser).photoUrl);
    setFormValues(profileToForm(profile || currentUser));
  }, [profile, currentUser]);

  if (!profile) {
    return <EmptyState title="Profile not found" description="This profile may have been removed or suspended." action={<Button onClick={() => navigate("/network")}>Back to network</Button>} />;
  }

  const displayProfile = { ...profile, photoUrl: photoPreviewUrl || profile.photoUrl };
  const isOwnProfile = profile.id === currentUser.id;
  const profileOpportunities = sortByDateDesc(
    opportunities.filter((opportunity) => opportunity.posterId === profile.id && canViewOpportunity(opportunity, currentUser))
  );
  const connectedProfilesCount = getAcceptedConnectionCount(profile.id, connections);

  const updateFormValue = (field: keyof ProfileFormValues, value: string) => {
    setFormValues((previous) => ({ ...previous, [field]: value }));
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSuccess("Preparing photo...");
      const optimizedFile = await optimizeProfilePhotoFile(file);
      validateProfilePhotoFile(optimizedFile, "upload");
      setPhotoFile(optimizedFile);
      setPhotoPreviewUrl(await fileToDataUrl(optimizedFile));
      setError("");
      setSuccess(
        optimizedFile.size < file.size
          ? "Photo optimized. Save changes to upload it."
          : "Photo selected. Save changes to upload it."
      );
    } catch (photoError) {
      event.target.value = "";
      setPhotoFile(null);
      setPhotoPreviewUrl(profile.photoUrl);
      setSuccess("");
      setError(getErrorMessage(photoError, "Unable to use that image."));
    }
  };

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const patch: Partial<UserProfile> = {
        fullName: formValues.fullName.trim(),
        professionalTitle: formValues.professionalTitle.trim(),
        industry: formValues.industry,
        skills: splitTags(formValues.skills),
        location: formValues.location,
        bio: formValues.bio.trim(),
        portfolioWebsite: formValues.portfolioWebsite.trim(),
      };
      if (photoFile) patch.photoUrl = await onUploadPhoto(photoFile);
      await onSaveProfile(profile.id, patch);
      if (patch.photoUrl) setPhotoPreviewUrl(patch.photoUrl);
      setPhotoFile(null);
      setSuccess(photoFile ? "Profile photo and details updated successfully." : "Profile updated successfully.");
      setEditing(false);
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Unable to save profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Panel className="animate-rise overflow-hidden p-0">
        <div className="h-28 bg-gradient-to-r from-[#0B6B3A] via-[#0B6B3A] to-[#D4AF37]" />
        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Avatar user={displayProfile} size="xl" className="ring-4 ring-white" />
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-3xl font-bold text-[#142019]">{profile.fullName}</h1>
                  <Badge tone="primary">{connectedProfilesCount} connection{connectedProfilesCount === 1 ? "" : "s"}</Badge>
                  {profile.verified ? <Badge tone="gold">Verified profile</Badge> : null}
                </div>
                <p className="mt-1 text-base font-semibold text-slate-700">{profile.professionalTitle}</p>
                <p className="mt-1 text-sm text-slate-500">{profile.industry} in {profile.location}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isOwnProfile ? (
                <Button variant="outline" onClick={() => setEditing((previous) => !previous)}><Icon name="edit" /> {editing ? "Cancel" : "Edit profile"}</Button>
              ) : (
                <ConnectionControls currentUser={currentUser} target={profile} connections={connections} navigate={navigate} onConnect={onConnect} onRespondConnection={onRespondConnection} />
              )}
            </div>
          </div>
        </div>
      </Panel>

      {error ? <ErrorMessage message={error} /> : null}
      {success ? <SuccessMessage message={success} /> : null}

      {editing && isOwnProfile ? (
        <Panel>
          <SectionTitle title="Edit profile" />
          <form className="mt-5 space-y-4" onSubmit={submitProfile}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name" value={formValues.fullName} onChange={(event) => updateFormValue("fullName", event.target.value)} required />
              <Field label="Professional title" value={formValues.professionalTitle} onChange={(event) => updateFormValue("professionalTitle", event.target.value)} />
              <SelectField label="Industry" value={formValues.industry} onChange={(event) => updateFormValue("industry", event.target.value)}>
                {INDUSTRIES.map((industryName) => <option key={industryName}>{industryName}</option>)}
              </SelectField>
              <SelectField label="Location" value={formValues.location} onChange={(event) => updateFormValue("location", event.target.value)}>
                {LOCATIONS.map((locationName) => <option key={locationName}>{locationName}</option>)}
              </SelectField>
            </div>
            <Field label="Skills" helper="Separate skills with commas." value={formValues.skills} onChange={(event) => updateFormValue("skills", event.target.value)} />
            <TextareaField label="Bio" value={formValues.bio} onChange={(event) => updateFormValue("bio", event.target.value)} />
            <Field label="Portfolio website" value={formValues.portfolioWebsite} onChange={(event) => updateFormValue("portfolioWebsite", event.target.value)} />
            <div className="rounded-3xl border border-slate-200 bg-[#F8FAF9] p-4">
              <span className="text-sm font-semibold text-slate-700">Profile photo</span>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar user={displayProfile} size="xl" className="ring-4 ring-white" />
                <div className="flex-1">
                  {profilePhotoUploadAvailable ? (
                    <>
                      <p className="text-sm text-slate-600">Upload a clear JPG, PNG, WebP, or GIF image. Large photos are optimized before upload.</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[#0B6B3A] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-[#095a31]">
                          Choose photo
                          <input key={photoFile ? "photo-selected" : "photo-empty"} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => void handlePhotoChange(event)} />
                        </label>
                        {photoFile ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPhotoFile(null);
                              setPhotoPreviewUrl(profile.photoUrl);
                              setSuccess("");
                            }}
                          >
                            Remove selection
                          </Button>
                        ) : null}
                      </div>
                      {photoFile ? <p className="mt-2 text-xs font-semibold text-[#0B6B3A]">Selected: {photoFile.name}</p> : null}
                    </>
                  ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                      Profile photo uploads are skipped for now because Firebase Storage is not enabled. Your generated initials avatar will still work.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button type="submit" loading={saving}>Save changes</Button>
          </form>
        </Panel>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <Panel>
            <SectionTitle title="About" />
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{profile.bio || "This professional has not added a bio yet."}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoLine icon="mail" label="Email" value={profile.email} />
              <InfoLine icon="location" label="Location" value={profile.location} />
              {profile.portfolioWebsite ? <InfoLine icon="link" label="Portfolio" value={profile.portfolioWebsite} /> : null}
              <InfoLine icon="network" label="Connections" value={`${connectedProfilesCount} accepted`} />
            </div>
          </Panel>

          <Panel>
            <SectionTitle title="Skills" />
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.skills.length ? profile.skills.map((skillName) => <Badge key={skillName} tone="primary">{skillName}</Badge>) : <p className="text-sm text-slate-500">No skills added yet.</p>}
            </div>
          </Panel>
        </div>

        <Panel>
          <SectionTitle title="Posted opportunities" />
          <div className="mt-4 space-y-3">
            {profileOpportunities.length ? (
              profileOpportunities.map((opportunity) => (
                <OpportunityRow key={opportunity.id} opportunity={opportunity} poster={profile} navigate={navigate} />
              ))
            ) : (
              <p className="rounded-2xl bg-[#F8FAF9] p-4 text-sm text-slate-500">No opportunities posted yet.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function profileToForm(profile: UserProfile): ProfileFormValues {
  return {
    fullName: profile.fullName,
    professionalTitle: profile.professionalTitle,
    industry: profile.industry,
    skills: profile.skills.join(", "),
    location: profile.location,
    bio: profile.bio,
    portfolioWebsite: profile.portfolioWebsite,
  };
}

function InfoLine({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F8FAF9] p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"><Icon name={icon} className="h-4 w-4 text-[#0B6B3A]" />{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-[#142019]">{value}</p>
    </div>
  );
}

function OpportunitiesPage({
  currentUser,
  users,
  opportunities,
  navigate,
  onCreateOpportunity,
  onDeleteOpportunity,
}: {
  currentUser: UserProfile;
  users: UserProfile[];
  opportunities: Opportunity[];
  navigate: (to: string) => void;
  onCreateOpportunity: (values: CreateOpportunityValues) => Promise<void>;
  onDeleteOpportunity: (opportunityId: string) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const emptyOpportunityValues: CreateOpportunityValues = {
    title: "",
    description: "",
    type: "Job",
    industry: "Technology",
    location: "Remote across Africa",
    budget: "",
    deadline: "",
    applyLink: "",
  };
  const [values, setValues] = useState<CreateOpportunityValues>(emptyOpportunityValues);
  const { submitting, error, handleSubmit } = useAsyncAction();

  const visibleOpportunities = sortByDateDesc(
    opportunities.filter((opportunity) => canViewOpportunity(opportunity, currentUser))
  );

  const submitOpportunity = handleSubmit(async () => {
    await onCreateOpportunity(values);
    setValues(emptyOpportunityValues);
    setShowForm(false);
  }, "Unable to create opportunity.");

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
              navigate={navigate}
              onDeleteOpportunity={onDeleteOpportunity}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No opportunities yet \u2014 be the first to post."
          description="Create a job, business, or collaboration post for the Konnekt community."
          action={<Button onClick={() => setShowForm(true)}>Post first opportunity</Button>}
        />
      )}
    </div>
  );
}

function OpportunityCard({
  opportunity,
  poster,
  currentUser,
  navigate,
  onDeleteOpportunity,
}: {
  opportunity: Opportunity;
  poster: UserProfile | null;
  currentUser: UserProfile;
  navigate: (to: string) => void;
  onDeleteOpportunity: (opportunityId: string) => Promise<void>;
}) {
  const canDelete = isAdminUser(currentUser) || opportunity.posterId === currentUser.id;
  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70 ring-1 ring-slate-200/70 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={opportunity.type === "Job" ? "primary" : opportunity.type === "Business" ? "gold" : "neutral"}>{opportunity.type}</Badge>
            {opportunity.status === "pending" ? <Badge tone="red">Pending review</Badge> : null}
          </div>
          <h2 className="mt-4 font-heading text-xl font-bold text-[#142019]">{opportunity.title}</h2>
        </div>
        <p className="text-xs font-semibold text-slate-400">{relativeTime(opportunity.createdAt)}</p>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{opportunity.description}</p>
      <div className="mt-4 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
        {opportunity.industry ? <span className="flex items-center gap-2"><Icon name="briefcase" className="h-4 w-4 text-[#0B6B3A]" />{opportunity.industry}</span> : null}
        <span className="flex items-center gap-2"><Icon name="location" className="h-4 w-4 text-[#0B6B3A]" />{opportunity.location}</span>
        {opportunity.budget ? <span className="font-semibold text-[#0B6B3A]">Budget: {opportunity.budget}</span> : null}
        {opportunity.deadline ? <span>Deadline: {formatDate(opportunity.deadline)}</span> : null}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <button className="flex min-w-0 items-center gap-3 text-left" type="button" onClick={() => poster && navigate(`/profile/${poster.id}`)}>
          {poster ? <Avatar user={poster} /> : <div className="h-12 w-12 rounded-full bg-slate-200" />}
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-[#142019]">{poster?.fullName || "Konnekt member"}</span>
            <span className="block truncate text-xs text-slate-500">{poster?.professionalTitle || "Poster"}</span>
          </span>
        </button>
        <div className="flex flex-wrap justify-end gap-2">
          {canDelete ? <Button variant="ghost" size="sm" onClick={() => void onDeleteOpportunity(opportunity.id)}>Delete</Button> : null}
          <Button size="sm" onClick={() => navigate(`/opportunity/${opportunity.id}`)}>View Details</Button>
        </div>
      </div>
    </article>
  );
}

function OpportunityRow({
  opportunity,
  poster,
  navigate,
}: {
  opportunity: Opportunity;
  poster: UserProfile | null;
  navigate: (to: string) => void;
}) {
  return (
    <button className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#0B6B3A]/30 hover:shadow-sm" type="button" onClick={() => navigate(`/opportunity/${opportunity.id}`)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={opportunity.type === "Job" ? "primary" : opportunity.type === "Business" ? "gold" : "neutral"}>{opportunity.type}</Badge>
            {opportunity.status === "pending" ? <Badge tone="red">Pending</Badge> : null}
          </div>
          <h3 className="mt-3 font-heading text-base font-bold text-[#142019]">{opportunity.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{opportunity.location}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-xs font-semibold text-slate-400">{relativeTime(opportunity.createdAt)}</span>
          {poster ? <Avatar user={poster} size="sm" /> : null}
        </div>
      </div>
    </button>
  );
}

function OpportunityDetailsPage({
  opportunityId,
  currentUser,
  users,
  opportunities,
  navigate,
}: {
  opportunityId: string;
  currentUser: UserProfile;
  users: UserProfile[];
  opportunities: Opportunity[];
  navigate: (to: string) => void;
}) {
  const [contactEmail, setContactEmail] = useState("");
  const opportunity = opportunities.find((item) => item.id === opportunityId && canViewOpportunity(item, currentUser));
  const poster = opportunity ? users.find((user) => user.id === opportunity.posterId) ?? null : null;

  if (!opportunity) {
    return <EmptyState title="Opportunity not found" description="This post may have been removed or is not approved yet." action={<Button onClick={() => navigate("/opportunities")}>Back to opportunities</Button>} />;
  }

  const applyOrContact = () => {
    if (opportunity.applyLink) {
      window.open(opportunity.applyLink, "_blank", "noopener,noreferrer");
      return;
    }
    setContactEmail(poster?.email || "No email available for this poster.");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
      <Panel className="animate-rise">
        <button className="mb-5 flex items-center gap-2 text-sm font-bold text-[#0B6B3A]" type="button" onClick={() => navigate("/opportunities")}><Icon name="arrow" className="h-4 w-4 rotate-180" /> Back to feed</button>
        <div className="flex flex-wrap gap-2">
          <Badge tone={opportunity.type === "Job" ? "primary" : opportunity.type === "Business" ? "gold" : "neutral"}>{opportunity.type}</Badge>
          <Badge tone={opportunity.status === "approved" ? "green" : "red"}>{opportunity.status === "approved" ? "Approved" : "Pending review"}</Badge>
        </div>
        <h1 className="mt-5 font-heading text-3xl font-bold text-[#142019] sm:text-4xl">{opportunity.title}</h1>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
          {opportunity.industry ? <span className="flex items-center gap-2"><Icon name="briefcase" className="h-4 w-4 text-[#0B6B3A]" />{opportunity.industry}</span> : null}
          <span className="flex items-center gap-2"><Icon name="location" className="h-4 w-4 text-[#0B6B3A]" />{opportunity.location}</span>
          {opportunity.budget ? <span>Budget: {opportunity.budget}</span> : null}
          {opportunity.deadline ? <span>Deadline: {formatDate(opportunity.deadline)}</span> : null}
          <span>Posted {formatDate(opportunity.createdAt)}</span>
        </div>
        <p className="mt-8 whitespace-pre-line text-base leading-8 text-slate-600">{opportunity.description}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button onClick={applyOrContact}>{opportunity.applyLink ? "Apply" : "Contact poster"}</Button>
          {contactEmail ? <span className="rounded-2xl bg-[#F8FAF9] px-4 py-3 text-sm font-semibold text-[#0B6B3A]">{contactEmail}</span> : null}
        </div>
      </Panel>

      <Panel>
        <SectionTitle title="Poster information" />
        {poster ? (
          <div className="mt-5">
            <div className="flex items-start gap-4">
              <Avatar user={poster} size="lg" />
              <div>
                <h2 className="font-heading text-xl font-bold text-[#142019]">{poster.fullName}</h2>
                <p className="mt-1 text-sm text-slate-500">{poster.professionalTitle}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="primary">{poster.industry}</Badge>
                  {poster.verified ? <Badge tone="gold">Verified</Badge> : null}
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-500">{poster.bio || "No bio available."}</p>
            <Button className="mt-5 w-full" variant="outline" onClick={() => navigate(`/profile/${poster.id}`)}>View poster profile</Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Poster profile is unavailable.</p>
        )}
      </Panel>
    </div>
  );
}

function NotificationsPage({
  currentUser,
  notifications,
  onMarkRead,
  onMarkAllRead,
}: {
  currentUser: UserProfile;
  notifications: NotificationItem[];
  onMarkRead: (notificationId: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}) {
  const userNotifications = sortByDateDesc(
    notifications.filter((notification) => notification.userId === currentUser.id)
  );
  const unreadCount = userNotifications.filter((notification) => !notification.read).length;

  return (
    <div className="space-y-5">
      <Panel className="animate-rise">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Notifications</p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-[#142019]">Recent alerts and updates</h1>
            <p className="mt-2 text-sm text-slate-500">Connection requests, accepted connections, messages, and opportunity matches.</p>
          </div>
          <Button variant="outline" disabled={!unreadCount} onClick={() => void onMarkAllRead()}>Mark all read</Button>
        </div>
      </Panel>

      {userNotifications.length ? (
        <Panel>
          <div className="space-y-3">
            {userNotifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} onMarkRead={onMarkRead} />
            ))}
          </div>
        </Panel>
      ) : (
        <EmptyState title="No notifications" description="Alerts and updates will appear here when people interact with you." />
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: NotificationItem;
  onMarkRead: (notificationId: string) => Promise<void>;
}) {
  const tone = notification.type === "connection_request" ? "gold" : notification.type === "connection_accepted" ? "green" : notification.type === "opportunity_match" ? "primary" : "neutral";
  return (
    <div className={cn("rounded-3xl border p-4 transition", notification.read ? "border-slate-200 bg-white" : "border-[#D4AF37]/40 bg-[#D4AF37]/10")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge tone={tone}>{notification.type.replace(/_/g, " ")}</Badge>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#142019]">{notification.message}</p>
          <p className="mt-1 text-xs text-slate-500">{relativeTime(notification.createdAt)}</p>
        </div>
        {!notification.read ? <Button variant="ghost" size="sm" onClick={() => void onMarkRead(notification.id)}>Mark read</Button> : null}
      </div>
    </div>
  );
}

function MessagesPage({
  currentUser,
  users,
  connections,
  messages,
  routeContactId,
  navigate,
  onSendMessage,
}: {
  currentUser: UserProfile;
  users: UserProfile[];
  connections: Connection[];
  messages: Message[];
  routeContactId?: string;
  navigate: (to: string) => void;
  onSendMessage: (receiverId: string, body: string) => Promise<void>;
}) {
  const contacts = useMemo(() => getConnectedProfiles(currentUser.id, users, connections), [currentUser.id, users, connections]);
  const [selectedId, setSelectedId] = useState(routeContactId || contacts[0]?.id || "");
  const [messageBody, setMessageBody] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (routeContactId && contacts.some((contact) => contact.id === routeContactId)) {
      setSelectedId(routeContactId);
      return;
    }
    if (!selectedId && contacts[0]) setSelectedId(contacts[0].id);
    if (selectedId && !contacts.some((contact) => contact.id === selectedId)) setSelectedId(contacts[0]?.id || "");
  }, [contacts, routeContactId, selectedId]);

  const selectedContact = contacts.find((contact) => contact.id === selectedId) ?? null;
  const thread = selectedContact
    ? sortByDateAsc(
        messages.filter(
          (message) =>
            (message.senderId === currentUser.id && message.receiverId === selectedContact.id) ||
            (message.senderId === selectedContact.id && message.receiverId === currentUser.id)
        )
      )
    : [];

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedContact) return;
    setError("");
    try {
      await onSendMessage(selectedContact.id, messageBody);
      setMessageBody("");
    } catch (sendError) {
      setError(getErrorMessage(sendError, "Unable to send message."));
    }
  };

  if (!contacts.length) {
    return (
      <EmptyState
        title="No message contacts yet"
        description="Accept or create a connection before starting a one-to-one message."
        action={<Button onClick={() => navigate("/network")}>Find connections</Button>}
      />
    );
  }

  return (
    <div className="grid min-h-[70vh] gap-5 pb-20 lg:grid-cols-[0.75fr_1.25fr] lg:pb-0">
      <Panel className="p-4">
        <SectionTitle title="Messages" />
        <div className="mt-4 space-y-2">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              className={cn(
                "flex w-full items-center gap-3 rounded-3xl p-3 text-left transition",
                selectedContact?.id === contact.id ? "bg-[#0B6B3A] text-white" : "hover:bg-[#F8FAF9]"
              )}
              type="button"
              onClick={() => {
                setSelectedId(contact.id);
                navigate(`/messages/${contact.id}`);
              }}
            >
              <Avatar user={contact} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{contact.fullName}</span>
                <span className={cn("block truncate text-xs", selectedContact?.id === contact.id ? "text-white/70" : "text-slate-500")}>{contact.professionalTitle}</span>
              </span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="flex min-h-[70vh] flex-col overflow-hidden p-0">
        {selectedContact ? (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <Avatar user={selectedContact} />
                <div>
                  <h1 className="font-heading text-lg font-bold text-[#142019]">{selectedContact.fullName}</h1>
                  <p className="text-sm text-slate-500">{selectedContact.professionalTitle}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/profile/${selectedContact.id}`)}>Profile</Button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-[#F8FAF9] p-5">
              {thread.length ? (
                thread.map((message) => (
                  <MessageBubble key={message.id} message={message} isOwn={message.senderId === currentUser.id} />
                ))
              ) : (
                <EmptyState title="Start the conversation" description="Send a concise professional message to move the connection forward." />
              )}
            </div>
            <form className="sticky bottom-0 border-t border-slate-100 bg-white p-4" onSubmit={submitMessage}>
              {error ? <ErrorMessage message={error} /> : null}
              <div className="flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0B6B3A]"
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                  placeholder="Write a professional message"
                />
                <Button type="submit">Send</Button>
              </div>
            </form>
          </>
        ) : null}
      </Panel>
    </div>
  );
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[78%] rounded-3xl px-4 py-3 text-sm shadow-sm", isOwn ? "rounded-br-md bg-[#0B6B3A] text-white" : "rounded-bl-md bg-white text-slate-700")}>
        <p className="leading-6">{message.body}</p>
        <p className={cn("mt-1 text-[11px]", isOwn ? "text-white/70" : "text-slate-400")}>{relativeTime(message.createdAt)}</p>
      </div>
    </div>
  );
}

function SettingsPage({
  currentUser,
  firebaseEnabled,
  storageEnabled,
  navigate,
  onLogout,
}: {
  currentUser: UserProfile;
  firebaseEnabled: boolean;
  storageEnabled: boolean;
  navigate: (to: string) => void;
  onLogout: () => Promise<void>;
}) {
  const [loggingOut, setLoggingOut] = useState(false);

  const runLogout = async () => {
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="space-y-5">
      <Panel className="animate-rise">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar user={currentUser} size="lg" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Settings</p>
              <h1 className="mt-1 font-heading text-3xl font-bold text-[#142019]">Account and app controls</h1>
              <p className="mt-1 text-sm text-slate-500">Manage your Konnekt session, profile, and platform access.</p>
            </div>
          </div>
          <Button variant="danger" loading={loggingOut} onClick={() => void runLogout()}>
            <Icon name="logout" /> Logout
          </Button>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Panel>
          <SectionTitle title="Account" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoLine icon="user" label="Name" value={currentUser.fullName} />
            <InfoLine icon="mail" label="Email" value={currentUser.email || "No email on profile"} />
            <InfoLine icon="briefcase" label="Professional title" value={currentUser.professionalTitle} />
            <InfoLine icon="shield" label="Role" value={isAdminUser(currentUser) ? "Admin" : "Member"} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(`/profile/${currentUser.id}`)}>
              <Icon name="user" /> View profile
            </Button>
            {isAdminUser(currentUser) ? (
              <Button variant="outline" onClick={() => navigate("/admin")}>
                <Icon name="admin" /> Admin panel
              </Button>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Platform status" />
          <div className="mt-5 space-y-3">
            <StatusLine label="Firebase" active={firebaseEnabled} activeText="Connected" inactiveText="Demo mode" />
            <StatusLine label="Authentication" active={firebaseEnabled} activeText="Live auth" inactiveText="Local demo auth" />
            <StatusLine label="Profile photo storage" active={storageEnabled} activeText="Enabled" inactiveText="Skipped for now" />
            <StatusLine label="Offline access" active={false} activeText="Enabled" inactiveText="Blocked for live data safety" />
          </div>
        </Panel>
      </div>

      <Panel>
        <SectionTitle title="Security" />
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Passwords are handled by Firebase Authentication and are not stored in Firestore. Use logout on shared devices, especially on mobile browsers.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/reset")}>Reset password</Button>
          <Button variant="danger" loading={loggingOut} onClick={() => void runLogout()}>
            <Icon name="logout" /> Logout from this device
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function StatusLine({
  label,
  active,
  activeText,
  inactiveText,
}: {
  label: string;
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8FAF9] px-4 py-3">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <Badge tone={active ? "green" : "gold"}>{active ? activeText : inactiveText}</Badge>
    </div>
  );
}

function AdminPage({
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
    } catch (err) {
      const message = getErrorMessage(err, "Admin action failed.");
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

function AdminStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70 ring-1 ring-slate-200/70">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 font-heading text-3xl font-bold text-[#0B6B3A]">{value}</p>
    </div>
  );
}

function AnalyticsPanel({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-3 font-heading text-2xl font-bold text-[#142019]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}

function AccessDenied({ currentUser }: { currentUser?: UserProfile }) {
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

function NotFound({ navigate }: { navigate: (to: string) => void }) {
  return (
    <EmptyState title="Page not found" description="The page you requested does not exist in Konnekt." action={<Button onClick={() => navigate("/")}>Go home</Button>} />
  );
}

