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

export type AuthMode = "login" | "register" | "reset";
export type SocialProviderName = "google";

export type ProfileFormValues = {
  fullName: string;
  professionalTitle: string;
  industry: string;
  skills: string;
  location: string;
  bio: string;
  portfolioWebsite: string;
};
