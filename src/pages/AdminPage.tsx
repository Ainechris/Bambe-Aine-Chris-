import React, { useEffect, useState } from 'react';
import {
  Check,
  FolderKanban,
  Lock,
  LogOut,
  Mail,
  Plus,
  Trash2,
  UserCog,
  Youtube,
} from 'lucide-react';
import type { AdminOverview, Project, Video } from '../types/portfolio.ts';
import { AnimatedHeading } from '../components/AnimatedText.tsx';

interface AdminPageProps {
  onDataUpdated: () => Promise<void>;
}

type AdminTab = 'overview' | 'projects' | 'messages' | 'videos' | 'profile';

export const AdminPage: React.FC<AdminPageProps> = ({ onDataUpdated }) => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Project form state
  const [editingProjId, setEditingProjId] = useState<number | null>(null);
  const [projNumber, setProjNumber] = useState('03');
  const [projName, setProjName] = useState('');
  const [projFullName, setProjFullName] = useState('');
  const [projCategory, setProjCategory] = useState('SOFTWARE DEVELOPMENT');
  const [projDesc, setProjDesc] = useState('');
  const [projTech, setProjTech] = useState('');
  const [projFeatures, setProjFeatures] = useState('');
  const [projRepo, setProjRepo] = useState('');
  const [projImage, setProjImage] = useState('');
  const [projFeatured, setProjFeatured] = useState(false);

  // Video form state
  const [editingVidId, setEditingVidId] = useState<number | null>(null);
  const [vidTitle, setVidTitle] = useState('');
  const [vidUrl, setVidUrl] = useState('');
  const [vidThumb, setVidThumb] = useState('');
  const [vidCat, setVidCat] = useState('ROBLOX STORY');

  // Profile form state
  const [profTitle, setProfTitle] = useState('');
  const [profDirection, setProfDirection] = useState('');
  const [profEducation, setProfEducation] = useState('');
  const [profIntroShort, setProfIntroShort] = useState('');
  const [profIntroLong, setProfIntroLong] = useState('');
  const [profTiktok, setProfTiktok] = useState('');

  const loadOverview = async () => {
    const res = await fetch('/api/admin/overview');
    if (res.status === 401) {
      setAuthenticated(false);
      setOverview(null);
      return;
    }
    if (res.ok) {
      const data = (await res.json()) as AdminOverview;
      setOverview(data);
      setProfTitle(data.profile.title);
      setProfDirection(data.profile.direction);
      setProfEducation(data.profile.education);
      setProfIntroShort(data.profile.introShort);
      setProfIntroLong(data.profile.introLong);
      setProfTiktok(data.profile.tiktokUrl);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = (await res.json()) as { authenticated: boolean };
        setAuthenticated(data.authenticated);
        if (data.authenticated) {
          await loadOverview();
        }
      } finally {
        setCheckingAuth(false);
      }
    })();
  }, []);

  const flash = (msg: string) => {
    setStatusMsg(msg);
    window.setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoggingIn(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed.');
      } else {
        setPassword('');
        setAuthenticated(true);
        await loadOverview();
      }
    } catch {
      setAuthError('Network error while signing in.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthenticated(false);
    setOverview(null);
  };

  const resetProjectForm = () => {
    setEditingProjId(null);
    setProjNumber('03');
    setProjName('');
    setProjFullName('');
    setProjCategory('SOFTWARE DEVELOPMENT');
    setProjDesc('');
    setProjTech('');
    setProjFeatures('');
    setProjRepo('');
    setProjImage('');
    setProjFeatured(false);
  };

  const startEditProject = (p: Project) => {
    setEditingProjId(p.id);
    setProjNumber(p.projectNumber);
    setProjName(p.name);
    setProjFullName(p.fullName);
    setProjCategory(p.category);
    setProjDesc(p.description);
    setProjTech(p.technologies.join(', '));
    setProjFeatures(p.features.join('\n'));
    setProjRepo(p.repoUrl);
    setProjImage(p.imageUrl);
    setProjFeatured(p.featured);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      projectNumber: projNumber,
      name: projName,
      fullName: projFullName,
      category: projCategory,
      description: projDesc,
      technologies: projTech,
      features: projFeatures,
      repoUrl: projRepo,
      imageUrl: projImage,
      featured: projFeatured,
    };
    const url = editingProjId
      ? `/api/admin/projects/${editingProjId}`
      : '/api/admin/projects';
    const res = await fetch(url, {
      method: editingProjId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      resetProjectForm();
      await loadOverview();
      await onDataUpdated();
      flash(editingProjId ? 'Project updated.' : 'Project added.');
    }
  };

  const handleDeleteProject = async (id: number) => {
    const res = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadOverview();
      await onDataUpdated();
      flash('Project deleted.');
    }
  };

  const resetVideoForm = () => {
    setEditingVidId(null);
    setVidTitle('');
    setVidUrl('');
    setVidThumb('');
    setVidCat('ROBLOX STORY');
  };

  const startEditVideo = (v: Video) => {
    setEditingVidId(v.id);
    setVidTitle(v.title);
    setVidUrl(v.videoUrl);
    setVidThumb(v.thumbnailUrl);
    setVidCat(v.category);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingVidId ? `/api/admin/videos/${editingVidId}` : '/api/admin/videos';
    const res = await fetch(url, {
      method: editingVidId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: vidTitle,
        videoUrl: vidUrl,
        thumbnailUrl: vidThumb,
        category: vidCat,
      }),
    });
    if (res.ok) {
      resetVideoForm();
      await loadOverview();
      await onDataUpdated();
      flash(editingVidId ? 'Video updated.' : 'Video added.');
    }
  };

  const handleDeleteVideo = async (id: number) => {
    const res = await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadOverview();
      await onDataUpdated();
      flash('Video removed.');
    }
  };

  const toggleMessageRead = async (id: number, currentRead: boolean) => {
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: !currentRead }),
    });
    if (res.ok) {
      await loadOverview();
    }
  };

  const deleteMessage = async (id: number) => {
    const res = await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadOverview();
      flash('Message deleted.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: profTitle,
        direction: profDirection,
        education: profEducation,
        introShort: profIntroShort,
        introLong: profIntroLong,
        tiktokUrl: profTiktok,
      }),
    });
    if (res.ok) {
      await loadOverview();
      await onDataUpdated();
      flash('Profile updated.');
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl bg-[rgba(4,6,15,0.6)] border border-[rgba(150,175,230,0.18)] focus:border-[#5df0a8] focus:outline-none text-sm text-[#f3f6ff] placeholder:text-[#6b7796]';

  if (checkingAuth) {
    return (
      <div className="max-w-lg mx-auto px-5 py-28 text-center text-sm text-[#9aa6c4]">
        Checking session...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-5 py-24 sm:py-32">
        <div className="ascend-panel p-7 sm:p-9 space-y-6">
          <div className="flex items-center gap-3">
            <div className="ascend-icon-box">
              <Lock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#f3f6ff]">Private Admin Dashboard</h1>
              <p className="text-xs text-[#6b7796]">Server-verified session authentication</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="admin-password"
                className="block text-xs font-mono-tech uppercase tracking-[0.14em] text-[#9aa6c4]"
              >
                Administrator Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className={inputClass}
              />
            </div>

            {authError && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-400/40 text-xs text-red-200">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="ascend-btn-primary w-full"
            >
              {loggingIn ? 'Verifying...' : 'Sign in to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-12 sm:py-16 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(150,175,230,0.12)]">
        <div>
          <p className="text-xs font-mono-tech uppercase tracking-[0.16em] text-[#5df0a8]">
            Private Control Plane
          </p>
          <AnimatedHeading
            as="h1"
            trigger="mount"
            text="Portfolio Admin"
            accentText="Dashboard"
            className="font-display text-3xl font-semibold text-[#f3f6ff] mt-1"
          />
        </div>

        <div className="flex items-center gap-4">
          <span aria-live="polite" className="text-xs font-mono-tech text-[#5df0a8]">
            {statusMsg ?? ''}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="ascend-btn-outline !py-2 !px-4 !text-xs"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div role="tablist" aria-label="Admin sections" className="flex flex-wrap gap-2">
        {(
          [
            ['overview', 'Overview'],
            ['projects', 'Projects'],
            ['messages', `Messages (${overview?.unreadMessagesCount ?? 0} unread)`],
            ['videos', 'YouTube Videos'],
            ['profile', 'Profile Settings'],
          ] as Array<[AdminTab, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              tab === id
                ? 'bg-[#5df0a8] text-[#032018] font-semibold'
                : 'bg-[rgba(12,18,38,0.65)] text-[#9aa6c4] hover:text-[#f3f6ff] border border-[rgba(150,175,230,0.18)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {overview && tab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="portfolio-card p-6 space-y-2">
            <div className="flex items-center justify-between text-[#6b7796] text-xs font-mono-tech uppercase">
              <span>Projects</span>
              <FolderKanban className="w-4 h-4 text-[#5df0a8]" aria-hidden="true" />
            </div>
            <p className="text-3xl font-semibold tabular-nums text-[#f3f6ff]">
              {overview.projectsCount}
            </p>
          </div>
          <div className="portfolio-card p-6 space-y-2">
            <div className="flex items-center justify-between text-[#6b7796] text-xs font-mono-tech uppercase">
              <span>YouTube Videos</span>
              <Youtube className="w-4 h-4 text-[#7dd3fc]" aria-hidden="true" />
            </div>
            <p className="text-3xl font-semibold tabular-nums text-[#f3f6ff]">
              {overview.videosCount}
            </p>
          </div>
          <div className="portfolio-card p-6 space-y-2">
            <div className="flex items-center justify-between text-[#6b7796] text-xs font-mono-tech uppercase">
              <span>Total Messages</span>
              <Mail className="w-4 h-4 text-[#9aa6c4]" aria-hidden="true" />
            </div>
            <p className="text-3xl font-semibold tabular-nums text-[#f3f6ff]">
              {overview.messagesCount}
            </p>
          </div>
          <div className="portfolio-card p-6 space-y-2">
            <div className="flex items-center justify-between text-[#6b7796] text-xs font-mono-tech uppercase">
              <span>Unread Inbox</span>
              <UserCog className="w-4 h-4 text-[#5df0a8]" aria-hidden="true" />
            </div>
            <p className="text-3xl font-semibold tabular-nums text-[#5df0a8]">
              {overview.unreadMessagesCount}
            </p>
          </div>
        </div>
      )}

      {overview && tab === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleSaveProject}
            className="lg:col-span-5 portfolio-card p-6 space-y-4 self-start"
          >
            <h2 className="text-lg font-semibold text-[#f3f6ff]">
              {editingProjId ? 'Edit Project' : 'Add New Project'}
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="proj-number" className="block text-[11px] font-mono-tech text-[#6b7796] mb-1">
                  Order
                </label>
                <input
                  id="proj-number"
                  type="text"
                  value={projNumber}
                  onChange={(e) => setProjNumber(e.target.value)}
                  placeholder="03"
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="proj-name" className="block text-[11px] font-mono-tech text-[#6b7796] mb-1">
                  Project Name
                </label>
                <input
                  id="proj-name"
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="Project name"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="proj-fullname" className="block text-[11px] font-mono-tech text-[#6b7796] mb-1">
                Full Title
              </label>
              <input
                id="proj-fullname"
                type="text"
                value={projFullName}
                onChange={(e) => setProjFullName(e.target.value)}
                placeholder="Full descriptive title"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="proj-category" className="block text-[11px] font-mono-tech text-[#6b7796] mb-1">
                Category
              </label>
              <input
                id="proj-category"
                type="text"
                value={projCategory}
                onChange={(e) => setProjCategory(e.target.value)}
                placeholder="Category (e.g. BACKEND & WEB SYSTEMS)"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="proj-desc" className="block text-[11px] font-mono-tech text-[#6b7796] mb-1">
                Description
              </label>
              <textarea
                id="proj-desc"
                required
                rows={3}
                value={projDesc}
                onChange={(e) => setProjDesc(e.target.value)}
                placeholder="Project description"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="proj-tech" className="block text-[11px] font-mono-tech text-[#6b7796] mb-1">
                Technologies (comma separated)
              </label>
              <input
                id="proj-tech"
                type="text"
                value={projTech}
                onChange={(e) => setProjTech(e.target.value)}
                placeholder="Node.js, Express.js, MySQL"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="proj-features" className="block text-[11px] font-mono-tech text-[#6b7796] mb-1">
                Key Features (one per line)
              </label>
              <textarea
                id="proj-features"
                rows={3}
                value={projFeatures}
                onChange={(e) => setProjFeatures(e.target.value)}
                placeholder="Key features (one per line)"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="proj-repo" className="block text-[11px] font-mono-tech text-[#6b7796] mb-1">
                Repository URL
              </label>
              <input
                id="proj-repo"
                type="url"
                value={projRepo}
                onChange={(e) => setProjRepo(e.target.value)}
                placeholder="https://github.com/..."
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="proj-img" className="block text-[11px] font-mono-tech text-[#6b7796] mb-1">
                Preview Image URL (optional)
              </label>
              <input
                id="proj-img"
                type="url"
                value={projImage}
                onChange={(e) => setProjImage(e.target.value)}
                placeholder="Optional preview image URL"
                className={inputClass}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-[#9aa6c4] cursor-pointer">
              <input
                type="checkbox"
                checked={projFeatured}
                onChange={(e) => setProjFeatured(e.target.checked)}
              />
              <span>Featured on Home page</span>
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="ascend-btn-primary !py-2 !px-4 !text-xs"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>{editingProjId ? 'Save Changes' : 'Add Project'}</span>
              </button>
              {editingProjId && (
                <button
                  type="button"
                  onClick={resetProjectForm}
                  className="text-xs text-[#9aa6c4] hover:text-[#f3f6ff] cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-7 space-y-4">
            {overview.projects.map((p) => (
              <div
                key={p.id}
                className="portfolio-card p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-mono-tech text-[#5df0a8]">
                    {p.projectNumber} · {p.category} {p.featured ? '· FEATURED' : ''}
                  </div>
                  <h3 className="text-lg font-semibold text-[#f3f6ff]">
                    {p.name} — {p.fullName}
                  </h3>
                  <p className="text-sm text-[#9aa6c4]">{p.description}</p>
                  <p className="text-xs font-mono-tech text-[#6b7796]">
                    {p.technologies.join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEditProject(p)}
                    className="px-3 py-1.5 rounded-lg bg-[rgba(4,6,15,0.55)] border border-[rgba(150,175,230,0.18)] text-xs text-[#f3f6ff] hover:border-[#5df0a8] cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(p.id)}
                    aria-label={`Delete ${p.name}`}
                    className="p-1.5 rounded-lg bg-[rgba(4,6,15,0.55)] border border-[rgba(150,175,230,0.18)] text-red-300 hover:bg-red-500/15 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {overview && tab === 'messages' && (
        <div className="space-y-4">
          {overview.messages.length === 0 ? (
            <div className="portfolio-card p-10 text-center text-sm text-[#9aa6c4]">
              No contact messages yet. Submissions from the Contact page will appear here.
            </div>
          ) : (
            overview.messages.map((m) => (
              <div
                key={m.id}
                className={`portfolio-card p-6 space-y-3 ${
                  m.isRead ? '' : 'border-[#5df0a8]/60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono-tech text-[#5df0a8] mr-3">
                      {m.isRead ? 'READ' : 'UNREAD'}
                    </span>
                    <span className="text-base font-semibold text-[#f3f6ff]">{m.subject}</span>
                    <p className="text-xs text-[#6b7796] mt-0.5">
                      From {m.name} ({m.email}) · {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleMessageRead(m.id, m.isRead)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(4,6,15,0.55)] border border-[rgba(150,175,230,0.18)] text-xs text-[#f3f6ff] hover:border-[#5df0a8] cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{m.isRead ? 'Mark Unread' : 'Mark Read'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMessage(m.id)}
                      className="p-1.5 rounded-lg bg-[rgba(4,6,15,0.55)] border border-[rgba(150,175,230,0.18)] text-red-300 hover:bg-red-500/15 cursor-pointer"
                      aria-label="Delete message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[#9aa6c4] whitespace-pre-wrap leading-relaxed">
                  {m.message}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {overview && tab === 'videos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleSaveVideo}
            className="lg:col-span-5 portfolio-card p-6 space-y-4 self-start"
          >
            <h2 className="text-lg font-semibold text-[#f3f6ff]">
              {editingVidId ? 'Edit YouTube Video' : 'Add YouTube Video'}
            </h2>

            <div>
              <label htmlFor="vid-title" className="block text-[11px] font-mono-tech text-[#6b7796] mb-1">
                Video Title
              </label>
              <input
                id="vid-title"
                type="text"
                required
                value={vidTitle}
                onChange={(e) => setVidTitle(e.target.value)}
                placeholder="Video title"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="vid-url" className="block text-[11px] font-mono-tech text-[#6b7796] mb-1">
                YouTube Watch URL
              </label>
              <input
                id="vid-url"
                type="url"
                required
                value={vidUrl}
                onChange={(e) => setVidUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="vid-thumb" className="block text-[11px] font-mono-tech text-[#6b7796] mb-1">
                Thumbnail URL
              </label>
              <input
                id="vid-thumb"
                type="url"
                value={vidThumb}
                onChange={(e) => setVidThumb(e.target.value)}
                placeholder="https://i.ytimg.com/vi/.../hqdefault.jpg"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="vid-cat" className="block text-[11px] font-mono-tech text-[#6b7796] mb-1">
                Category
              </label>
              <input
                id="vid-cat"
                type="text"
                value={vidCat}
                onChange={(e) => setVidCat(e.target.value)}
                placeholder="Category (e.g. ROBLOX STORY)"
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="ascend-btn-primary !py-2 !px-4 !text-xs"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>{editingVidId ? 'Save Video' : 'Add Video'}</span>
              </button>
              {editingVidId && (
                <button
                  type="button"
                  onClick={resetVideoForm}
                  className="text-xs text-[#9aa6c4] hover:text-[#f3f6ff] cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-7 space-y-4">
            {overview.videos.map((v) => (
              <div
                key={v.id}
                className="portfolio-card p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {v.thumbnailUrl && (
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      referrerPolicy="no-referrer"
                      className="w-24 h-14 rounded-lg object-cover shrink-0 bg-[rgba(4,6,15,0.55)]"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono-tech text-[#5df0a8]">{v.category}</p>
                    <h3 className="text-sm font-medium text-[#f3f6ff] truncate">{v.title}</h3>
                    <p className="text-xs text-[#6b7796] truncate">{v.videoUrl}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEditVideo(v)}
                    className="px-3 py-1.5 rounded-lg bg-[rgba(4,6,15,0.55)] border border-[rgba(150,175,230,0.18)] text-xs text-[#f3f6ff] hover:border-[#5df0a8] cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteVideo(v.id)}
                    className="p-1.5 rounded-lg bg-[rgba(4,6,15,0.55)] border border-[rgba(150,175,230,0.18)] text-red-300 hover:bg-red-500/15 cursor-pointer"
                    aria-label="Delete video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {overview && tab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="max-w-2xl portfolio-card p-6 sm:p-8 space-y-5"
        >
          <h2 className="text-lg font-semibold text-[#f3f6ff]">Update Selected Profile Info</h2>

          <div className="space-y-2">
            <label htmlFor="prof-title" className="block text-xs font-mono-tech uppercase text-[#9aa6c4]">
              Title
            </label>
            <input
              id="prof-title"
              type="text"
              value={profTitle}
              onChange={(e) => setProfTitle(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="prof-direction" className="block text-xs font-mono-tech uppercase text-[#9aa6c4]">
              Professional Direction
            </label>
            <input
              id="prof-direction"
              type="text"
              value={profDirection}
              onChange={(e) => setProfDirection(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="prof-education" className="block text-xs font-mono-tech uppercase text-[#9aa6c4]">
              Education
            </label>
            <input
              id="prof-education"
              type="text"
              value={profEducation}
              onChange={(e) => setProfEducation(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="prof-intro-short" className="block text-xs font-mono-tech uppercase text-[#9aa6c4]">
              Short Introduction
            </label>
            <textarea
              id="prof-intro-short"
              rows={2}
              value={profIntroShort}
              onChange={(e) => setProfIntroShort(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="prof-intro-long" className="block text-xs font-mono-tech uppercase text-[#9aa6c4]">
              Full Introduction
            </label>
            <textarea
              id="prof-intro-long"
              rows={4}
              value={profIntroLong}
              onChange={(e) => setProfIntroLong(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="prof-tiktok" className="block text-xs font-mono-tech uppercase text-[#9aa6c4]">
              TikTok URL (leave empty until ready)
            </label>
            <input
              id="prof-tiktok"
              type="url"
              value={profTiktok}
              onChange={(e) => setProfTiktok(e.target.value)}
              placeholder="https://www.tiktok.com/@..."
              className={inputClass}
            />
          </div>

          <button type="submit" className="ascend-btn-primary">
            Save Profile Settings
          </button>
        </form>
      )}
    </div>
  );
};
