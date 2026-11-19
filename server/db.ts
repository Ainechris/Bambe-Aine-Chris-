import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'portfolio.db');
export const db = new DatabaseSync(DB_PATH);

export interface ProfileRecord {
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

export interface ProjectRecord {
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

export interface VideoRecord {
  id: number;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  sortOrder: number;
  createdAt: string;
}

export interface MessageRecord {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      full_name TEXT NOT NULL,
      brand_name TEXT NOT NULL,
      title TEXT NOT NULL,
      direction TEXT NOT NULL,
      education TEXT NOT NULL,
      intro_short TEXT NOT NULL,
      intro_long TEXT NOT NULL,
      email TEXT NOT NULL,
      github_url TEXT NOT NULL,
      youtube_url TEXT NOT NULL,
      instagram_url TEXT NOT NULL,
      tiktok_url TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_number TEXT NOT NULL,
      name TEXT NOT NULL,
      full_name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      technologies_json TEXT NOT NULL,
      features_json TEXT NOT NULL,
      repo_url TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      video_url TEXT NOT NULL,
      thumbnail_url TEXT NOT NULL,
      category TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  const defaultShort =
    "I'm a Student Software Developer at Intango TSS (L4 SOD) working toward becoming a Backend Developer. I build practical web software including SAMS and REST APIs.";
  const defaultLong =
    "I’m Bambe Aine Chris, a Student Software Developer at Intango TSS (L4 SOD) in Busanza, Nyarutarama, Rwanda, focused on building a career in backend development. Through coursework and practical projects like SAMS, Express.js APIs, and relational database modeling, I explore how server-side logic and clean interfaces work together reliably.";
  const defaultEdu =
    'Intango TSS — L4 SOD (Software Development), Busanza, Nyarutarama, Rwanda (CLA)';

  const profileRow = db.prepare('SELECT * FROM profile WHERE id = 1').get() as
    | Record<string, unknown>
    | undefined;
  if (!profileRow) {
    db.prepare(`
      INSERT INTO profile (
        id, full_name, brand_name, title, direction, education,
        intro_short, intro_long, email, github_url, youtube_url, instagram_url, tiktok_url, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Bambe Aine Chris',
      'Bambe Aine Chris',
      'STUDENT SOFTWARE DEVELOPER · ASPIRING BACKEND DEVELOPER',
      'BACKEND DEVELOPMENT · SOFTWARE ENGINEERING · WEB SYSTEMS',
      defaultEdu,
      defaultShort,
      defaultLong,
      'ainechrisb@gmail.com',
      'https://github.com/Ainechris',
      'https://www.youtube.com/@VazukoYT',
      'https://www.instagram.com/__aine_.23/',
      '',
      new Date().toISOString()
    );
  } else {
    db.prepare(
      "UPDATE profile SET full_name = 'Bambe Aine Chris', brand_name = 'Bambe Aine Chris' WHERE id = 1 AND brand_name = 'AC BAMBE AINE CHRIS'"
    ).run();

    // Idempotently upgrade unmodified starter seed values to reflect the verified profile
    if (String(profileRow.education) === 'Intango TSS — L4 Software Development') {
      db.prepare('UPDATE profile SET education = ? WHERE id = 1').run(defaultEdu);
    }
    if (String(profileRow.title) === 'STUDENT SOFTWARE DEVELOPER') {
      db.prepare('UPDATE profile SET title = ? WHERE id = 1').run(
        'STUDENT SOFTWARE DEVELOPER · ASPIRING BACKEND DEVELOPER'
      );
    }
    if (String(profileRow.direction) === 'SOFTWARE DEVELOPMENT / BACKEND DEVELOPMENT') {
      db.prepare('UPDATE profile SET direction = ? WHERE id = 1').run(
        'BACKEND DEVELOPMENT · SOFTWARE ENGINEERING · WEB SYSTEMS'
      );
    }
    if (
      String(profileRow.intro_short).includes("This is where I share what I'm learning") ||
      String(profileRow.intro_short).includes('Voice Helper')
    ) {
      db.prepare('UPDATE profile SET intro_short = ? WHERE id = 1').run(defaultShort);
    }
    if (
      String(profileRow.intro_long).includes('This portfolio brings together my current skills') ||
      String(profileRow.intro_long).includes('Voice Helper')
    ) {
      db.prepare('UPDATE profile SET intro_long = ? WHERE id = 1').run(defaultLong);
    }
  }

  // Remove Voice Helper if present from earlier seed versions
  db.prepare("DELETE FROM projects WHERE lower(name) = 'voice helper'").run();

  // Ensure SAMS leads cleanly as 01
  const samsRow = db.prepare("SELECT id FROM projects WHERE lower(name) = 'sams'").get();
  if (!samsRow) {
    db.prepare(`
      INSERT INTO projects (
        project_number, name, full_name, category, description,
        technologies_json, features_json, repo_url, image_url, featured, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      '01',
      'SAMS',
      'School Attendance Management System',
      'BACKEND & WEB SYSTEMS',
      'SAMS is a Flask and SQLite school attendance management system designed to support gate check-ins, active sessions, and administrative and security workflows.',
      JSON.stringify(['Python', 'Flask', 'SQLite', 'HTML5', 'CSS3']),
      JSON.stringify([
        'Student check-in kiosk',
        'Administrator workspace',
        'Security workspace',
        'Controlled gate sessions',
        'Student portal',
      ]),
      'https://github.com/Ainechris/SAMS-ORIGNAL',
      '',
      1,
      new Date().toISOString()
    );
  } else {
    db.prepare(
      "UPDATE projects SET project_number = '01' WHERE lower(name) = 'sams' AND project_number = '02'"
    ).run();
  }

  // Ensure 3 featured project cards exist (02 Portfolio & Inbox API, 03 MySQL & Backend Practice)
  const portfolioApiRow = db
    .prepare("SELECT id FROM projects WHERE lower(name) = 'portfolio & inbox api'")
    .get();
  if (!portfolioApiRow) {
    db.prepare(`
      INSERT INTO projects (
        project_number, name, full_name, category, description,
        technologies_json, features_json, repo_url, image_url, featured, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      '02',
      'Portfolio & Inbox API',
      'Full-Stack Express & SQLite Web System',
      'NODE.JS & EXPRESS.JS',
      'Personal developer portfolio powered by Node.js, Express.js, and SQLite with REST endpoints, contact message persistence, and session-protected admin updates.',
      JSON.stringify(['Node.js', 'Express.js', 'TypeScript', 'SQLite']),
      JSON.stringify([
        'Structured /api/profile, /api/projects, and /api/videos REST routes',
        'Contact form validation and persistent SQLite message inbox',
        'Session-protected admin management workspace',
      ]),
      'https://github.com/Ainechris',
      '',
      1,
      new Date().toISOString()
    );
  }

  const mysqlPracticeRow = db
    .prepare("SELECT id FROM projects WHERE lower(name) = 'mysql & backend practice'")
    .get();
  if (!mysqlPracticeRow) {
    db.prepare(`
      INSERT INTO projects (
        project_number, name, full_name, category, description,
        technologies_json, features_json, repo_url, image_url, featured, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      '03',
      'MySQL & Backend Practice',
      'Relational Schema & REST Validation Lab',
      'DATABASE & API PRACTICE',
      'Structured backend practice building normalized MySQL tables, foreign-key relationships, request validation middleware, and modular Express.js routes.',
      JSON.stringify(['Node.js', 'Express.js', 'MySQL', 'Git']),
      JSON.stringify([
        'Normalized relational table schemas and join queries',
        'Server-side request validation and clean error responses',
        'Git branch workflow for iterative feature testing',
      ]),
      'https://github.com/Ainechris',
      '',
      1,
      new Date().toISOString()
    );
  }

  const videoCount = db.prepare('SELECT COUNT(*) as cnt FROM videos').get() as { cnt: number };
  if (videoCount.cnt === 0) {
    const insertVideo = db.prepare(`
      INSERT INTO videos (title, video_url, thumbnail_url, category, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    insertVideo.run(
      'Stuck In School ALL NIGHT... 😨🚪',
      'https://www.youtube.com/watch?v=HVfyhj9w1tw',
      'https://i.ytimg.com/vi/HVfyhj9w1tw/hqdefault.jpg',
      'ROBLOX STORY',
      1,
      now
    );
    insertVideo.run(
      'Someone SHOVELED Our Street Every Morning... ❄️',
      'https://www.youtube.com/watch?v=B7TzSMoOuMg',
      'https://i.ytimg.com/vi/B7TzSMoOuMg/hqdefault.jpg',
      'ROBLOX STORY',
      2,
      now
    );
    insertVideo.run(
      'Why did she put our money in the bread? 😨',
      'https://www.youtube.com/watch?v=zhjeRMYLRFg',
      'https://i.ytimg.com/vi/zhjeRMYLRFg/hqdefault.jpg',
      'ROBLOX STORY',
      3,
      now
    );
  }
}

export function getProfile(): ProfileRecord {
  const row = db.prepare('SELECT * FROM profile WHERE id = 1').get() as Record<string, unknown>;
  return {
    id: Number(row.id),
    fullName: String(row.full_name),
    brandName: String(row.brand_name),
    title: String(row.title),
    direction: String(row.direction),
    education: String(row.education),
    introShort: String(row.intro_short),
    introLong: String(row.intro_long),
    email: String(row.email),
    githubUrl: String(row.github_url),
    youtubeUrl: String(row.youtube_url),
    instagramUrl: String(row.instagram_url),
    tiktokUrl: String(row.tiktok_url || ''),
    updatedAt: String(row.updated_at),
  };
}

export function listProjects(): ProjectRecord[] {
  const rows = db
    .prepare('SELECT * FROM projects ORDER BY featured DESC, project_number ASC, id ASC')
    .all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: Number(r.id),
    projectNumber: String(r.project_number),
    name: String(r.name),
    fullName: String(r.full_name),
    category: String(r.category),
    description: String(r.description),
    technologies: JSON.parse(String(r.technologies_json || '[]')) as string[],
    features: JSON.parse(String(r.features_json || '[]')) as string[],
    repoUrl: String(r.repo_url),
    imageUrl: String(r.image_url || ''),
    featured: Number(r.featured) === 1,
    createdAt: String(r.created_at),
  }));
}

export function listVideos(): VideoRecord[] {
  const rows = db
    .prepare('SELECT * FROM videos ORDER BY sort_order ASC, id ASC')
    .all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: Number(r.id),
    title: String(r.title),
    videoUrl: String(r.video_url),
    thumbnailUrl: String(r.thumbnail_url),
    category: String(r.category),
    sortOrder: Number(r.sort_order),
    createdAt: String(r.created_at),
  }));
}

export function listMessages(): MessageRecord[] {
  const rows = db
    .prepare('SELECT * FROM messages ORDER BY id DESC')
    .all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    email: String(r.email),
    subject: String(r.subject),
    message: String(r.message),
    isRead: Number(r.is_read) === 1,
    createdAt: String(r.created_at),
  }));
}
