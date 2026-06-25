export type Role = "member" | "admin";
export type ConnectionStatus = "pending" | "accepted" | "rejected";
export type OpportunityType = "Job" | "Business" | "Collaboration";
export type OpportunityStatus = "pending" | "approved";
export type NotificationType =
  | "connection_request"
  | "connection_accepted"
  | "opportunity_match"
  | "message"
  | "system";

export type UserProfile = {
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

export type Connection = {
  id: string;
  senderId: string;
  receiverId: string;
  status: ConnectionStatus;
  createdAt: string;
};

export type Opportunity = {
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

export type ListingStatus = "pending" | "approved";

export type BusinessListing = {
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

export type NotificationItem = {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
};

export type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  body: string;
  createdAt: string;
};

export type DemoAccount = {
  userId: string;
  email: string;
  password: string;
};

export type DemoStore = {
  accounts: DemoAccount[];
  currentUserId: string | null;
  users: UserProfile[];
  connections: Connection[];
  opportunities: Opportunity[];
  listings: BusinessListing[];
  notifications: NotificationItem[];
  messages: Message[];
};

export type LoginValues = {
  email: string;
  password: string;
};

export type RegisterValues = {
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

export type ProfileFormValues = {
  fullName: string;
  professionalTitle: string;
  industry: string;
  skills: string;
  location: string;
  bio: string;
  portfolioWebsite: string;
};

export type CreateOpportunityValues = {
  title: string;
  description: string;
  type: OpportunityType;
  industry: string;
  location: string;
  budget: string;
  deadline: string;
  applyLink: string;
};

export type CreateListingValues = {
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

export type AuthMode = "login" | "register" | "reset";
export type SocialProviderName = "google";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type IconName =
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
