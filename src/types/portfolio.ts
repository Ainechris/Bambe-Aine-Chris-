export const CERTIFICATE_CATEGORIES = [
  'Software Development',
  'Backend Development',
  'Frontend Development',
  'Database Management',
  'Cybersecurity',
  'Networking',
  'Artificial Intelligence',
  'Other',
] as const;

export const PROJECT_STATUSES = ['In Progress', 'Completed', 'Archived'] as const;

export type CertificateCategory = (typeof CERTIFICATE_CATEGORIES)[number];
export type PublicationStatus = 'draft' | 'published';
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface CertificateRecord {
  id: string;
  title: string;
  issuer: string;
  description: string;
  issueDate: string;
  expirationDate: string | null;
  credentialId: string | null;
  verificationUrl: string | null;
  category: string;
  status: PublicationStatus;
  hasFile: boolean;
  fileUrl: string | null;
  originalFileName: string | null;
  fileMime: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectScreenshotRecord {
  id: string;
  imageUrl: string;
  originalImageName: string | null;
  imageMime: string | null;
  imageSize: number | null;
}

export interface ProjectRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  problemStatement: string | null;
  myContribution: string | null;
  keyFeatures: string[];
  developmentProcess: string | null;
  technologies: string[];
  githubUrl: string | null;
  liveUrl: string | null;
  projectStatus: ProjectStatus;
  visibility: PublicationStatus;
  featured: boolean;
  hasImage: boolean;
  imageUrl: string | null;
  originalImageName: string | null;
  imageMime: string | null;
  imageSize: number | null;
  screenshots: ProjectScreenshotRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: string;
}

export interface GitHubRepoRecord {
  id: number;
  name: string;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  updatedAt: string;
}

export function isSafeHttpUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function formatDisplayDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  const datePart = isoDate.includes('T') ? isoDate.slice(0, 10) : isoDate;
  const parsed = new Date(`${datePart}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
