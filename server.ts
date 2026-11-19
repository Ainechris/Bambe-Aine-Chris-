import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  db,
  getProfile,
  initDatabase,
  listMessages,
  listProjects,
  listVideos,
} from './server/db.ts';
import {
  clearSessionCookie,
  createSessionToken,
  isRequestAuthenticated,
  requireAdmin,
  setSessionCookie,
  verifyAdminPassword,
} from './server/auth.ts';

initDatabase();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '2mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Technical SEO: robots.txt and sitemap.xml
app.get('/robots.txt', (req, res) => {
  const origin =
    process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
      ? process.env.APP_URL.replace(/\/+$/, '')
      : `${req.protocol}://${req.get('host')}`;
  res
    .type('text/plain')
    .send(`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${origin}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const origin =
    process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
      ? process.env.APP_URL.replace(/\/+$/, '')
      : `${req.protocol}://${req.get('host')}`;
  const today = new Date().toISOString().split('T')[0];
  const routes = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/about', priority: '0.8', changefreq: 'monthly' },
    { path: '/skills', priority: '0.8', changefreq: 'monthly' },
    { path: '/projects', priority: '0.9', changefreq: 'weekly' },
    { path: '/youtube', priority: '0.7', changefreq: 'weekly' },
    { path: '/contact', priority: '0.8', changefreq: 'monthly' },
  ];
  const urls = routes
    .map(
      (r) => `  <url>
    <loc>${origin}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
    )
    .join('\n');

  res
    .type('application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

// Public portfolio endpoints
app.get('/api/profile', (_req, res) => {
  res.json(getProfile());
});

app.get('/api/projects', (_req, res) => {
  res.json(listProjects());
});

app.get('/api/videos', (_req, res) => {
  res.json(listVideos());
});

// Contact form submission with server-side validation
app.post('/api/messages', (req, res) => {
  const { name, email, subject, message } = req.body ?? {};
  if (
    typeof name !== 'string' ||
    name.trim().length < 2 ||
    name.trim().length > 120
  ) {
    res.status(400).json({ error: 'Please enter your name (2–120 characters).' });
    return;
  }
  const emailTrim = typeof email === 'string' ? email.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim) || emailTrim.length > 160) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (
    typeof subject !== 'string' ||
    subject.trim().length < 2 ||
    subject.trim().length > 160
  ) {
    res.status(400).json({ error: 'Please provide a subject (2–160 characters).' });
    return;
  }
  if (
    typeof message !== 'string' ||
    message.trim().length < 10 ||
    message.trim().length > 4000
  ) {
    res.status(400).json({ error: 'Please write a message (10–4000 characters).' });
    return;
  }

  const now = new Date().toISOString();
  const result = db
    .prepare(
      'INSERT INTO messages (name, email, subject, message, is_read, created_at) VALUES (?, ?, ?, ?, 0, ?)'
    )
    .run(name.trim(), emailTrim, subject.trim(), message.trim(), now);

  res.status(201).json({
    id: Number(result.lastInsertRowid),
    ok: true,
    createdAt: now,
  });
});

// Admin authentication routes
app.get('/api/auth/me', (req, res) => {
  res.json({ authenticated: isRequestAuthenticated(req) });
});

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body ?? {};
  if (typeof password !== 'string' || !verifyAdminPassword(password)) {
    res.status(401).json({ error: 'Invalid administrator password.' });
    return;
  }
  const token = createSessionToken();
  setSessionCookie(res, token, req);
  res.json({ authenticated: true });
});

app.post('/api/auth/logout', (req, res) => {
  clearSessionCookie(res, req);
  res.json({ ok: true });
});

// Protected admin routes
app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const projects = listProjects();
  const videos = listVideos();
  const messages = listMessages();
  const unreadMessages = messages.filter((m) => !m.isRead).length;
  res.json({
    projectsCount: projects.length,
    videosCount: videos.length,
    messagesCount: messages.length,
    unreadMessagesCount: unreadMessages,
    profile: getProfile(),
    projects,
    videos,
    messages,
  });
});

app.put('/api/admin/profile', requireAdmin, (req, res) => {
  const {
    title,
    direction,
    education,
    introShort,
    introLong,
    email,
    githubUrl,
    youtubeUrl,
    instagramUrl,
    tiktokUrl,
  } = req.body ?? {};

  const current = getProfile();
  const updatedAt = new Date().toISOString();

  db.prepare(`
    UPDATE profile
    SET title = ?, direction = ?, education = ?, intro_short = ?, intro_long = ?,
        email = ?, github_url = ?, youtube_url = ?, instagram_url = ?, tiktok_url = ?, updated_at = ?
    WHERE id = 1
  `).run(
    typeof title === 'string' && title.trim() ? title.trim() : current.title,
    typeof direction === 'string' && direction.trim() ? direction.trim() : current.direction,
    typeof education === 'string' && education.trim() ? education.trim() : current.education,
    typeof introShort === 'string' && introShort.trim() ? introShort.trim() : current.introShort,
    typeof introLong === 'string' && introLong.trim() ? introLong.trim() : current.introLong,
    typeof email === 'string' && email.trim() ? email.trim() : current.email,
    typeof githubUrl === 'string' && githubUrl.trim() ? githubUrl.trim() : current.githubUrl,
    typeof youtubeUrl === 'string' && youtubeUrl.trim() ? youtubeUrl.trim() : current.youtubeUrl,
    typeof instagramUrl === 'string' && instagramUrl.trim()
      ? instagramUrl.trim()
      : current.instagramUrl,
    typeof tiktokUrl === 'string' ? tiktokUrl.trim() : current.tiktokUrl,
    updatedAt
  );

  res.json(getProfile());
});

app.post('/api/admin/projects', requireAdmin, (req, res) => {
  const {
    projectNumber,
    name,
    fullName,
    category,
    description,
    technologies,
    features,
    repoUrl,
    imageUrl,
    featured,
  } = req.body ?? {};

  if (typeof name !== 'string' || !name.trim() || typeof description !== 'string' || !description.trim()) {
    res.status(400).json({ error: 'Project name and description are required.' });
    return;
  }

  const techArr = Array.isArray(technologies)
    ? technologies.map((t) => String(t).trim()).filter(Boolean)
    : typeof technologies === 'string'
      ? technologies
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

  const featArr = Array.isArray(features)
    ? features.map((f) => String(f).trim()).filter(Boolean)
    : typeof features === 'string'
      ? features
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean)
      : [];

  const now = new Date().toISOString();
  const result = db
    .prepare(`
      INSERT INTO projects (
        project_number, name, full_name, category, description,
        technologies_json, features_json, repo_url, image_url, featured, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      typeof projectNumber === 'string' && projectNumber.trim() ? projectNumber.trim() : '02',
      name.trim(),
      typeof fullName === 'string' && fullName.trim() ? fullName.trim() : name.trim(),
      typeof category === 'string' && category.trim()
        ? category.trim().toUpperCase()
        : 'SOFTWARE DEVELOPMENT',
      description.trim(),
      JSON.stringify(techArr),
      JSON.stringify(featArr),
      typeof repoUrl === 'string' ? repoUrl.trim() : '',
      typeof imageUrl === 'string' ? imageUrl.trim() : '',
      featured ? 1 : 0,
      now
    );

  res.status(201).json({ id: Number(result.lastInsertRowid), projects: listProjects() });
});

app.put('/api/admin/projects/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid project ID' });
    return;
  }

  const {
    projectNumber,
    name,
    fullName,
    category,
    description,
    technologies,
    features,
    repoUrl,
    imageUrl,
    featured,
  } = req.body ?? {};

  if (typeof name !== 'string' || !name.trim() || typeof description !== 'string' || !description.trim()) {
    res.status(400).json({ error: 'Project name and description are required.' });
    return;
  }

  const techArr = Array.isArray(technologies)
    ? technologies.map((t) => String(t).trim()).filter(Boolean)
    : typeof technologies === 'string'
      ? technologies
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

  const featArr = Array.isArray(features)
    ? features.map((f) => String(f).trim()).filter(Boolean)
    : typeof features === 'string'
      ? features
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean)
      : [];

  db.prepare(`
    UPDATE projects
    SET project_number = ?, name = ?, full_name = ?, category = ?, description = ?,
        technologies_json = ?, features_json = ?, repo_url = ?, image_url = ?, featured = ?
    WHERE id = ?
  `).run(
    typeof projectNumber === 'string' && projectNumber.trim() ? projectNumber.trim() : '01',
    name.trim(),
    typeof fullName === 'string' && fullName.trim() ? fullName.trim() : name.trim(),
    typeof category === 'string' && category.trim()
      ? category.trim().toUpperCase()
      : 'SOFTWARE DEVELOPMENT',
    description.trim(),
    JSON.stringify(techArr),
    JSON.stringify(featArr),
    typeof repoUrl === 'string' ? repoUrl.trim() : '',
    typeof imageUrl === 'string' ? imageUrl.trim() : '',
    featured ? 1 : 0,
    id
  );

  res.json({ projects: listProjects() });
});

app.delete('/api/admin/projects/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid project ID' });
    return;
  }
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  res.json({ projects: listProjects() });
});

app.post('/api/admin/videos', requireAdmin, (req, res) => {
  const { title, videoUrl, thumbnailUrl, category, sortOrder } = req.body ?? {};
  if (
    typeof title !== 'string' ||
    !title.trim() ||
    typeof videoUrl !== 'string' ||
    !videoUrl.trim()
  ) {
    res.status(400).json({ error: 'Video title and YouTube URL are required.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO videos (title, video_url, thumbnail_url, category, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    title.trim(),
    videoUrl.trim(),
    typeof thumbnailUrl === 'string' ? thumbnailUrl.trim() : '',
    typeof category === 'string' && category.trim()
      ? category.trim().toUpperCase()
      : 'ROBLOX STORY',
    Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 10,
    now
  );

  res.status(201).json({ videos: listVideos() });
});

app.put('/api/admin/videos/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid video ID' });
    return;
  }
  const { title, videoUrl, thumbnailUrl, category, sortOrder } = req.body ?? {};
  if (
    typeof title !== 'string' ||
    !title.trim() ||
    typeof videoUrl !== 'string' ||
    !videoUrl.trim()
  ) {
    res.status(400).json({ error: 'Video title and YouTube URL are required.' });
    return;
  }

  db.prepare(`
    UPDATE videos
    SET title = ?, video_url = ?, thumbnail_url = ?, category = ?, sort_order = ?
    WHERE id = ?
  `).run(
    title.trim(),
    videoUrl.trim(),
    typeof thumbnailUrl === 'string' ? thumbnailUrl.trim() : '',
    typeof category === 'string' && category.trim()
      ? category.trim().toUpperCase()
      : 'ROBLOX STORY',
    Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 10,
    id
  );

  res.json({ videos: listVideos() });
});

app.delete('/api/admin/videos/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid video ID' });
    return;
  }
  db.prepare('DELETE FROM videos WHERE id = ?').run(id);
  res.json({ videos: listVideos() });
});

app.patch('/api/admin/messages/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid message ID' });
    return;
  }
  const { isRead } = req.body ?? {};
  db.prepare('UPDATE messages SET is_read = ? WHERE id = ?').run(isRead ? 1 : 0, id);
  res.json({ messages: listMessages() });
});

app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid message ID' });
    return;
  }
  db.prepare('DELETE FROM messages WHERE id = ?').run(id);
  res.json({ messages: listMessages() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Portfolio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
