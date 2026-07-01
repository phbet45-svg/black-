export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  planId: 'basic' | 'medium' | 'premium';
  isBlocked: boolean;
  credits: number;
  dailyLimit: number;
  monthlyLimit: number;
  storageLimitGB: number;
  textCount: number;
  imageCount: number;
  musicCount: number;
  videoCount: number;
  storageUsedMB: number;
  phone?: string;
  company?: string;
  requestedPlanId?: string;
  createdAt: string;
}

export interface Plan {
  id: 'basic' | 'medium' | 'premium';
  name: string;
  price: number;
  description: string;
  textLimit: number;
  imageLimit: number;
  musicLimit: number;
  videoLimit: number;
  storageGB: number;
  features: string[];
}

export interface Payment {
  id: string;
  userId: string;
  userEmail: string;
  planId: 'basic' | 'medium' | 'premium';
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  date: string;
  paymentMethod: string;
}

export interface SystemLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  timestamp: string;
  details: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  author: string;
  imageUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  createdAt: string;
  comments: BlogComment[];
}

export interface BlogComment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'closed';
  createdAt: string;
  replies: SupportReply[];
}

export interface SupportReply {
  id: string;
  sender: 'admin' | 'user';
  message: string;
  createdAt: string;
}

export interface SocialLinks {
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  linkedin: string;
  discord: string;
  telegram: string;
  whatsapp: string;
  x: string;
  website: string;
}

export interface AITool {
  id: string;
  name: string;
  description: string;
  category: 'text' | 'media' | 'business' | 'dev';
  status: 'free' | 'premium' | 'blocked';
  icon: string;
}
