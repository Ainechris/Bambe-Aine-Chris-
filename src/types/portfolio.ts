export interface Profile {
  id: number;
  fullName: string;
  brandName: string;
  title: string;
  direction: string;
  education: string;
  introShort: string;
  introLong: string;
  email: string;
  githubUrl: string;
  youtubeUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  projectNumber: string;
  name: string;
  fullName: string;
  category: string;
  description: string;
  technologies: string[];
  features: string[];
  repoUrl: string;
  imageUrl: string;
  featured: boolean;
  createdAt: string;
}

export interface Video {
  id: number;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  sortOrder: number;
  createdAt: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminOverview {
  projectsCount: number;
  videosCount: number;
  messagesCount: number;
  unreadMessagesCount: number;
  profile: Profile;
  projects: Project[];
  videos: Video[];
  messages: ContactMessage[];
}

export type RoutePath =
  | '/'
  | '/about'
  | '/skills'
  | '/projects'
  | '/youtube'
  | '/contact'
  | '/admin';
