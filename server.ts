import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import {
  ADMIN_ROUTE_META,
  PERSON_IDENTITY,
  PUBLIC_ROUTES,
  SITE_KEYWORDS,
  buildJsonLdGraph,
  buildProjectJsonLdGraph,
  findPublicRoute,
  normalizePathname,
  resolveAbsoluteAssetUrl,
} from './src/seo/routes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const DB_PATH = path.resolve(DATA_DIR, 'portfolio.db');
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const ALLOWED_CATEGORIES = new Set([
  'Software Development',
  'Backend Development',
  'Frontend Development',
  'Database Management',
  'Cybersecurity',
  'Networking',
  'Artificial Intelligence',
  'Other',
]);

const ALLOWED_PROJECT_STATUSES = new Set(['In Progress', 'Completed', 'Archived']);

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS admin_auth (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    issuer TEXT NOT NULL,
    description TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    expiration_date TEXT,
    credential_id TEXT,
    verification_url TEXT,
    category TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
    file_name TEXT,
    original_file_name TEXT,
    file_mime TEXT,
    file_size INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    slug TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    problem_statement TEXT,
    my_contribution TEXT,
    key_features TEXT NOT NULL DEFAULT '[]',
    development_process TEXT,
    technologies TEXT NOT NULL,
    github_url TEXT,
    live_url TEXT,
    project_status TEXT NOT NULL CHECK (project_status IN ('In Progress', 'Completed', 'Archived')),
    visibility TEXT NOT NULL CHECK (visibility IN ('draft', 'published')),
    featured INTEGER NOT NULL DEFAULT 0,
    image_name TEXT,
    original_image_name TEXT,
    image_mime TEXT,
    image_size INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS project_screenshots (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    image_name TEXT NOT NULL,
    original_image_name TEXT,
    image_mime TEXT,
    image_size INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('unread', 'read')),
    created_at TEXT NOT NULL
  );
`);

// Safe incremental migrations for existing projects tables
const projectColumns = new Set(
  (db.prepare('PRAGMA table_info(projects)').all() as Array<{ name: string }>).map(
    (c) => c.name,
  ),
);
if (!projectColumns.has('slug')) {
  db.exec('ALTER TABLE projects ADD COLUMN slug TEXT');
}
if (!projectColumns.has('problem_statement')) {
  db.exec('ALTER TABLE projects ADD COLUMN problem_statement TEXT');
}
if (!projectColumns.has('my_contribution')) {
  db.exec('ALTER TABLE projects ADD COLUMN my_contribution TEXT');
}
if (!projectColumns.has('key_features')) {
  db.exec("ALTER TABLE projects ADD COLUMN key_features TEXT NOT NULL DEFAULT '[]'");
}
if (!projectColumns.has('development_process')) {
  db.exec('ALTER TABLE projects ADD COLUMN development_process TEXT');
}
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug) WHERE slug IS NOT NULL');

interface CertificateRow {
  id: string;
  title: string;
  issuer: string;
  description: string;
  issue_date: string;
  expiration_date: string | null;
  credential_id: string | null;
  verification_url: string | null;
  category: string;
  status: 'draft' | 'published';
  file_name: string | null;
  original_file_name: string | null;
  file_mime: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
}

interface ProjectRow {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  problem_statement: string | null;
  my_contribution: string | null;
  key_features: string | null;
  development_process: string | null;
  technologies: string;
  github_url: string | null;
  live_url: string | null;
  project_status: 'In Progress' | 'Completed' | 'Archived';
  visibility: 'draft' | 'published';
  featured: number;
  image_name: string | null;
  original_image_name: string | null;
  image_mime: string | null;
  image_size: number | null;
  created_at: string;
  updated_at: string;
}

interface ProjectScreenshotRow {
  id: string;
  project_id: string;
  image_name: string;
  original_image_name: string | null;
  image_mime: string | null;
  image_size: number | null;
  sort_order: number;
  created_at: string;
}

interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read';
  created_at: string;
}

function slugifyTitle(title: string): string {
  const cleaned = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return cleaned || 'project';
}

function makeUniqueProjectSlug(title: string, excludeId?: string): string {
  const base = slugifyTitle(title);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = excludeId
      ? (db
          .prepare('SELECT id FROM projects WHERE slug = ? AND id != ?')
          .get(candidate, excludeId) as { id: string } | undefined)
      : (db.prepare('SELECT id FROM projects WHERE slug = ?').get(candidate) as
          | { id: string }
          | undefined);

    if (!existing) {
      return candidate;
    }
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

// Backfill slugs for any pre-existing projects
const missingSlugRows = db
  .prepare("SELECT id, title FROM projects WHERE slug IS NULL OR slug = ''")
  .all() as Array<{ id: string; title: string }>;
for (const row of missingSlugRows) {
  const uniqueSlug = makeUniqueProjectSlug(row.title, row.id);
  db.prepare('UPDATE projects SET slug = ? WHERE id = ?').run(uniqueSlug, row.id);
}

function formatCertificate(row: CertificateRow) {
  return {
    id: row.id,
    title: row.title,
    issuer: row.issuer,
    description: row.description,
    issueDate: row.issue_date,
    expirationDate: row.expiration_date,
    credentialId: row.credential_id,
    verificationUrl: row.verification_url,
    category: row.category,
    status: row.status,
    hasFile: Boolean(row.file_name),
    fileUrl: row.file_name ? `/api/certificates/file/${encodeURIComponent(row.file_name)}` : null,
    originalFileName: row.original_file_name,
    fileMime: row.file_mime,
    fileSize: row.file_size,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseJsonStringList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

function formatProject(row: ProjectRow) {
  const screenshotRows = db
    .prepare(
      'SELECT * FROM project_screenshots WHERE project_id = ? ORDER BY sort_order ASC, created_at ASC',
    )
    .all(row.id) as unknown as ProjectScreenshotRow[];

  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title,
    description: row.description,
    problemStatement: row.problem_statement,
    myContribution: row.my_contribution,
    keyFeatures: parseJsonStringList(row.key_features),
    developmentProcess: row.development_process,
    technologies: parseJsonStringList(row.technologies),
    githubUrl: row.github_url,
    liveUrl: row.live_url,
    projectStatus: row.project_status,
    visibility: row.visibility,
    featured: row.featured === 1,
    hasImage: Boolean(row.image_name),
    imageUrl: row.image_name ? `/api/projects/file/${encodeURIComponent(row.image_name)}` : null,
    originalImageName: row.original_image_name,
    imageMime: row.image_mime,
    imageSize: row.image_size,
    screenshots: screenshotRows.map((shot) => ({
      id: shot.id,
      imageUrl: `/api/projects/file/${encodeURIComponent(shot.image_name)}`,
      originalImageName: shot.original_image_name,
      imageMime: shot.image_mime,
      imageSize: shot.image_size,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatMessage(row: ContactMessageRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

function verifyPasswordHash(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }
  const [, salt, expectedHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(derived, expected);
}

function timingSafeCompareText(a: string, b: string): boolean {
  const digestA = crypto.createHash('sha256').update(a).digest();
  const digestB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

function isAdminConfigured(): boolean {
  const envPasscode = process.env.ADMIN_PASSCODE?.trim();
  if (envPasscode) {
    return true;
  }
  const row = db.prepare('SELECT id FROM admin_auth WHERE id = 1').get() as { id: number } | undefined;
  return Boolean(row);
}

function createSessionToken(): string {
  db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(Date.now());
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  db.prepare('INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?, ?)').run(
    tokenHash,
    Date.now() + SESSION_TTL_MS,
  );
  return token;
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function isAuthenticatedAdmin(req: Request): boolean {
  const token = extractBearerToken(req);
  if (!token) {
    return false;
  }
  const tokenHash = hashToken(token);
  const row = db
    .prepare('SELECT token_hash, expires_at FROM admin_sessions WHERE token_hash = ?')
    .get(tokenHash) as { token_hash: string; expires_at: number } | undefined;

  if (!row || row.expires_at <= Date.now()) {
    if (row) {
      db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(tokenHash);
    }
    return false;
  }
  return true;
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!isAuthenticatedAdmin(req)) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next();
}

function detectSafeFileType(
  buffer: Buffer,
  options: { allowPdf: boolean },
): { ext: string; mime: string } | null {
  if (buffer.length < 12) {
    return null;
  }
  if (
    options.allowPdf &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { ext: 'pdf', mime: 'application/pdf' };
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

function safeResolveUploadPath(fileName: string): string | null {
  if (!/^[a-f0-9-]+\.(pdf|png|jpg|webp)$/.test(fileName)) {
    return null;
  }
  const resolved = path.resolve(UPLOADS_DIR, fileName);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep)) {
    return null;
  }
  return resolved;
}

function safeDeleteStoredFile(fileName: string | null): void {
  if (!fileName) {
    return;
  }
  const resolved = safeResolveUploadPath(fileName);
  if (resolved && fs.existsSync(resolved)) {
    fs.unlinkSync(resolved);
  }
}

function sanitizeOriginalFilename(name: string): string {
  const base = path.basename(name).replace(/[^\w.\- ]+/g, '_').trim();
  return base.slice(0, 120) || 'asset';
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function parseOptionalHttpUrl(
  raw: unknown,
  label: string,
): { ok: true; url: string | null } | { ok: false; error: string } {
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (!trimmed) {
    return { ok: true, url: null };
  }
  if (trimmed.length > 500) {
    return { ok: false, error: `${label} is too long.` };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { ok: false, error: `${label} must start with http:// or https://.` };
    }
    return { ok: true, url: parsed.toString() };
  } catch {
    return { ok: false, error: `Please enter a valid ${label.toLowerCase()}.` };
  }
}

interface ParsedCertificatePayload {
  title: string;
  issuer: string;
  description: string;
  issueDate: string;
  expirationDate: string | null;
  credentialId: string | null;
  verificationUrl: string | null;
  category: string;
  status: 'draft' | 'published';
}

function validateCertificatePayload(
  body: Record<string, unknown>,
): { ok: true; data: ParsedCertificatePayload } | { ok: false; error: string } {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const issuer = typeof body.issuer === 'string' ? body.issuer.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const issueDate = typeof body.issueDate === 'string' ? body.issueDate.trim() : '';
  const expirationRaw = typeof body.expirationDate === 'string' ? body.expirationDate.trim() : '';
  const credentialIdRaw = typeof body.credentialId === 'string' ? body.credentialId.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const statusRaw = typeof body.status === 'string' ? body.status.trim() : 'draft';

  if (title.length < 2 || title.length > 140) {
    return { ok: false, error: 'Certificate title must be between 2 and 140 characters.' };
  }
  if (issuer.length < 2 || issuer.length > 120) {
    return { ok: false, error: 'Issuing organization must be between 2 and 120 characters.' };
  }
  if (description.length < 5 || description.length > 1500) {
    return { ok: false, error: 'Description must be between 5 and 1500 characters.' };
  }
  if (!isValidIsoDate(issueDate)) {
    return { ok: false, error: 'Please provide a valid issue date (YYYY-MM-DD).' };
  }
  let expirationDate: string | null = null;
  if (expirationRaw) {
    if (!isValidIsoDate(expirationRaw)) {
      return { ok: false, error: 'Please provide a valid expiration date (YYYY-MM-DD).' };
    }
    if (expirationRaw < issueDate) {
      return { ok: false, error: 'Expiration date cannot be earlier than issue date.' };
    }
    expirationDate = expirationRaw;
  }
  if (credentialIdRaw.length > 80) {
    return { ok: false, error: 'Credential ID must be 80 characters or fewer.' };
  }

  const verifiedUrl = parseOptionalHttpUrl(body.verificationUrl, 'Verification URL');
  if (!verifiedUrl.ok) {
    return verifiedUrl;
  }

  if (!ALLOWED_CATEGORIES.has(category)) {
    return { ok: false, error: 'Please choose a valid certificate category.' };
  }
  if (statusRaw !== 'draft' && statusRaw !== 'published') {
    return { ok: false, error: 'Publication status must be draft or published.' };
  }

  return {
    ok: true,
    data: {
      title,
      issuer,
      description,
      issueDate,
      expirationDate,
      credentialId: credentialIdRaw || null,
      verificationUrl: verifiedUrl.url,
      category,
      status: statusRaw,
    },
  };
}

interface ParsedProjectPayload {
  title: string;
  description: string;
  problemStatement: string | null;
  myContribution: string | null;
  keyFeatures: string[];
  developmentProcess: string | null;
  technologies: string[];
  githubUrl: string | null;
  liveUrl: string | null;
  projectStatus: 'In Progress' | 'Completed' | 'Archived';
  visibility: 'draft' | 'published';
  featured: boolean;
}

function validateProjectPayload(
  body: Record<string, unknown>,
): { ok: true; data: ParsedProjectPayload } | { ok: false; error: string } {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const problemStatement =
    typeof body.problemStatement === 'string' ? body.problemStatement.trim() : '';
  const myContribution = typeof body.myContribution === 'string' ? body.myContribution.trim() : '';
  const featuresRaw = typeof body.keyFeatures === 'string' ? body.keyFeatures : '';
  const developmentProcess =
    typeof body.developmentProcess === 'string' ? body.developmentProcess.trim() : '';
  const techRaw = typeof body.technologies === 'string' ? body.technologies : '';
  const projectStatus = typeof body.projectStatus === 'string' ? body.projectStatus.trim() : 'Completed';
  const visibility = typeof body.visibility === 'string' ? body.visibility.trim() : 'draft';
  const featured = body.featured === 'true' || body.featured === true;

  if (title.length < 2 || title.length > 140) {
    return { ok: false, error: 'Project title must be between 2 and 140 characters.' };
  }
  if (/voice[-_ ]?helper/i.test(title)) {
    return { ok: false, error: 'Invalid project title.' };
  }
  if (description.length < 10 || description.length > 2000) {
    return { ok: false, error: 'Project description must be between 10 and 2000 characters.' };
  }
  if (problemStatement.length > 2000) {
    return { ok: false, error: 'Problem statement must be 2000 characters or fewer.' };
  }
  if (myContribution.length > 2000) {
    return { ok: false, error: 'Contribution notes must be 2000 characters or fewer.' };
  }
  if (developmentProcess.length > 2500) {
    return { ok: false, error: 'Development process notes must be 2500 characters or fewer.' };
  }

  const keyFeatures = featuresRaw
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter((line) => line.length > 0)
    .slice(0, 15);

  const technologies = techRaw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, 12);

  if (technologies.length === 0) {
    return { ok: false, error: 'Please list at least one technology used.' };
  }

  const githubRes = parseOptionalHttpUrl(body.githubUrl, 'GitHub URL');
  if (!githubRes.ok) return githubRes;

  const liveRes = parseOptionalHttpUrl(body.liveUrl, 'Live Demo URL');
  if (!liveRes.ok) return liveRes;

  if (!ALLOWED_PROJECT_STATUSES.has(projectStatus)) {
    return { ok: false, error: 'Invalid project status.' };
  }
  if (visibility !== 'draft' && visibility !== 'published') {
    return { ok: false, error: 'Visibility must be draft or published.' };
  }

  return {
    ok: true,
    data: {
      title,
      description,
      problemStatement: problemStatement || null,
      myContribution: myContribution || null,
      keyFeatures,
      developmentProcess: developmentProcess || null,
      technologies,
      githubUrl: githubRes.url,
      liveUrl: liveRes.url,
      projectStatus: projectStatus as 'In Progress' | 'Completed' | 'Archived',
      visibility,
      featured,
    },
  };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 5,
  },
});

function handleUploadMiddleware(req: Request, res: Response, next: NextFunction): void {
  upload.single('file')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'Uploaded file exceeds the 5 MB size limit.' });
        return;
      }
      res.status(400).json({ error: 'Invalid file upload request.' });
      return;
    }
    if (err) {
      res.status(400).json({ error: 'Failed to process uploaded file.' });
      return;
    }
    next();
  });
}

function handleProjectUploadMiddleware(req: Request, res: Response, next: NextFunction): void {
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'screenshots', maxCount: 4 },
  ])(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'Each uploaded image must be 5 MB or smaller.' });
        return;
      }
      res.status(400).json({ error: 'Invalid project image upload request (max 4 extra screenshots).' });
      return;
    }
    if (err) {
      res.status(400).json({ error: 'Failed to process project screenshots.' });
      return;
    }
    next();
  });
}

// In-memory rate limiter for contact submissions (5 per 15 min per IP)
const contactRateMap = new Map<string, number[]>();
const CONTACT_WINDOW_MS = 15 * 60 * 1000;
const CONTACT_MAX_PER_WINDOW = 5;

function checkContactRateLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (contactRateMap.get(ip) ?? []).filter((ts) => now - ts < CONTACT_WINDOW_MS);
  if (recent.length >= CONTACT_MAX_PER_WINDOW) {
    contactRateMap.set(ip, recent);
    return false;
  }
  recent.push(now);
  contactRateMap.set(ip, recent);
  return true;
}

let githubReposCache: {
  fetchedAt: number;
  repos: Array<{
    id: number;
    name: string;
    description: string | null;
    htmlUrl: string;
    language: string | null;
    updatedAt: string;
  }>;
} | null = null;

function resolveOrigin(req: Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto =
    typeof forwardedProto === 'string' && forwardedProto.trim()
      ? forwardedProto.split(',')[0].trim()
      : req.protocol || 'https';
  const host = req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function injectSeoMetadata(html: string, req: Request): { html: string; statusCode: number } {
  const origin = resolveOrigin(req);
  const rawPath = req.path || '/';
  const normalized = normalizePathname(rawPath);
  const ogImageUrl = `${origin}${PERSON_IDENTITY.ogImagePath}`;

  let statusCode = 200;
  let title = PUBLIC_ROUTES[0].title;
  let description = PUBLIC_ROUTES[0].description;
  let keywords = PUBLIC_ROUTES[0].keywords;
  let ogType: string = PUBLIC_ROUTES[0].ogType;
  let robots = 'index, follow';
  let canonicalUrl = `${origin}${normalized === '/' ? '' : normalized}` || origin;
  let effectiveOgImage = ogImageUrl;
  let jsonLdGraph: Record<string, unknown> | null = null;

  if (normalized === '/admin') {
    title = ADMIN_ROUTE_META.title;
    description = ADMIN_ROUTE_META.description;
    ogType = 'website';
    robots = 'noindex, nofollow, noarchive';
    canonicalUrl = `${origin}/admin`;
  } else if (normalized.startsWith('/work/') && normalized.length > '/work/'.length) {
    const slugOrId = decodeURIComponent(normalized.slice('/work/'.length));
    const projectRow = db
      .prepare(
        `SELECT * FROM projects
         WHERE visibility = 'published' AND (slug = ? OR id = ?)
         LIMIT 1`,
      )
      .get(slugOrId, slugOrId) as unknown as ProjectRow | undefined;

    if (projectRow) {
      const formatted = formatProject(projectRow);
      title = `${formatted.title} — Software Project | BAMBE Aine Chris`;
      description = formatted.description.slice(0, 160);
      keywords = [
        formatted.title,
        ...formatted.technologies,
        'BAMBE Aine Chris',
        'Ainechris',
        'Software Project',
      ].join(', ');
      ogType = 'article';
      canonicalUrl = `${origin}/work/${encodeURIComponent(formatted.slug)}`;
      effectiveOgImage = resolveAbsoluteAssetUrl(origin, formatted.imageUrl);
      jsonLdGraph = buildProjectJsonLdGraph(origin, formatted);
    } else {
      statusCode = 404;
      title = 'Project Not Found | BAMBE Aine Chris';
      description = 'The requested software project could not be found.';
      ogType = 'website';
      robots = 'noindex, nofollow';
    }
  } else {
    const matched = findPublicRoute(normalized);
    if (matched) {
      title = matched.title;
      description = matched.description;
      keywords = matched.keywords;
      ogType = matched.ogType;
      jsonLdGraph = buildJsonLdGraph(origin, normalized);
    } else {
      statusCode = 404;
      title = 'Page Not Found | BAMBE Aine Chris';
      description = 'Requested page could not be found on BAMBE Aine Chris portfolio.';
      keywords = SITE_KEYWORDS;
      ogType = 'website';
      robots = 'noindex, nofollow';
    }
  }

  const safeTitle = escapeHtmlAttr(title);
  const safeDesc = escapeHtmlAttr(description);
  const safeKeywords = escapeHtmlAttr(keywords);
  const safeCanonical = escapeHtmlAttr(canonicalUrl);
  const safeOgImage = escapeHtmlAttr(effectiveOgImage);
  const safeOgType = escapeHtmlAttr(ogType);

  const extraHeadTags: string[] = [];
  const googleVerify = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  if (googleVerify) {
    extraHeadTags.push(
      `<meta name="google-site-verification" content="${escapeHtmlAttr(googleVerify)}" />`,
    );
  }
  const bingVerify = process.env.BING_SITE_VERIFICATION?.trim();
  if (bingVerify) {
    extraHeadTags.push(`<meta name="msvalidate.01" content="${escapeHtmlAttr(bingVerify)}" />`);
  }

  const jsonLdScript = jsonLdGraph
    ? `<script id="structured-data" type="application/ld+json">${JSON.stringify(jsonLdGraph).replace(
        /</g,
        '\\u003c',
      )}</script>`
    : '';

  let out = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${safeDesc}" />`,
    )
    .replace(
      /<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="keywords" content="${safeKeywords}" />`,
    )
    .replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="robots" content="${robots}" />`,
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${safeCanonical}" />`,
    )
    .replace(
      /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:type" content="${safeOgType}" />`,
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${safeTitle}" />`,
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${safeDesc}" />`,
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:url" content="${safeCanonical}" />`,
    )
    .replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image" content="${safeOgImage}" />`,
    )
    .replace(
      /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:url" content="${safeCanonical}" />`,
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:title" content="${safeTitle}" />`,
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:description" content="${safeDesc}" />`,
    )
    .replace(
      /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:image" content="${safeOgImage}" />`,
    )
    .replace(/<script\s+id="structured-data"\s+type="application\/ld\+json">[\s\S]*?<\/script>/i, jsonLdScript);

  if (!/<link\s+rel="canonical"/i.test(out)) {
    extraHeadTags.push(`<link rel="canonical" href="${safeCanonical}" />`);
  }
  if (jsonLdScript && !/<script\s+id="structured-data"/i.test(out)) {
    extraHeadTags.push(jsonLdScript);
  }
  if (extraHeadTags.length > 0) {
    out = out.replace('</head>', `    ${extraHeadTags.join('\n    ')}\n  </head>`);
  }

  return { html: out, statusCode };
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '1mb' }));

  // Keep private admin APIs and admin page out of search engine indexes
  app.use('/api/admin', (_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    next();
  });

  app.use('/admin', (_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    next();
  });

  // Technical SEO: robots.txt
  app.get('/robots.txt', (req, res) => {
    const origin = resolveOrigin(req);
    res.type('text/plain; charset=utf-8').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /api/admin/',
        '',
        `Sitemap: ${origin}/sitemap.xml`,
      ].join('\n'),
    );
  });

  // Technical SEO: dynamic XML sitemap (includes published /work/:slug project pages)
  app.get('/sitemap.xml', (req, res) => {
    const origin = resolveOrigin(req);
    const today = new Date().toISOString().slice(0, 10);
    const staticUrls = PUBLIC_ROUTES.map((route) => {
      const loc = `${origin}${route.path === '/' ? '' : route.path}` || origin;
      return [
        '  <url>',
        `    <loc>${escapeHtmlAttr(loc)}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${route.changefreq}</changefreq>`,
        `    <priority>${route.priority}</priority>`,
        '  </url>',
      ].join('\n');
    });

    const publishedProjects = db
      .prepare("SELECT id, title, slug, updated_at FROM projects WHERE visibility = 'published'")
      .all() as Array<{ id: string; title: string; slug: string | null; updated_at: string }>;

    const projectUrls = publishedProjects
      .filter((proj) => !/voice[-_ ]?helper/i.test(proj.title || '') && !/voice[-_ ]?helper/i.test(proj.slug || ''))
      .map((proj) => {
        const loc = `${origin}/work/${encodeURIComponent(proj.slug || proj.id)}`;
        const lastmod = proj.updated_at ? proj.updated_at.slice(0, 10) : today;
        return [
          '  <url>',
          `    <loc>${escapeHtmlAttr(loc)}</loc>`,
          `    <lastmod>${lastmod}</lastmod>`,
          '    <changefreq>monthly</changefreq>',
          '    <priority>0.8</priority>',
          '  </url>',
        ].join('\n');
      });

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...staticUrls,
      ...projectUrls,
      '</urlset>',
    ].join('\n');

    res.type('application/xml; charset=utf-8').send(xml);
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Public: Real GitHub Repositories for @Ainechris (filters out Voice Helper)
  app.get('/api/github/repos', async (_req, res) => {
    const now = Date.now();
    if (githubReposCache && now - githubReposCache.fetchedAt < 5 * 60 * 1000) {
      res.json({ repos: githubReposCache.repos });
      return;
    }
    try {
      const response = await fetch(
        'https://api.github.com/users/Ainechris/repos?sort=updated&per_page=8',
        {
          headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'ainechris-portfolio-server',
          },
          signal: AbortSignal.timeout(3500),
        },
      );
      if (!response.ok) {
        res.json({ repos: githubReposCache?.repos ?? [] });
        return;
      }
      const raw = (await response.json()) as Array<{
        id: number;
        name: string;
        description: string | null;
        html_url: string;
        language: string | null;
        updated_at: string;
        fork?: boolean;
      }>;
      const repos = (Array.isArray(raw) ? raw : [])
        .filter((repo) => !repo.fork && !/voice[-_ ]?helper/i.test(repo.name))
        .slice(0, 6)
        .map((repo) => ({
          id: repo.id,
          name: repo.name,
          description: repo.description,
          htmlUrl: repo.html_url,
          language: repo.language,
          updatedAt: repo.updated_at,
        }));
      githubReposCache = { fetchedAt: now, repos };
      res.json({ repos });
    } catch {
      res.json({ repos: githubReposCache?.repos ?? [] });
    }
  });

  // Public: Contact Form Submission
  app.post('/api/contact', (req, res) => {
    const honeypot = typeof req.body?.website === 'string' ? req.body.website.trim() : '';
    if (honeypot) {
      res.status(200).json({ ok: true });
      return;
    }

    const clientIp = req.ip || 'unknown';
    if (!checkContactRateLimit(clientIp)) {
      res.status(429).json({
        error: 'Too many messages sent recently. Please wait a few minutes before trying again.',
      });
      return;
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

    if (name.length < 2 || name.length > 100) {
      res.status(400).json({ error: 'Please enter your name (2–100 characters).' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 150) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (subject.length < 2 || subject.length > 160) {
      res.status(400).json({ error: 'Please enter a subject (2–160 characters).' });
      return;
    }
    if (message.length < 10 || message.length > 3000) {
      res.status(400).json({ error: 'Please write a message between 10 and 3000 characters.' });
      return;
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO contact_messages (id, name, email, subject, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'unread', ?)`,
    ).run(id, name, email, subject, message, createdAt);

    res.status(201).json({ ok: true, id });
  });

  // Admin Auth Routes
  app.get('/api/admin/auth/status', (req, res) => {
    res.json({
      configured: isAdminConfigured(),
      authenticated: isAuthenticatedAdmin(req),
    });
  });

  app.post('/api/admin/auth/setup', (req, res) => {
    if (process.env.ADMIN_PASSCODE?.trim()) {
      res.status(403).json({ error: 'Admin passcode is configured on the server.' });
      return;
    }
    const existing = db.prepare('SELECT id FROM admin_auth WHERE id = 1').get();
    if (existing) {
      res.status(403).json({ error: 'Admin password has already been claimed.' });
      return;
    }

    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (password.length < 8 || password.length > 128) {
      res.status(400).json({ error: 'Password must be between 8 and 128 characters.' });
      return;
    }

    const hash = hashPassword(password);
    try {
      db.prepare('INSERT INTO admin_auth (id, password_hash, created_at) VALUES (1, ?, ?)').run(
        hash,
        new Date().toISOString(),
      );
    } catch {
      res.status(409).json({ error: 'Admin password has already been claimed.' });
      return;
    }

    const token = createSessionToken();
    res.status(201).json({ token });
  });

  app.post('/api/admin/auth/login', (req, res) => {
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!password) {
      res.status(400).json({ error: 'Password is required.' });
      return;
    }

    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (envPasscode) {
      if (!timingSafeCompareText(password, envPasscode)) {
        res.status(401).json({ error: 'Invalid admin password.' });
        return;
      }
      const token = createSessionToken();
      res.json({ token });
      return;
    }

    const row = db
      .prepare('SELECT password_hash FROM admin_auth WHERE id = 1')
      .get() as { password_hash: string } | undefined;
    if (!row) {
      res.status(400).json({ error: 'Admin account is not set up yet.' });
      return;
    }
    if (!verifyPasswordHash(password, row.password_hash)) {
      res.status(401).json({ error: 'Invalid admin password.' });
      return;
    }

    const token = createSessionToken();
    res.json({ token });
  });

  app.post('/api/admin/auth/logout', (req, res) => {
    const token = extractBearerToken(req);
    if (token) {
      db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(hashToken(token));
    }
    res.json({ ok: true });
  });

  // Public: Published Projects
  app.get('/api/projects', (_req, res) => {
    const rows = db
      .prepare(
        `SELECT * FROM projects
         WHERE visibility = 'published'
         ORDER BY featured DESC, created_at DESC`,
      )
      .all() as unknown as ProjectRow[];

    res.json({ projects: rows.map(formatProject) });
  });

  // Public: Single Published Project Details by slug or id
  app.get('/api/projects/:slugOrId', (req, res) => {
    const key = req.params.slugOrId;
    const row = db
      .prepare(
        `SELECT * FROM projects
         WHERE visibility = 'published' AND (slug = ? OR id = ?)
         LIMIT 1`,
      )
      .get(key, key) as unknown as ProjectRow | undefined;

    if (!row) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    res.json({ project: formatProject(row) });
  });

  // Protected Project Image Serving (cover image or gallery screenshot)
  app.get('/api/projects/file/:filename', (req, res) => {
    const fileName = req.params.filename;
    const resolved = safeResolveUploadPath(fileName);
    if (!resolved) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }

    let row = db
      .prepare(
        'SELECT visibility, image_mime, original_image_name FROM projects WHERE image_name = ?',
      )
      .get(fileName) as
      | { visibility: 'draft' | 'published'; image_mime: string | null; original_image_name: string | null }
      | undefined;

    if (!row) {
      row = db
        .prepare(
          `SELECT p.visibility AS visibility, s.image_mime AS image_mime, s.original_image_name AS original_image_name
           FROM project_screenshots s
           JOIN projects p ON p.id = s.project_id
           WHERE s.image_name = ?`,
        )
        .get(fileName) as
        | {
            visibility: 'draft' | 'published';
            image_mime: string | null;
            original_image_name: string | null;
          }
        | undefined;
    }

    if (!row) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }

    if (row.visibility !== 'published' && !isAuthenticatedAdmin(req)) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }

    if (!fs.existsSync(resolved)) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }

    const safeDisplayName = sanitizeOriginalFilename(row.original_image_name || fileName);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
      'Cache-Control',
      row.visibility === 'published' ? 'public, max-age=300' : 'private, no-store',
    );
    res.setHeader('Content-Type', row.image_mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${safeDisplayName}"`);
    res.sendFile(resolved);
  });

  // Admin: Projects CRUD
  app.get('/api/admin/projects', requireAdmin, (_req, res) => {
    const rows = db
      .prepare('SELECT * FROM projects ORDER BY featured DESC, created_at DESC')
      .all() as unknown as ProjectRow[];

    res.json({ projects: rows.map(formatProject) });
  });

  app.post('/api/admin/projects', requireAdmin, handleProjectUploadMiddleware, (req, res) => {
    const validation = validateProjectPayload((req.body ?? {}) as Record<string, unknown>);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const uploadedFiles = (req.files ?? {}) as {
      file?: Express.Multer.File[];
      screenshots?: Express.Multer.File[];
    };
    const coverFile = uploadedFiles.file?.[0] ?? null;
    const galleryFiles = uploadedFiles.screenshots ?? [];

    const writtenFiles: string[] = [];
    let imageName: string | null = null;
    let originalImageName: string | null = null;
    let imageMime: string | null = null;
    let imageSize: number | null = null;

    if (coverFile) {
      const detected = detectSafeFileType(coverFile.buffer, { allowPdf: false });
      if (!detected) {
        res.status(400).json({
          error: 'Unsupported cover image format. Please upload PNG, JPG, or WEBP.',
        });
        return;
      }
      imageName = `${crypto.randomUUID()}.${detected.ext}`;
      const targetPath = safeResolveUploadPath(imageName);
      if (!targetPath) {
        res.status(500).json({ error: 'Could not allocate storage path.' });
        return;
      }
      fs.writeFileSync(targetPath, coverFile.buffer);
      writtenFiles.push(imageName);
      originalImageName = sanitizeOriginalFilename(coverFile.originalname);
      imageMime = detected.mime;
      imageSize = coverFile.buffer.length;
    }

    const galleryEntries: Array<{
      id: string;
      imageName: string;
      originalImageName: string;
      imageMime: string;
      imageSize: number;
    }> = [];

    for (const file of galleryFiles) {
      const detected = detectSafeFileType(file.buffer, { allowPdf: false });
      if (!detected) {
        for (const f of writtenFiles) safeDeleteStoredFile(f);
        res.status(400).json({
          error: 'Unsupported screenshot format. Please upload PNG, JPG, or WEBP images.',
        });
        return;
      }
      const storedName = `${crypto.randomUUID()}.${detected.ext}`;
      const targetPath = safeResolveUploadPath(storedName);
      if (!targetPath) {
        for (const f of writtenFiles) safeDeleteStoredFile(f);
        res.status(500).json({ error: 'Could not allocate screenshot storage path.' });
        return;
      }
      fs.writeFileSync(targetPath, file.buffer);
      writtenFiles.push(storedName);
      galleryEntries.push({
        id: crypto.randomUUID(),
        imageName: storedName,
        originalImageName: sanitizeOriginalFilename(file.originalname),
        imageMime: detected.mime,
        imageSize: file.buffer.length,
      });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const d = validation.data;
    const slug = makeUniqueProjectSlug(d.title);

    try {
      db.prepare(
        `INSERT INTO projects (
          id, slug, title, description, problem_statement, my_contribution,
          key_features, development_process, technologies, github_url, live_url,
          project_status, visibility, featured,
          image_name, original_image_name, image_mime, image_size,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        slug,
        d.title,
        d.description,
        d.problemStatement,
        d.myContribution,
        JSON.stringify(d.keyFeatures),
        d.developmentProcess,
        JSON.stringify(d.technologies),
        d.githubUrl,
        d.liveUrl,
        d.projectStatus,
        d.visibility,
        d.featured ? 1 : 0,
        imageName,
        originalImageName,
        imageMime,
        imageSize,
        now,
        now,
      );

      galleryEntries.forEach((entry, index) => {
        db.prepare(
          `INSERT INTO project_screenshots (
            id, project_id, image_name, original_image_name, image_mime, image_size, sort_order, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          entry.id,
          id,
          entry.imageName,
          entry.originalImageName,
          entry.imageMime,
          entry.imageSize,
          index,
          now,
        );
      });
    } catch {
      for (const f of writtenFiles) safeDeleteStoredFile(f);
      res.status(500).json({ error: 'Failed to create project.' });
      return;
    }

    const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as unknown as ProjectRow;
    res.status(201).json({ project: formatProject(created) });
  });

  app.put('/api/admin/projects/:id', requireAdmin, handleProjectUploadMiddleware, (req, res) => {
    const existing = db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(req.params.id) as unknown as ProjectRow | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const validation = validateProjectPayload((req.body ?? {}) as Record<string, unknown>);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const uploadedFiles = (req.files ?? {}) as {
      file?: Express.Multer.File[];
      screenshots?: Express.Multer.File[];
    };
    const coverFile = uploadedFiles.file?.[0] ?? null;
    const galleryFiles = uploadedFiles.screenshots ?? [];

    const removeImage = req.body?.removeImage === 'true';
    let nextImageName = existing.image_name;
    let nextOriginalName = existing.original_image_name;
    let nextMime = existing.image_mime;
    let nextSize = existing.image_size;
    const newlyWrittenFiles: string[] = [];
    const oldFilesToDelete: string[] = [];

    if (coverFile) {
      const detected = detectSafeFileType(coverFile.buffer, { allowPdf: false });
      if (!detected) {
        res.status(400).json({
          error: 'Unsupported cover image format. Please upload PNG, JPG, or WEBP.',
        });
        return;
      }
      const coverStored = `${crypto.randomUUID()}.${detected.ext}`;
      const targetPath = safeResolveUploadPath(coverStored);
      if (!targetPath) {
        res.status(500).json({ error: 'Could not allocate storage path.' });
        return;
      }
      fs.writeFileSync(targetPath, coverFile.buffer);
      newlyWrittenFiles.push(coverStored);
      if (existing.image_name) oldFilesToDelete.push(existing.image_name);
      nextImageName = coverStored;
      nextOriginalName = sanitizeOriginalFilename(coverFile.originalname);
      nextMime = detected.mime;
      nextSize = coverFile.buffer.length;
    } else if (removeImage) {
      if (existing.image_name) oldFilesToDelete.push(existing.image_name);
      nextImageName = null;
      nextOriginalName = null;
      nextMime = null;
      nextSize = null;
    }

    const newGalleryEntries: Array<{
      id: string;
      imageName: string;
      originalImageName: string;
      imageMime: string;
      imageSize: number;
    }> = [];

    for (const file of galleryFiles) {
      const detected = detectSafeFileType(file.buffer, { allowPdf: false });
      if (!detected) {
        for (const f of newlyWrittenFiles) safeDeleteStoredFile(f);
        res.status(400).json({
          error: 'Unsupported screenshot format. Please upload PNG, JPG, or WEBP images.',
        });
        return;
      }
      const storedName = `${crypto.randomUUID()}.${detected.ext}`;
      const targetPath = safeResolveUploadPath(storedName);
      if (!targetPath) {
        for (const f of newlyWrittenFiles) safeDeleteStoredFile(f);
        res.status(500).json({ error: 'Could not allocate screenshot storage path.' });
        return;
      }
      fs.writeFileSync(targetPath, file.buffer);
      newlyWrittenFiles.push(storedName);
      newGalleryEntries.push({
        id: crypto.randomUUID(),
        imageName: storedName,
        originalImageName: sanitizeOriginalFilename(file.originalname),
        imageMime: detected.mime,
        imageSize: file.buffer.length,
      });
    }

    let removedScreenshotIds: string[] = [];
    if (typeof req.body?.removedScreenshotIds === 'string' && req.body.removedScreenshotIds.trim()) {
      try {
        const parsed = JSON.parse(req.body.removedScreenshotIds);
        if (Array.isArray(parsed)) {
          removedScreenshotIds = parsed.filter((v): v is string => typeof v === 'string');
        }
      } catch {
        removedScreenshotIds = [];
      }
    }

    const d = validation.data;
    const now = new Date().toISOString();
    const nextSlug =
      existing.title === d.title && existing.slug
        ? existing.slug
        : makeUniqueProjectSlug(d.title, existing.id);

    try {
      db.prepare(
        `UPDATE projects SET
          slug = ?, title = ?, description = ?, problem_statement = ?, my_contribution = ?,
          key_features = ?, development_process = ?, technologies = ?, github_url = ?, live_url = ?,
          project_status = ?, visibility = ?, featured = ?,
          image_name = ?, original_image_name = ?, image_mime = ?, image_size = ?,
          updated_at = ?
        WHERE id = ?`,
      ).run(
        nextSlug,
        d.title,
        d.description,
        d.problemStatement,
        d.myContribution,
        JSON.stringify(d.keyFeatures),
        d.developmentProcess,
        JSON.stringify(d.technologies),
        d.githubUrl,
        d.liveUrl,
        d.projectStatus,
        d.visibility,
        d.featured ? 1 : 0,
        nextImageName,
        nextOriginalName,
        nextMime,
        nextSize,
        now,
        existing.id,
      );

      for (const shotId of removedScreenshotIds) {
        const shot = db
          .prepare('SELECT image_name FROM project_screenshots WHERE id = ? AND project_id = ?')
          .get(shotId, existing.id) as { image_name: string } | undefined;
        if (shot) {
          db.prepare('DELETE FROM project_screenshots WHERE id = ?').run(shotId);
          oldFilesToDelete.push(shot.image_name);
        }
      }

      const maxOrderRow = db
        .prepare('SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM project_screenshots WHERE project_id = ?')
        .get(existing.id) as { max_order: number };
      let nextOrder = (maxOrderRow?.max_order ?? -1) + 1;

      for (const entry of newGalleryEntries) {
        db.prepare(
          `INSERT INTO project_screenshots (
            id, project_id, image_name, original_image_name, image_mime, image_size, sort_order, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          entry.id,
          existing.id,
          entry.imageName,
          entry.originalImageName,
          entry.imageMime,
          entry.imageSize,
          nextOrder,
          now,
        );
        nextOrder += 1;
      }
    } catch {
      for (const f of newlyWrittenFiles) safeDeleteStoredFile(f);
      res.status(500).json({ error: 'Failed to update project.' });
      return;
    }

    for (const f of oldFilesToDelete) safeDeleteStoredFile(f);
    const updated = db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(existing.id) as unknown as ProjectRow;
    res.json({ project: formatProject(updated) });
  });

  app.delete('/api/admin/projects/:id', requireAdmin, (req, res) => {
    const existing = db
      .prepare('SELECT image_name FROM projects WHERE id = ?')
      .get(req.params.id) as { image_name: string | null } | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const screenshots = db
      .prepare('SELECT image_name FROM project_screenshots WHERE project_id = ?')
      .all(req.params.id) as Array<{ image_name: string }>;

    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    safeDeleteStoredFile(existing.image_name);
    for (const shot of screenshots) {
      safeDeleteStoredFile(shot.image_name);
    }
    res.json({ ok: true });
  });

  // Public: Published Certificates
  app.get('/api/certificates', (_req, res) => {
    const rows = db
      .prepare(
        `SELECT * FROM certificates
         WHERE status = 'published'
         ORDER BY issue_date DESC, created_at DESC`,
      )
      .all() as unknown as CertificateRow[];

    res.json({ certificates: rows.map(formatCertificate) });
  });

  app.get('/api/certificates/file/:filename', (req, res) => {
    const fileName = req.params.filename;
    const resolved = safeResolveUploadPath(fileName);
    if (!resolved) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }

    const row = db
      .prepare(
        'SELECT status, file_mime, original_file_name FROM certificates WHERE file_name = ?',
      )
      .get(fileName) as
      | { status: 'draft' | 'published'; file_mime: string | null; original_file_name: string | null }
      | undefined;

    if (!row) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }

    if (row.status !== 'published' && !isAuthenticatedAdmin(req)) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }

    if (!fs.existsSync(resolved)) {
      res.status(404).json({ error: 'File not found on disk.' });
      return;
    }

    const safeDisplayName = sanitizeOriginalFilename(row.original_file_name || fileName);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
      'Cache-Control',
      row.status === 'published' ? 'public, max-age=300' : 'private, no-store',
    );
    res.setHeader('Content-Type', row.file_mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${safeDisplayName}"`);
    res.sendFile(resolved);
  });

  // Admin: Certificates CRUD
  app.get('/api/admin/certificates', requireAdmin, (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : 'all';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : 'all';
    const sort = req.query.sort === 'oldest' ? 'ASC' : 'DESC';

    const clauses: string[] = [];
    const params: Array<string> = [];

    if (search) {
      clauses.push(
        '(LOWER(title) LIKE ? OR LOWER(issuer) LIKE ? OR LOWER(COALESCE(credential_id, \'\')) LIKE ?)',
      );
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    if (category && category !== 'all' && ALLOWED_CATEGORIES.has(category)) {
      clauses.push('category = ?');
      params.push(category);
    }

    if (status === 'published' || status === 'draft') {
      clauses.push('status = ?');
      params.push(status);
    }

    const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = db
      .prepare(
        `SELECT * FROM certificates ${whereSql} ORDER BY issue_date ${sort}, created_at ${sort}`,
      )
      .all(...params) as unknown as CertificateRow[];

    const counts = db
      .prepare(
        `SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft
        FROM certificates`,
      )
      .get() as { total: number; published: number | null; draft: number | null };

    res.json({
      certificates: rows.map(formatCertificate),
      stats: {
        total: counts.total ?? 0,
        published: counts.published ?? 0,
        draft: counts.draft ?? 0,
      },
    });
  });

  app.post('/api/admin/certificates', requireAdmin, handleUploadMiddleware, (req, res) => {
    const validation = validateCertificatePayload((req.body ?? {}) as Record<string, unknown>);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    let storedFileName: string | null = null;
    let originalFileName: string | null = null;
    let fileMime: string | null = null;
    let fileSize: number | null = null;

    if (req.file) {
      const detected = detectSafeFileType(req.file.buffer, { allowPdf: true });
      if (!detected) {
        res.status(400).json({
          error:
            'Unsupported file content. Only valid PNG, JPG, WEBP images or PDF documents are allowed.',
        });
        return;
      }
      storedFileName = `${crypto.randomUUID()}.${detected.ext}`;
      const targetPath = safeResolveUploadPath(storedFileName);
      if (!targetPath) {
        res.status(500).json({ error: 'Could not allocate safe storage path.' });
        return;
      }
      fs.writeFileSync(targetPath, req.file.buffer);
      originalFileName = sanitizeOriginalFilename(req.file.originalname);
      fileMime = detected.mime;
      fileSize = req.file.buffer.length;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const d = validation.data;

    try {
      db.prepare(
        `INSERT INTO certificates (
          id, title, issuer, description, issue_date, expiration_date,
          credential_id, verification_url, category, status,
          file_name, original_file_name, file_mime, file_size,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        d.title,
        d.issuer,
        d.description,
        d.issueDate,
        d.expirationDate,
        d.credentialId,
        d.verificationUrl,
        d.category,
        d.status,
        storedFileName,
        originalFileName,
        fileMime,
        fileSize,
        now,
        now,
      );
    } catch {
      safeDeleteStoredFile(storedFileName);
      res.status(500).json({ error: 'Failed to save certificate.' });
      return;
    }

    const created = db
      .prepare('SELECT * FROM certificates WHERE id = ?')
      .get(id) as unknown as CertificateRow;
    res.status(201).json({ certificate: formatCertificate(created) });
  });

  app.put('/api/admin/certificates/:id', requireAdmin, handleUploadMiddleware, (req, res) => {
    const existing = db
      .prepare('SELECT * FROM certificates WHERE id = ?')
      .get(req.params.id) as unknown as CertificateRow | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Certificate not found.' });
      return;
    }

    const validation = validateCertificatePayload((req.body ?? {}) as Record<string, unknown>);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const removeExistingFile = req.body?.removeFile === 'true';
    let nextFileName = existing.file_name;
    let nextOriginalName = existing.original_file_name;
    let nextMime = existing.file_mime;
    let nextSize = existing.file_size;
    let newlyUploadedFile: string | null = null;
    let oldFileToDelete: string | null = null;

    if (req.file) {
      const detected = detectSafeFileType(req.file.buffer, { allowPdf: true });
      if (!detected) {
        res.status(400).json({
          error:
            'Unsupported file content. Only valid PNG, JPG, WEBP images or PDF documents are allowed.',
        });
        return;
      }
      newlyUploadedFile = `${crypto.randomUUID()}.${detected.ext}`;
      const targetPath = safeResolveUploadPath(newlyUploadedFile);
      if (!targetPath) {
        res.status(500).json({ error: 'Could not allocate safe storage path.' });
        return;
      }
      fs.writeFileSync(targetPath, req.file.buffer);
      oldFileToDelete = existing.file_name;
      nextFileName = newlyUploadedFile;
      nextOriginalName = sanitizeOriginalFilename(req.file.originalname);
      nextMime = detected.mime;
      nextSize = req.file.buffer.length;
    } else if (removeExistingFile) {
      oldFileToDelete = existing.file_name;
      nextFileName = null;
      nextOriginalName = null;
      nextMime = null;
      nextSize = null;
    }

    const d = validation.data;
    const now = new Date().toISOString();

    try {
      db.prepare(
        `UPDATE certificates SET
          title = ?, issuer = ?, description = ?, issue_date = ?, expiration_date = ?,
          credential_id = ?, verification_url = ?, category = ?, status = ?,
          file_name = ?, original_file_name = ?, file_mime = ?, file_size = ?,
          updated_at = ?
        WHERE id = ?`,
      ).run(
        d.title,
        d.issuer,
        d.description,
        d.issueDate,
        d.expirationDate,
        d.credentialId,
        d.verificationUrl,
        d.category,
        d.status,
        nextFileName,
        nextOriginalName,
        nextMime,
        nextSize,
        now,
        existing.id,
      );
    } catch {
      safeDeleteStoredFile(newlyUploadedFile);
      res.status(500).json({ error: 'Failed to update certificate.' });
      return;
    }

    safeDeleteStoredFile(oldFileToDelete);

    const updated = db
      .prepare('SELECT * FROM certificates WHERE id = ?')
      .get(existing.id) as unknown as CertificateRow;
    res.json({ certificate: formatCertificate(updated) });
  });

  app.patch('/api/admin/certificates/:id/status', requireAdmin, (req, res) => {
    const status = req.body?.status;
    if (status !== 'draft' && status !== 'published') {
      res.status(400).json({ error: 'Status must be draft or published.' });
      return;
    }

    const result = db
      .prepare('UPDATE certificates SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, new Date().toISOString(), req.params.id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Certificate not found.' });
      return;
    }

    const updated = db
      .prepare('SELECT * FROM certificates WHERE id = ?')
      .get(req.params.id) as unknown as CertificateRow;
    res.json({ certificate: formatCertificate(updated) });
  });

  app.delete('/api/admin/certificates/:id', requireAdmin, (req, res) => {
    const existing = db
      .prepare('SELECT file_name FROM certificates WHERE id = ?')
      .get(req.params.id) as { file_name: string | null } | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Certificate not found.' });
      return;
    }

    db.prepare('DELETE FROM certificates WHERE id = ?').run(req.params.id);
    safeDeleteStoredFile(existing.file_name);
    res.json({ ok: true });
  });

  // Admin: Contact Messages Management
  app.get('/api/admin/messages', requireAdmin, (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : 'all';
    const whereSql = status === 'unread' || status === 'read' ? 'WHERE status = ?' : '';
    const rows = (
      whereSql
        ? db.prepare(`SELECT * FROM contact_messages ${whereSql} ORDER BY created_at DESC`).all(status)
        : db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all()
    ) as unknown as ContactMessageRow[];

    const counts = db
      .prepare(
        `SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) AS unread
        FROM contact_messages`,
      )
      .get() as { total: number; unread: number | null };

    res.json({
      messages: rows.map(formatMessage),
      stats: {
        total: counts.total ?? 0,
        unread: counts.unread ?? 0,
      },
    });
  });

  app.patch('/api/admin/messages/:id/status', requireAdmin, (req, res) => {
    const status = req.body?.status;
    if (status !== 'read' && status !== 'unread') {
      res.status(400).json({ error: 'Status must be read or unread.' });
      return;
    }
    const result = db
      .prepare('UPDATE contact_messages SET status = ? WHERE id = ?')
      .run(status, req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Message not found.' });
      return;
    }
    const updated = db
      .prepare('SELECT * FROM contact_messages WHERE id = ?')
      .get(req.params.id) as unknown as ContactMessageRow;
    res.json({ message: formatMessage(updated) });
  });

  app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
    const result = db.prepare('DELETE FROM contact_messages WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Message not found.' });
      return;
    }
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      try {
        const rawTemplate = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        const transformed = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
        const { html, statusCode } = injectSeoMetadata(transformed, req);
        res.status(statusCode).type('text/html; charset=utf-8').send(html);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir, { index: false }));
    app.get('*', (req, res) => {
      const rawHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
      const { html, statusCode } = injectSeoMetadata(rawHtml, req);
      res.status(statusCode).type('text/html; charset=utf-8').send(html);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Portfolio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
