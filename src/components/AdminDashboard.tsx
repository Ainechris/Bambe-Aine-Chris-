import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  CheckCircle2,
  Edit3,
  Eye,
  FileText,
  FolderGit2,
  Lock,
  LogOut,
  Mail,
  MailOpen,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  CERTIFICATE_CATEGORIES,
  type CertificateRecord,
  type ContactMessageRecord,
  PROJECT_STATUSES,
  type ProjectRecord,
  type ProjectStatus,
  type PublicationStatus,
  formatDisplayDate,
  formatFileSize,
  isSafeHttpUrl,
} from '../types/portfolio.ts';
import { BrandMark } from './BrandMark.tsx';

export type AdminTab = 'projects' | 'certificates' | 'messages';

interface AdminDashboardProps {
  token: string | null;
  initialTab?: AdminTab;
  onSetToken: (token: string | null) => void;
  onBackToPortfolio: () => void;
  onDataChanged: () => void;
}

interface CertStats {
  total: number;
  published: number;
  draft: number;
}

interface CertFormState {
  title: string;
  issuer: string;
  description: string;
  issueDate: string;
  expirationDate: string;
  credentialId: string;
  verificationUrl: string;
  category: string;
  status: PublicationStatus;
}

interface ProjectFormState {
  title: string;
  description: string;
  problemStatement: string;
  myContribution: string;
  keyFeatures: string;
  developmentProcess: string;
  technologies: string;
  githubUrl: string;
  liveUrl: string;
  projectStatus: ProjectStatus;
  visibility: PublicationStatus;
  featured: boolean;
}

const EMPTY_CERT_FORM: CertFormState = {
  title: '',
  issuer: '',
  description: '',
  issueDate: '',
  expirationDate: '',
  credentialId: '',
  verificationUrl: '',
  category: CERTIFICATE_CATEGORIES[0],
  status: 'draft',
};

const EMPTY_PROJECT_FORM: ProjectFormState = {
  title: '',
  description: '',
  problemStatement: '',
  myContribution: '',
  keyFeatures: '',
  developmentProcess: '',
  technologies: '',
  githubUrl: '',
  liveUrl: '',
  projectStatus: 'Completed',
  visibility: 'draft',
  featured: false,
};

const SecureAssetPreview: React.FC<{
  fileUrl: string;
  fileMime: string | null;
  title: string;
  originalFileName: string | null;
  token: string;
  compact?: boolean;
}> = ({ fileUrl, fileMime, title, originalFileName, token, compact = false }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;
    setBlobUrl(null);
    setError(false);

    fetch(fileUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unable to load file');
        return res.blob();
      })
      .then((blob) => {
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [fileUrl, token]);

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-[#0A0D0F] border border-[rgba(242,239,233,0.1)] text-xs text-[#8C989B] text-center">
        Preview unavailable.
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div
        className={`${compact ? 'h-24' : 'h-44'} rounded-xl bg-[#0A0D0F] border border-[rgba(242,239,233,0.1)] animate-pulse flex items-center justify-center text-xs text-[#8C989B]`}
      >
        Loading preview...
      </div>
    );
  }

  if (fileMime === 'application/pdf') {
    return (
      <div className="p-5 rounded-xl bg-[#0E1316] border border-[rgba(242,239,233,0.1)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-[#162126] border border-[#4DB6AC]/25 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[#4DB6AC]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#F2EFE9] truncate">
              {originalFileName || 'Certificate.pdf'}
            </p>
            <p className="text-xs text-[#8C989B]">PDF Document</p>
          </div>
        </div>
        <a
          href={blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#4DB6AC] hover:bg-[#5EC4BA] text-[#071618] text-xs font-semibold whitespace-nowrap shrink-0"
        >
          <span>Open PDF</span>
          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl bg-[#0A0D0F] border border-[rgba(242,239,233,0.1)] overflow-hidden flex items-center justify-center ${compact ? 'max-h-36' : 'max-h-80'}`}
    >
      <img
        src={blobUrl}
        alt={title}
        className={`max-w-full object-contain ${compact ? 'max-h-36' : 'max-h-80'}`}
      />
    </div>
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  initialTab = 'projects',
  onSetToken,
  onBackToPortfolio,
  onDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [authStatus, setAuthStatus] = useState<{
    loading: boolean;
    configured: boolean;
    authenticated: boolean;
  }>({ loading: true, configured: true, authenticated: false });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Projects State
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectFormState>(EMPTY_PROJECT_FORM);
  const [projectImageFile, setProjectImageFile] = useState<File | null>(null);
  const [removeProjectImage, setRemoveProjectImage] = useState(false);
  const [projectScreenshotFiles, setProjectScreenshotFiles] = useState<File[]>([]);
  const [removedScreenshotIds, setRemovedScreenshotIds] = useState<string[]>([]);
  const [projectFormError, setProjectFormError] = useState<string | null>(null);
  const [projectSaving, setProjectSaving] = useState(false);
  const [deletingProject, setDeletingProject] = useState<ProjectRecord | null>(null);
  const [deleteProjectBusy, setDeleteProjectBusy] = useState(false);

  // Certificates State
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [certStats, setCertStats] = useState<CertStats>({ total: 0, published: 0, draft: 0 });
  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | PublicationStatus>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const [certFormOpen, setCertFormOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<CertificateRecord | null>(null);
  const [certForm, setCertForm] = useState<CertFormState>(EMPTY_CERT_FORM);
  const [selectedCertFile, setSelectedCertFile] = useState<File | null>(null);
  const [removeExistingCertFile, setRemoveExistingCertFile] = useState(false);
  const [certFormError, setCertFormError] = useState<string | null>(null);
  const [certSaving, setCertSaving] = useState(false);
  const [viewingCert, setViewingCert] = useState<CertificateRecord | null>(null);
  const [deletingCert, setDeletingCert] = useState<CertificateRecord | null>(null);
  const [deleteCertBusy, setDeleteCertBusy] = useState(false);
  const [togglingCertId, setTogglingCertId] = useState<string | null>(null);

  // Contact Messages State
  const [messages, setMessages] = useState<ContactMessageRecord[]>([]);
  const [msgStats, setMsgStats] = useState<{ total: number; unread: number }>({
    total: 0,
    unread: 0,
  });
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [msgFilter, setMsgFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [deletingMessage, setDeletingMessage] = useState<ContactMessageRecord | null>(null);
  const [deleteMsgBusy, setDeleteMsgBusy] = useState(false);

  const selectedCertPreviewUrl = useMemo(() => {
    if (!selectedCertFile || !selectedCertFile.type.startsWith('image/')) return null;
    return URL.createObjectURL(selectedCertFile);
  }, [selectedCertFile]);

  const selectedProjectPreviewUrl = useMemo(() => {
    if (!projectImageFile || !projectImageFile.type.startsWith('image/')) return null;
    return URL.createObjectURL(projectImageFile);
  }, [projectImageFile]);

  useEffect(() => {
    return () => {
      if (selectedCertPreviewUrl) URL.revokeObjectURL(selectedCertPreviewUrl);
    };
  }, [selectedCertPreviewUrl]);

  useEffect(() => {
    return () => {
      if (selectedProjectPreviewUrl) URL.revokeObjectURL(selectedProjectPreviewUrl);
    };
  }, [selectedProjectPreviewUrl]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const showToast = (msg: string) => {
    setBannerMessage(msg);
    window.setTimeout(() => {
      setBannerMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const handleUnauthorized = useCallback(() => {
    onSetToken(null);
    setAuthStatus((prev) => ({ ...prev, authenticated: false }));
  }, [onSetToken]);

  const checkAuthStatus = useCallback(async () => {
    setAuthStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/admin/auth/status', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = (await res.json()) as { configured: boolean; authenticated: boolean };
      if (!data.authenticated && token) {
        onSetToken(null);
      }
      setAuthStatus({
        loading: false,
        configured: data.configured,
        authenticated: data.authenticated,
      });
    } catch {
      setAuthStatus({ loading: false, configured: true, authenticated: false });
    }
  }, [token, onSetToken]);

  useEffect(() => {
    void checkAuthStatus();
  }, [checkAuthStatus]);

  const loadProjects = useCallback(async () => {
    if (!token) return;
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const res = await fetch('/api/admin/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) throw new Error('Could not load projects.');
      const data = (await res.json()) as { projects?: ProjectRecord[] };
      setProjects(Array.isArray(data.projects) ? data.projects : []);
    } catch (err: unknown) {
      setProjectsError(err instanceof Error ? err.message : 'Failed to load projects.');
    } finally {
      setProjectsLoading(false);
    }
  }, [token, handleUnauthorized]);

  const loadCertificates = useCallback(async () => {
    if (!token) return;
    setCertLoading(true);
    setCertError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('sort', sortOrder);

      const res = await fetch(`/api/admin/certificates?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) throw new Error('Could not load certificates.');
      const data = (await res.json()) as {
        certificates?: CertificateRecord[];
        stats?: CertStats;
      };
      setCertificates(data.certificates ?? []);
      setCertStats(data.stats ?? { total: 0, published: 0, draft: 0 });
    } catch (err: unknown) {
      setCertError(err instanceof Error ? err.message : 'Failed to load certificates.');
    } finally {
      setCertLoading(false);
    }
  }, [token, search, categoryFilter, statusFilter, sortOrder, handleUnauthorized]);

  const loadMessages = useCallback(async () => {
    if (!token) return;
    setMsgLoading(true);
    setMsgError(null);
    try {
      const res = await fetch(`/api/admin/messages?status=${encodeURIComponent(msgFilter)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) throw new Error('Could not load messages.');
      const data = (await res.json()) as {
        messages?: ContactMessageRecord[];
        stats?: { total: number; unread: number };
      };
      setMessages(data.messages ?? []);
      setMsgStats(data.stats ?? { total: 0, unread: 0 });
    } catch (err: unknown) {
      setMsgError(err instanceof Error ? err.message : 'Failed to load messages.');
    } finally {
      setMsgLoading(false);
    }
  }, [token, msgFilter, handleUnauthorized]);

  useEffect(() => {
    if (authStatus.authenticated && token) {
      void loadProjects();
      void loadCertificates();
      void loadMessages();
    }
  }, [authStatus.authenticated, token, loadProjects, loadCertificates, loadMessages]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!authStatus.configured) {
      if (password.length < 8) {
        setAuthError('Password must be at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('Passwords do not match.');
        return;
      }
    } else if (!password) {
      setAuthError('Please enter your admin password.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const endpoint = authStatus.configured ? '/api/admin/auth/login' : '/api/admin/auth/setup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Authentication failed.');
        return;
      }
      setPassword('');
      setConfirmPassword('');
      onSetToken(data.token);
      setAuthStatus({ loading: false, configured: true, authenticated: true });
    } catch {
      setAuthError('Unable to reach server. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
    onSetToken(null);
    setAuthStatus((prev) => ({ ...prev, authenticated: false }));
  };

  // --- Project Handlers ---
  const openCreateProject = () => {
    setEditingProject(null);
    setProjectForm(EMPTY_PROJECT_FORM);
    setProjectImageFile(null);
    setRemoveProjectImage(false);
    setProjectScreenshotFiles([]);
    setRemovedScreenshotIds([]);
    setProjectFormError(null);
    setProjectFormOpen(true);
  };

  const openEditProject = (proj: ProjectRecord) => {
    setEditingProject(proj);
    setProjectForm({
      title: proj.title,
      description: proj.description,
      problemStatement: proj.problemStatement || '',
      myContribution: proj.myContribution || '',
      keyFeatures: proj.keyFeatures.join('\n'),
      developmentProcess: proj.developmentProcess || '',
      technologies: proj.technologies.join(', '),
      githubUrl: proj.githubUrl || '',
      liveUrl: proj.liveUrl || '',
      projectStatus: proj.projectStatus,
      visibility: proj.visibility,
      featured: proj.featured,
    });
    setProjectImageFile(null);
    setRemoveProjectImage(false);
    setProjectScreenshotFiles([]);
    setRemovedScreenshotIds([]);
    setProjectFormError(null);
    setProjectFormOpen(true);
  };

  const handleProjectImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setProjectFormError('Please choose a PNG, JPG, or WEBP image.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProjectFormError('Project image must be 5 MB or smaller.');
      e.target.value = '';
      return;
    }
    setProjectFormError(null);
    setProjectImageFile(file);
    setRemoveProjectImage(false);
  };

  const handleProjectScreenshotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const valid: File[] = [];
    for (const file of files.slice(0, 4)) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        setProjectFormError('Extra screenshots must be PNG, JPG, or WEBP images.');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setProjectFormError('Each screenshot must be 5 MB or smaller.');
        e.target.value = '';
        return;
      }
      valid.push(file);
    }
    setProjectFormError(null);
    setProjectScreenshotFiles((prev) => [...prev, ...valid].slice(0, 4));
    e.target.value = '';
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProjectFormError(null);

    if (projectForm.title.trim().length < 2) {
      setProjectFormError('Please enter a project title.');
      return;
    }
    if (projectForm.description.trim().length < 10) {
      setProjectFormError('Please enter a project overview (at least 10 characters).');
      return;
    }
    if (!projectForm.technologies.trim()) {
      setProjectFormError('Please enter at least one technology (comma-separated).');
      return;
    }
    if (projectForm.githubUrl.trim() && !isSafeHttpUrl(projectForm.githubUrl.trim())) {
      setProjectFormError('GitHub URL must start with http:// or https://.');
      return;
    }
    if (projectForm.liveUrl.trim() && !isSafeHttpUrl(projectForm.liveUrl.trim())) {
      setProjectFormError('Live Demo URL must start with http:// or https://.');
      return;
    }

    const body = new FormData();
    body.append('title', projectForm.title.trim());
    body.append('description', projectForm.description.trim());
    body.append('problemStatement', projectForm.problemStatement.trim());
    body.append('myContribution', projectForm.myContribution.trim());
    body.append('keyFeatures', projectForm.keyFeatures.trim());
    body.append('developmentProcess', projectForm.developmentProcess.trim());
    body.append('technologies', projectForm.technologies.trim());
    body.append('githubUrl', projectForm.githubUrl.trim());
    body.append('liveUrl', projectForm.liveUrl.trim());
    body.append('projectStatus', projectForm.projectStatus);
    body.append('visibility', projectForm.visibility);
    body.append('featured', projectForm.featured ? 'true' : 'false');
    if (projectImageFile) {
      body.append('file', projectImageFile);
    }
    if (editingProject && removeProjectImage && !projectImageFile) {
      body.append('removeImage', 'true');
    }
    for (const file of projectScreenshotFiles) {
      body.append('screenshots', file);
    }
    if (editingProject && removedScreenshotIds.length > 0) {
      body.append('removedScreenshotIds', JSON.stringify(removedScreenshotIds));
    }

    setProjectSaving(true);
    try {
      const url = editingProject
        ? `/api/admin/projects/${encodeURIComponent(editingProject.id)}`
        : '/api/admin/projects';
      const method = editingProject ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = (await res.json()) as { error?: string };
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        setProjectFormError(data.error || 'Failed to save project.');
        return;
      }

      setProjectFormOpen(false);
      showToast(editingProject ? 'Project updated.' : 'Project saved.');
      await loadProjects();
      onDataChanged();
    } catch {
      setProjectFormError('Network error while saving project.');
    } finally {
      setProjectSaving(false);
    }
  };

  const handleConfirmDeleteProject = async () => {
    if (!token || !deletingProject) return;
    setDeleteProjectBusy(true);
    try {
      const res = await fetch(
        `/api/admin/projects/${encodeURIComponent(deletingProject.id)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        showToast(`Deleted "${deletingProject.title}".`);
        setDeletingProject(null);
        await loadProjects();
        onDataChanged();
      }
    } finally {
      setDeleteProjectBusy(false);
    }
  };

  // --- Certificate Handlers ---
  const openCreateCert = () => {
    setEditingCert(null);
    setCertForm({
      ...EMPTY_CERT_FORM,
      issueDate: new Date().toISOString().slice(0, 10),
    });
    setSelectedCertFile(null);
    setRemoveExistingCertFile(false);
    setCertFormError(null);
    setCertFormOpen(true);
  };

  const openEditCert = (cert: CertificateRecord) => {
    setEditingCert(cert);
    setCertForm({
      title: cert.title,
      issuer: cert.issuer,
      description: cert.description,
      issueDate: cert.issueDate,
      expirationDate: cert.expirationDate || '',
      credentialId: cert.credentialId || '',
      verificationUrl: cert.verificationUrl || '',
      category: cert.category,
      status: cert.status,
    });
    setSelectedCertFile(null);
    setRemoveExistingCertFile(false);
    setCertFormError(null);
    setCertFormOpen(true);
  };

  const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setCertFormError('Please select a PNG, JPG, WEBP image or a PDF document.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCertFormError('File size must be 5 MB or smaller.');
      e.target.value = '';
      return;
    }
    setCertFormError(null);
    setSelectedCertFile(file);
    setRemoveExistingCertFile(false);
  };

  const handleSaveCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCertFormError(null);

    if (certForm.title.trim().length < 2) {
      setCertFormError('Please enter a certificate title.');
      return;
    }
    if (certForm.issuer.trim().length < 2) {
      setCertFormError('Please enter the issuing organization.');
      return;
    }
    if (certForm.description.trim().length < 5) {
      setCertFormError('Please enter a brief certificate description.');
      return;
    }
    if (!certForm.issueDate) {
      setCertFormError('Please choose an issue date.');
      return;
    }
    if (certForm.expirationDate && certForm.expirationDate < certForm.issueDate) {
      setCertFormError('Expiration date cannot be earlier than the issue date.');
      return;
    }
    if (certForm.verificationUrl.trim() && !isSafeHttpUrl(certForm.verificationUrl.trim())) {
      setCertFormError('Verification URL must start with http:// or https://.');
      return;
    }

    const body = new FormData();
    body.append('title', certForm.title.trim());
    body.append('issuer', certForm.issuer.trim());
    body.append('description', certForm.description.trim());
    body.append('issueDate', certForm.issueDate);
    body.append('expirationDate', certForm.expirationDate.trim());
    body.append('credentialId', certForm.credentialId.trim());
    body.append('verificationUrl', certForm.verificationUrl.trim());
    body.append('category', certForm.category);
    body.append('status', certForm.status);
    if (selectedCertFile) {
      body.append('file', selectedCertFile);
    }
    if (editingCert && removeExistingCertFile && !selectedCertFile) {
      body.append('removeFile', 'true');
    }

    setCertSaving(true);
    try {
      const url = editingCert
        ? `/api/admin/certificates/${encodeURIComponent(editingCert.id)}`
        : '/api/admin/certificates';
      const method = editingCert ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      const data = (await res.json()) as { error?: string };
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        setCertFormError(data.error || 'Failed to save certificate.');
        return;
      }

      setCertFormOpen(false);
      showToast(editingCert ? 'Certificate updated.' : 'Certificate saved.');
      await loadCertificates();
      onDataChanged();
    } catch {
      setCertFormError('Network error while saving certificate.');
    } finally {
      setCertSaving(false);
    }
  };

  const handleToggleCertStatus = async (cert: CertificateRecord) => {
    if (!token) return;
    const nextStatus: PublicationStatus = cert.status === 'published' ? 'draft' : 'published';
    setTogglingCertId(cert.id);
    try {
      const res = await fetch(
        `/api/admin/certificates/${encodeURIComponent(cert.id)}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      if (res.ok) {
        showToast(
          nextStatus === 'published'
            ? `"${cert.title}" is now published.`
            : `"${cert.title}" moved to drafts.`,
        );
        await loadCertificates();
        onDataChanged();
      }
    } finally {
      setTogglingCertId(null);
    }
  };

  const handleConfirmDeleteCert = async () => {
    if (!token || !deletingCert) return;
    setDeleteCertBusy(true);
    try {
      const res = await fetch(
        `/api/admin/certificates/${encodeURIComponent(deletingCert.id)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        showToast(`Deleted "${deletingCert.title}".`);
        setDeletingCert(null);
        if (viewingCert?.id === deletingCert.id) setViewingCert(null);
        await loadCertificates();
        onDataChanged();
      }
    } finally {
      setDeleteCertBusy(false);
    }
  };

  // --- Message Handlers ---
  const handleToggleMessageRead = async (msg: ContactMessageRecord) => {
    if (!token) return;
    const nextStatus = msg.status === 'unread' ? 'read' : 'unread';
    const res = await fetch(`/api/admin/messages/${encodeURIComponent(msg.id)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return;
    }
    if (res.ok) {
      await loadMessages();
    }
  };

  const handleConfirmDeleteMessage = async () => {
    if (!token || !deletingMessage) return;
    setDeleteMsgBusy(true);
    try {
      const res = await fetch(`/api/admin/messages/${encodeURIComponent(deletingMessage.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Message deleted.');
        setDeletingMessage(null);
        await loadMessages();
      }
    } finally {
      setDeleteMsgBusy(false);
    }
  };

  const publishedProjectsCount = projects.filter((p) => p.visibility === 'published').length;

  return (
    <div className="min-h-screen bg-[#0A0D0F] text-[#F2EFE9]">
      {/* Dashboard Top Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#0A0D0F]/90 backdrop-blur-md border-b border-[rgba(242,239,233,0.1)]">
        <div className="max-w-[1220px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={onBackToPortfolio}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-lg bg-[#11171A] hover:bg-[#172024] border border-[rgba(242,239,233,0.14)] text-xs sm:text-sm font-medium text-[#F2EFE9] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-[#4DB6AC]" aria-hidden="true" />
              <span>Back to Portfolio</span>
            </button>
            <div className="hidden sm:flex items-center gap-2.5 min-w-0">
              <BrandMark className="w-6 h-6 shrink-0" />
              <span className="font-display text-sm sm:text-base font-semibold text-[#F2EFE9] truncate">
                Portfolio CMS
              </span>
            </div>
          </div>

          {authStatus.authenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#11171A] hover:bg-[#172024] border border-[rgba(242,239,233,0.14)] text-xs sm:text-sm font-medium text-[#CBC6BC] hover:text-[#F2EFE9] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-[1220px] mx-auto px-5 sm:px-8 py-12">
        {authStatus.loading ? (
          <div className="max-w-md mx-auto mt-12 rounded-2xl bg-[#11171A] border border-[rgba(242,239,233,0.1)] p-8 text-center text-sm text-[#8C989B]">
            Checking administrator session...
          </div>
        ) : !authStatus.authenticated ? (
          <div className="max-w-md mx-auto mt-10 rounded-2xl bg-[#11171A] border border-[rgba(242,239,233,0.12)] p-7 sm:p-8">
            <div className="w-11 h-11 rounded-xl bg-[#162126] border border-[#4DB6AC]/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#4DB6AC]" aria-hidden="true" />
            </div>

            <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-[#F2EFE9]">
              {authStatus.configured ? 'Admin Sign In' : 'Claim Admin Password'}
            </h1>
            <p className="mt-2 text-sm text-[#8C989B] leading-relaxed">
              {authStatus.configured
                ? 'Sign in to manage projects, certificates, and contact messages.'
                : 'Set your private administrator password to unlock your portfolio CMS.'}
            </p>

            <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-medium text-[#CBC6BC] mb-1.5"
                >
                  {authStatus.configured ? 'Admin Password' : 'New Admin Password'}
                </label>
                <input
                  id="admin-password"
                  type="password"
                  required
                  minLength={authStatus.configured ? 1 : 8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.16)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                />
              </div>

              {!authStatus.configured && (
                <div>
                  <label
                    htmlFor="admin-password-confirm"
                    className="block text-xs font-medium text-[#CBC6BC] mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="admin-password-confirm"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password (8+ characters)"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.16)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  />
                </div>
              )}

              {authError && (
                <p role="alert" className="text-xs font-medium text-[#F87171]">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#4DB6AC] hover:bg-[#5EC4BA] disabled:opacity-50 text-[#071618] text-sm font-semibold transition-colors cursor-pointer"
              >
                {authSubmitting
                  ? 'Please wait...'
                  : authStatus.configured
                    ? 'Sign In'
                    : 'Save Password & Continue'}
              </button>
            </form>
          </div>
        ) : (
          <div>
            {/* Dashboard Header & Tabs */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <p className="font-mono-tech text-xs tracking-[0.14em] text-[#4DB6AC]">
                  PRIVATE DASHBOARD · BAMBE AINE CHRIS
                </p>
                <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#F2EFE9]">
                  Portfolio Management
                </h1>
              </div>

              <div
                role="tablist"
                aria-label="Admin sections"
                className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#11171A] border border-[rgba(242,239,233,0.12)] self-start lg:self-auto"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'projects'}
                  onClick={() => setActiveTab('projects')}
                  className={`inline-flex items-center gap-2 min-h-[40px] px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'projects'
                      ? 'bg-[#1B5E63] text-[#F2EFE9]'
                      : 'text-[#8C989B] hover:text-[#F2EFE9]'
                  }`}
                >
                  <FolderGit2 className="w-4 h-4" aria-hidden="true" />
                  <span>Projects</span>
                  <span className="font-mono-tech text-[11px] opacity-80 tabular-nums">
                    ({projects.length})
                  </span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'certificates'}
                  onClick={() => setActiveTab('certificates')}
                  className={`inline-flex items-center gap-2 min-h-[40px] px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'certificates'
                      ? 'bg-[#1B5E63] text-[#F2EFE9]'
                      : 'text-[#8C989B] hover:text-[#F2EFE9]'
                  }`}
                >
                  <Award className="w-4 h-4" aria-hidden="true" />
                  <span>Certificates</span>
                  <span className="font-mono-tech text-[11px] opacity-80 tabular-nums">
                    ({certStats.total})
                  </span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'messages'}
                  onClick={() => setActiveTab('messages')}
                  className={`inline-flex items-center gap-2 min-h-[40px] px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'messages'
                      ? 'bg-[#1B5E63] text-[#F2EFE9]'
                      : 'text-[#8C989B] hover:text-[#F2EFE9]'
                  }`}
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  <span>Messages</span>
                  {msgStats.unread > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-[#4DB6AC] text-[#071618] font-mono-tech text-[11px] font-semibold tabular-nums">
                      {msgStats.unread}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {bannerMessage && (
              <div
                role="status"
                className="mt-6 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#162126] border border-[#4DB6AC]/35 text-sm font-medium text-[#F2EFE9]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#4DB6AC] shrink-0" aria-hidden="true" />
                <span>{bannerMessage}</span>
              </div>
            )}

            {/* ================= PROJECTS TAB ================= */}
            {activeTab === 'projects' && (
              <div className="mt-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <dl className="grid grid-cols-3 gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="rounded-xl bg-[#11171A] border border-[rgba(242,239,233,0.1)] px-4 py-3">
                      <dt className="text-[11px] text-[#8C989B]">Total</dt>
                      <dd className="mt-0.5 font-mono-tech text-xl font-semibold text-[#F2EFE9] tabular-nums">
                        {projects.length}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-[#11171A] border border-[rgba(242,239,233,0.1)] px-4 py-3">
                      <dt className="text-[11px] text-[#8C989B]">Published</dt>
                      <dd className="mt-0.5 font-mono-tech text-xl font-semibold text-[#4DB6AC] tabular-nums">
                        {publishedProjectsCount}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-[#11171A] border border-[rgba(242,239,233,0.1)] px-4 py-3">
                      <dt className="text-[11px] text-[#8C989B]">Drafts</dt>
                      <dd className="mt-0.5 font-mono-tech text-xl font-semibold text-[#CBC6BC] tabular-nums">
                        {projects.length - publishedProjectsCount}
                      </dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={openCreateProject}
                    className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg bg-[#4DB6AC] hover:bg-[#5EC4BA] text-[#071618] text-sm font-semibold transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Add Project</span>
                  </button>
                </div>

                {projectsError && (
                  <div className="rounded-xl bg-[#11171A] border border-[#F87171]/30 p-5 text-sm text-[#F87171]">
                    {projectsError}
                  </div>
                )}

                {projectsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((n) => (
                      <div
                        key={n}
                        className="h-24 rounded-xl bg-[#11171A] border border-[rgba(242,239,233,0.08)] animate-pulse"
                      />
                    ))}
                  </div>
                ) : projects.length === 0 ? (
                  <div className="rounded-2xl bg-[#11171A] border border-[rgba(242,239,233,0.1)] p-10 text-center">
                    <FolderGit2 className="w-8 h-8 text-[#4DB6AC] mx-auto" aria-hidden="true" />
                    <h2 className="mt-3 font-display text-lg font-semibold text-[#F2EFE9]">
                      No projects added yet
                    </h2>
                    <p className="mt-1.5 text-sm text-[#8C989B] max-w-md mx-auto">
                      Add your genuine software projects here. Published projects appear in the
                      Selected Work section of your public portfolio.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((proj) => (
                      <article
                        key={proj.id}
                        className="rounded-xl bg-[#11171A] border border-[rgba(242,239,233,0.1)] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-5 min-w-0">
                          {proj.imageUrl && token && (
                            <div className="w-full sm:w-36 shrink-0">
                              <SecureAssetPreview
                                fileUrl={proj.imageUrl}
                                fileMime={proj.imageMime}
                                title={proj.title}
                                originalFileName={proj.originalImageName}
                                token={token}
                                compact
                              />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono-tech text-xs text-[#8C989B]">
                              <span
                                className={
                                  proj.visibility === 'published'
                                    ? 'text-[#4DB6AC]'
                                    : 'text-[#8C989B]'
                                }
                              >
                                {proj.visibility === 'published' ? 'Published' : 'Draft'}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{proj.projectStatus}</span>
                              {proj.featured && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="inline-flex items-center gap-1 text-[#F2EFE9]">
                                    <Star className="w-3 h-3 text-[#4DB6AC]" aria-hidden="true" />
                                    Featured
                                  </span>
                                </>
                              )}
                            </div>

                            <h2 className="mt-1.5 font-display text-lg font-semibold text-[#F2EFE9]">
                              {proj.title}
                            </h2>
                            <p className="mt-1 text-sm text-[#CBC6BC] line-clamp-2 max-w-2xl">
                              {proj.description}
                            </p>
                            <p className="mt-2 font-mono-tech text-xs text-[#4DB6AC]">
                              {proj.technologies.join(' · ')}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditProject(proj)}
                            className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#0A0D0F] hover:bg-[#172024] border border-[rgba(242,239,233,0.14)] text-xs font-medium text-[#F2EFE9] transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingProject(proj)}
                            aria-label={`Delete ${proj.title}`}
                            className="inline-flex items-center justify-center min-h-[38px] px-3 py-1.5 rounded-lg bg-[#0A0D0F] hover:bg-[#2A1416] border border-[rgba(242,239,233,0.14)] hover:border-[#F87171]/40 text-xs font-medium text-[#F87171] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= CERTIFICATES TAB ================= */}
            {activeTab === 'certificates' && (
              <div className="mt-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <dl className="grid grid-cols-3 gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="rounded-xl bg-[#11171A] border border-[rgba(242,239,233,0.1)] px-4 py-3">
                      <dt className="text-[11px] text-[#8C989B]">Total</dt>
                      <dd className="mt-0.5 font-mono-tech text-xl font-semibold text-[#F2EFE9] tabular-nums">
                        {certStats.total}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-[#11171A] border border-[rgba(242,239,233,0.1)] px-4 py-3">
                      <dt className="text-[11px] text-[#8C989B]">Published</dt>
                      <dd className="mt-0.5 font-mono-tech text-xl font-semibold text-[#4DB6AC] tabular-nums">
                        {certStats.published}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-[#11171A] border border-[rgba(242,239,233,0.1)] px-4 py-3">
                      <dt className="text-[11px] text-[#8C989B]">Drafts</dt>
                      <dd className="mt-0.5 font-mono-tech text-xl font-semibold text-[#CBC6BC] tabular-nums">
                        {certStats.draft}
                      </dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={openCreateCert}
                    className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg bg-[#4DB6AC] hover:bg-[#5EC4BA] text-[#071618] text-sm font-semibold transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Add Certificate</span>
                  </button>
                </div>

                {/* Search, Filter & Sort */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="relative">
                    <Search
                      className="w-4 h-4 text-[#8C989B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search title, issuer, ID..."
                      aria-label="Search certificates"
                      className="w-full min-h-[42px] pl-10 pr-3 py-2 rounded-lg bg-[#11171A] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9] placeholder:text-[#8C989B]/60"
                    />
                  </div>

                  <select
                    aria-label="Filter by category"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="min-h-[42px] px-3 py-2 rounded-lg bg-[#11171A] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  >
                    <option value="all">All Categories</option>
                    {CERTIFICATE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter by publication status"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as 'all' | PublicationStatus)
                    }
                    className="min-h-[42px] px-3 py-2 rounded-lg bg-[#11171A] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>

                  <select
                    aria-label="Sort certificates"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                    className="min-h-[42px] px-3 py-2 rounded-lg bg-[#11171A] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="oldest">Sort: Oldest First</option>
                  </select>
                </div>

                {certError && (
                  <div className="rounded-xl bg-[#11171A] border border-[#F87171]/30 p-5 text-sm text-[#F87171]">
                    {certError}
                  </div>
                )}

                {certLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((n) => (
                      <div
                        key={n}
                        className="h-24 rounded-xl bg-[#11171A] border border-[rgba(242,239,233,0.08)] animate-pulse"
                      />
                    ))}
                  </div>
                ) : certificates.length === 0 ? (
                  <div className="rounded-2xl bg-[#11171A] border border-[rgba(242,239,233,0.1)] p-10 text-center">
                    <Award className="w-8 h-8 text-[#4DB6AC] mx-auto" aria-hidden="true" />
                    <h2 className="mt-3 font-display text-lg font-semibold text-[#F2EFE9]">
                      {certStats.total === 0
                        ? 'No certificates added yet'
                        : 'No matching certificates'}
                    </h2>
                    <p className="mt-1.5 text-sm text-[#8C989B] max-w-md mx-auto">
                      {certStats.total === 0
                        ? 'Add your first certificate or achievement using the button above.'
                        : 'Try adjusting your search or filter selections.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {certificates.map((cert) => {
                      const safeVerifyUrl = isSafeHttpUrl(cert.verificationUrl)
                        ? cert.verificationUrl
                        : null;

                      return (
                        <article
                          key={cert.id}
                          className="rounded-xl bg-[#11171A] border border-[rgba(242,239,233,0.1)] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono-tech text-xs text-[#8C989B]">
                              <span
                                className={
                                  cert.status === 'published'
                                    ? 'text-[#4DB6AC]'
                                    : 'text-[#8C989B]'
                                }
                              >
                                {cert.status === 'published' ? 'Published' : 'Draft'}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{cert.category}</span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">
                                Issued {formatDisplayDate(cert.issueDate)}
                              </span>
                              {cert.hasFile && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>
                                    {cert.fileMime === 'application/pdf'
                                      ? 'PDF attached'
                                      : 'Image attached'}
                                  </span>
                                </>
                              )}
                            </div>

                            <h2 className="mt-2 font-display text-lg font-semibold text-[#F2EFE9]">
                              {cert.title}
                            </h2>
                            <p className="text-sm font-medium text-[#C4CCCD]">{cert.issuer}</p>
                            <p className="mt-1.5 text-sm text-[#8C989B] line-clamp-2 max-w-2xl">
                              {cert.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setViewingCert(cert)}
                              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#0A0D0F] hover:bg-[#172024] border border-[rgba(242,239,233,0.14)] text-xs font-medium text-[#F2EFE9] transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditCert(cert)}
                              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#0A0D0F] hover:bg-[#172024] border border-[rgba(242,239,233,0.14)] text-xs font-medium text-[#F2EFE9] transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              disabled={togglingCertId === cert.id}
                              onClick={() => handleToggleCertStatus(cert)}
                              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#1B5E63] hover:bg-[#23747A] disabled:opacity-50 text-xs font-medium text-[#F2EFE9] transition-colors cursor-pointer"
                            >
                              <span>
                                {cert.status === 'published' ? 'Unpublish' : 'Publish'}
                              </span>
                            </button>

                            {safeVerifyUrl && (
                              <a
                                href={safeVerifyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#0A0D0F] hover:bg-[#172024] border border-[rgba(242,239,233,0.14)] text-xs font-medium text-[#4DB6AC] transition-colors"
                              >
                                <span>Verify</span>
                                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => setDeletingCert(cert)}
                              aria-label={`Delete ${cert.title}`}
                              className="inline-flex items-center justify-center min-h-[38px] px-3 py-1.5 rounded-lg bg-[#0A0D0F] hover:bg-[#2A1416] border border-[rgba(242,239,233,0.14)] hover:border-[#F87171]/40 text-xs font-medium text-[#F87171] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================= MESSAGES TAB ================= */}
            {activeTab === 'messages' && (
              <div className="mt-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <dl className="grid grid-cols-2 gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="rounded-xl bg-[#11171A] border border-[rgba(242,239,233,0.1)] px-4 py-3">
                      <dt className="text-[11px] text-[#8C989B]">Total Messages</dt>
                      <dd className="mt-0.5 font-mono-tech text-xl font-semibold text-[#F2EFE9] tabular-nums">
                        {msgStats.total}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-[#11171A] border border-[rgba(242,239,233,0.1)] px-4 py-3">
                      <dt className="text-[11px] text-[#8C989B]">Unread</dt>
                      <dd className="mt-0.5 font-mono-tech text-xl font-semibold text-[#4DB6AC] tabular-nums">
                        {msgStats.unread}
                      </dd>
                    </div>
                  </dl>

                  <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#11171A] border border-[rgba(242,239,233,0.12)] self-start sm:self-auto">
                    {(['all', 'unread', 'read'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setMsgFilter(status)}
                        className={`min-h-[36px] px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer ${
                          msgFilter === status
                            ? 'bg-[#1B5E63] text-[#F2EFE9]'
                            : 'text-[#8C989B] hover:text-[#F2EFE9]'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {msgError && (
                  <div className="rounded-xl bg-[#11171A] border border-[#F87171]/30 p-5 text-sm text-[#F87171]">
                    {msgError}
                  </div>
                )}

                {msgLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((n) => (
                      <div
                        key={n}
                        className="h-24 rounded-xl bg-[#11171A] border border-[rgba(242,239,233,0.08)] animate-pulse"
                      />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="rounded-2xl bg-[#11171A] border border-[rgba(242,239,233,0.1)] p-10 text-center">
                    <Mail className="w-8 h-8 text-[#4DB6AC] mx-auto" aria-hidden="true" />
                    <h2 className="mt-3 font-display text-lg font-semibold text-[#F2EFE9]">
                      No contact messages
                    </h2>
                    <p className="mt-1.5 text-sm text-[#8C989B] max-w-md mx-auto">
                      Submissions sent from your portfolio contact form will appear here for
                      review.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <article
                        key={msg.id}
                        className={`rounded-xl bg-[#11171A] border p-5 sm:p-6 transition-colors ${
                          msg.status === 'unread'
                            ? 'border-[#4DB6AC]/45'
                            : 'border-[rgba(242,239,233,0.1)]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono-tech text-xs text-[#8C989B]">
                              <span
                                className={
                                  msg.status === 'unread' ? 'text-[#4DB6AC] font-semibold' : ''
                                }
                              >
                                {msg.status === 'unread' ? 'UNREAD' : 'READ'}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">
                                {formatDisplayDate(msg.createdAt)}
                              </span>
                            </div>

                            <h2 className="mt-2 font-display text-lg font-semibold text-[#F2EFE9]">
                              {msg.subject}
                            </h2>
                            <p className="mt-0.5 text-xs sm:text-sm text-[#C4CCCD]">
                              {msg.name} &lt;
                              <a
                                href={`mailto:${msg.email}`}
                                className="text-[#4DB6AC] hover:underline"
                              >
                                {msg.email}
                              </a>
                              &gt;
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleMessageRead(msg)}
                              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#0A0D0F] hover:bg-[#172024] border border-[rgba(242,239,233,0.14)] text-xs font-medium text-[#F2EFE9] transition-colors cursor-pointer"
                            >
                              {msg.status === 'unread' ? (
                                <>
                                  <MailOpen className="w-3.5 h-3.5 text-[#4DB6AC]" aria-hidden="true" />
                                  <span>Mark Read</span>
                                </>
                              ) : (
                                <>
                                  <Mail className="w-3.5 h-3.5 text-[#8C989B]" aria-hidden="true" />
                                  <span>Mark Unread</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingMessage(msg)}
                              aria-label={`Delete message from ${msg.name}`}
                              className="inline-flex items-center justify-center min-h-[38px] px-3 py-1.5 rounded-lg bg-[#0A0D0F] hover:bg-[#2A1416] border border-[rgba(242,239,233,0.14)] hover:border-[#F87171]/40 text-xs font-medium text-[#F87171] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <p className="mt-4 pt-4 border-t border-[rgba(242,239,233,0.08)] text-sm text-[#CBC6BC] leading-relaxed whitespace-pre-wrap">
                          {msg.message}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= ADD / EDIT PROJECT MODAL ================= */}
      {projectFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-form-title"
          className="fixed inset-0 z-50 bg-[#07090B]/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#11171A] border border-[rgba(242,239,233,0.14)] shadow-2xl">
            <div className="sticky top-0 z-10 bg-[#11171A] flex items-center justify-between px-6 py-4 border-b border-[rgba(242,239,233,0.1)]">
              <h2 id="project-form-title" className="font-display text-lg font-semibold text-[#F2EFE9]">
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </h2>
              <button
                type="button"
                onClick={() => setProjectFormOpen(false)}
                aria-label="Close project form"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-[#8C989B] hover:text-[#F2EFE9] hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="proj-title" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Project Title *
                  </label>
                  <input
                    id="proj-title"
                    type="text"
                    required
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                    placeholder="e.g. Student Attendance API"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="proj-tech" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Technologies Used * (comma-separated)
                  </label>
                  <input
                    id="proj-tech"
                    type="text"
                    required
                    value={projectForm.technologies}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, technologies: e.target.value })
                    }
                    placeholder="e.g. Node.js, Express.js, MySQL, JavaScript"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  />
                </div>

                <div>
                  <label htmlFor="proj-github" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    GitHub Repository URL (Optional)
                  </label>
                  <input
                    id="proj-github"
                    type="url"
                    value={projectForm.githubUrl}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, githubUrl: e.target.value })
                    }
                    placeholder="https://github.com/Ainechris/..."
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  />
                </div>

                <div>
                  <label htmlFor="proj-live" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Live Demo URL (Optional)
                  </label>
                  <input
                    id="proj-live"
                    type="url"
                    value={projectForm.liveUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, liveUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  />
                </div>

                <div>
                  <label htmlFor="proj-status" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Project Stage *
                  </label>
                  <select
                    id="proj-status"
                    value={projectForm.projectStatus}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        projectStatus: e.target.value as ProjectStatus,
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-2 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  >
                    {PROJECT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="proj-visibility" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Visibility *
                  </label>
                  <select
                    id="proj-visibility"
                    value={projectForm.visibility}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        visibility: e.target.value as PublicationStatus,
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-2 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  >
                    <option value="draft">Draft (Private)</option>
                    <option value="published">Published (Public Portfolio)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="inline-flex items-center gap-2.5 text-sm text-[#F2EFE9] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={projectForm.featured}
                      onChange={(e) =>
                        setProjectForm({ ...projectForm, featured: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#4DB6AC]"
                    />
                    <span>Feature this project prominently at the top of Selected Work</span>
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="proj-desc" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Project Overview *
                  </label>
                  <textarea
                    id="proj-desc"
                    rows={3}
                    required
                    value={projectForm.description}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, description: e.target.value })
                    }
                    placeholder="Summarize what this project does and why you built it."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="proj-problem" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Problem Being Addressed (Optional)
                  </label>
                  <textarea
                    id="proj-problem"
                    rows={2}
                    value={projectForm.problemStatement}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, problemStatement: e.target.value })
                    }
                    placeholder="What practical problem or challenge led to this build?"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="proj-contribution" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    My Contribution (Optional)
                  </label>
                  <textarea
                    id="proj-contribution"
                    rows={2}
                    value={projectForm.myContribution}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, myContribution: e.target.value })
                    }
                    placeholder="Describe your specific role (e.g. backend routes, MySQL schema, frontend UI)."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="proj-features" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Important Features (Optional — one per line)
                  </label>
                  <textarea
                    id="proj-features"
                    rows={3}
                    value={projectForm.keyFeatures}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, keyFeatures: e.target.value })
                    }
                    placeholder={'RESTful CRUD endpoints with input validation\nRelational MySQL storage with foreign keys'}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="proj-process" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Development Process &amp; Learnings (Optional)
                  </label>
                  <textarea
                    id="proj-process"
                    rows={3}
                    value={projectForm.developmentProcess}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, developmentProcess: e.target.value })
                    }
                    placeholder="How you planned, implemented, tested, and improved the project."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <span className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Cover Preview Image (PNG, JPG, WEBP — Max 5 MB)
                  </span>

                  <label className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border border-dashed border-[rgba(242,239,233,0.2)] hover:border-[#4DB6AC] bg-[#0A0D0F] cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-[#4DB6AC]" aria-hidden="true" />
                    <span className="text-xs sm:text-sm font-medium text-[#F2EFE9]">
                      {projectImageFile
                        ? 'Choose another image to replace'
                        : editingProject?.hasImage && !removeProjectImage
                          ? 'Upload a new image to replace current preview'
                          : 'Select PNG, JPG, or WEBP screenshot'}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleProjectImageChange}
                      className="sr-only"
                    />
                  </label>

                  {projectImageFile && (
                    <div className="mt-3 p-4 rounded-xl bg-[#0A0D0F] border border-[rgba(242,239,233,0.12)]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-[#F2EFE9] truncate">
                            {projectImageFile.name}
                          </p>
                          <p className="text-xs text-[#8C989B] font-mono-tech tabular-nums">
                            {formatFileSize(projectImageFile.size)} · Ready to upload
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProjectImageFile(null)}
                          className="text-xs font-medium text-[#F87171] hover:underline cursor-pointer shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                      {selectedProjectPreviewUrl && (
                        <img
                          src={selectedProjectPreviewUrl}
                          alt="Selected project preview"
                          className="mt-3 max-h-48 rounded-lg border border-[rgba(242,239,233,0.12)] object-contain"
                        />
                      )}
                    </div>
                  )}

                  {!projectImageFile && editingProject?.hasImage && !removeProjectImage && (
                    <div className="mt-3 p-4 rounded-xl bg-[#0A0D0F] border border-[rgba(242,239,233,0.12)] flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-[#F2EFE9] truncate">
                          Current image: {editingProject.originalImageName}
                        </p>
                        <p className="text-xs text-[#8C989B] font-mono-tech tabular-nums">
                          {formatFileSize(editingProject.imageSize)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRemoveProjectImage(true)}
                        className="text-xs font-medium text-[#F87171] hover:underline cursor-pointer shrink-0"
                      >
                        Remove image
                      </button>
                    </div>
                  )}
                </div>

                {/* Optional Additional Gallery Screenshots */}
                <div className="sm:col-span-2">
                  <span className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Additional Screenshots for Case Study (Optional — up to 4 images)
                  </span>

                  <label className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border border-dashed border-[rgba(242,239,233,0.16)] hover:border-[#4DB6AC] bg-[#0A0D0F] cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-[#4DB6AC]" aria-hidden="true" />
                    <span className="text-xs font-medium text-[#CBC6BC]">
                      Add extra PNG, JPG, or WEBP screenshots
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleProjectScreenshotsChange}
                      className="sr-only"
                    />
                  </label>

                  {editingProject && editingProject.screenshots.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {editingProject.screenshots
                        .filter((s) => !removedScreenshotIds.includes(s.id))
                        .map((shot) => (
                          <div
                            key={shot.id}
                            className="px-3.5 py-2.5 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.1)] flex items-center justify-between gap-3 text-xs"
                          >
                            <span className="text-[#CBC6BC] truncate">
                              Saved: {shot.originalImageName || 'Screenshot'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setRemovedScreenshotIds((prev) => [...prev, shot.id])
                              }
                              className="text-[#F87171] hover:underline cursor-pointer shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                    </div>
                  )}

                  {projectScreenshotFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {projectScreenshotFiles.map((file, idx) => (
                        <div
                          key={`${file.name}-${idx}`}
                          className="px-3.5 py-2.5 rounded-lg bg-[#0A0D0F] border border-[#4DB6AC]/30 flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="text-[#F2EFE9] truncate">
                            Queued: {file.name} ({formatFileSize(file.size)})
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setProjectScreenshotFiles((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="text-[#F87171] hover:underline cursor-pointer shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {projectFormError && (
                <p role="alert" className="text-xs font-medium text-[#F87171]">
                  {projectFormError}
                </p>
              )}

              <div className="pt-4 border-t border-[rgba(242,239,233,0.1)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProjectFormOpen(false)}
                  className="min-h-[42px] px-4 py-2 rounded-lg bg-[#0A0D0F] hover:bg-[#172024] border border-[rgba(242,239,233,0.14)] text-sm font-medium text-[#F2EFE9] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={projectSaving}
                  className="min-h-[42px] px-5 py-2 rounded-lg bg-[#4DB6AC] hover:bg-[#5EC4BA] disabled:opacity-50 text-sm font-semibold text-[#071618] cursor-pointer"
                >
                  {projectSaving ? 'Saving...' : editingProject ? 'Save Changes' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD / EDIT CERTIFICATE MODAL ================= */}
      {certFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cert-form-title"
          className="fixed inset-0 z-50 bg-[#07090B]/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#11171A] border border-[rgba(242,239,233,0.14)] shadow-2xl">
            <div className="sticky top-0 z-10 bg-[#11171A] flex items-center justify-between px-6 py-4 border-b border-[rgba(242,239,233,0.1)]">
              <h2 id="cert-form-title" className="font-display text-lg font-semibold text-[#F2EFE9]">
                {editingCert ? 'Edit Certificate' : 'Add New Certificate'}
              </h2>
              <button
                type="button"
                onClick={() => setCertFormOpen(false)}
                aria-label="Close certificate form"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-[#8C989B] hover:text-[#F2EFE9] hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCertificate} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="cert-title" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Certificate Title *
                  </label>
                  <input
                    id="cert-title"
                    type="text"
                    required
                    value={certForm.title}
                    onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                    placeholder="e.g. Node.js Backend Fundamentals"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  />
                </div>

                <div>
                  <label htmlFor="cert-issuer" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Issuing Organization *
                  </label>
                  <input
                    id="cert-issuer"
                    type="text"
                    required
                    value={certForm.issuer}
                    onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                    placeholder="e.g. freeCodeCamp"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  />
                </div>

                <div>
                  <label htmlFor="cert-category" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Certificate Category *
                  </label>
                  <select
                    id="cert-category"
                    value={certForm.category}
                    onChange={(e) => setCertForm({ ...certForm, category: e.target.value })}
                    className="w-full min-h-[42px] px-3 py-2 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  >
                    {CERTIFICATE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="cert-issue-date" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Date Issued *
                  </label>
                  <input
                    id="cert-issue-date"
                    type="date"
                    required
                    value={certForm.issueDate}
                    onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  />
                </div>

                <div>
                  <label htmlFor="cert-exp-date" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Expiration Date (Optional)
                  </label>
                  <input
                    id="cert-exp-date"
                    type="date"
                    value={certForm.expirationDate}
                    onChange={(e) => setCertForm({ ...certForm, expirationDate: e.target.value })}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  />
                </div>

                <div>
                  <label htmlFor="cert-cred-id" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Credential ID (Optional)
                  </label>
                  <input
                    id="cert-cred-id"
                    type="text"
                    value={certForm.credentialId}
                    onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })}
                    placeholder="e.g. CERT-2026-001"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  />
                </div>

                <div>
                  <label htmlFor="cert-status" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Publication Status *
                  </label>
                  <select
                    id="cert-status"
                    value={certForm.status}
                    onChange={(e) =>
                      setCertForm({
                        ...certForm,
                        status: e.target.value as PublicationStatus,
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-2 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  >
                    <option value="draft">Draft (Private)</option>
                    <option value="published">Published (Public Portfolio)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="cert-verify-url" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Credential Verification URL (Optional)
                  </label>
                  <input
                    id="cert-verify-url"
                    type="url"
                    value={certForm.verificationUrl}
                    onChange={(e) =>
                      setCertForm({ ...certForm, verificationUrl: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="cert-desc" className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Certificate Description *
                  </label>
                  <textarea
                    id="cert-desc"
                    rows={3}
                    required
                    value={certForm.description}
                    onChange={(e) => setCertForm({ ...certForm, description: e.target.value })}
                    placeholder="Summarize the skills, coursework, or competencies verified by this certificate."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0D0F] border border-[rgba(242,239,233,0.14)] focus:border-[#4DB6AC] focus:outline-none text-sm text-[#F2EFE9]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <span className="block text-xs font-medium text-[#CBC6BC] mb-1.5">
                    Certificate Image or PDF Upload (Max 5 MB)
                  </span>

                  <label className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border border-dashed border-[rgba(242,239,233,0.2)] hover:border-[#4DB6AC] bg-[#0A0D0F] cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-[#4DB6AC]" aria-hidden="true" />
                    <span className="text-xs sm:text-sm font-medium text-[#F2EFE9]">
                      {selectedCertFile
                        ? 'Choose another file to replace'
                        : editingCert?.hasFile && !removeExistingCertFile
                          ? 'Upload a new file to replace the current document'
                          : 'Select PNG, JPG, WEBP image or PDF document'}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={handleCertFileChange}
                      className="sr-only"
                    />
                  </label>

                  {selectedCertFile && (
                    <div className="mt-3 p-4 rounded-xl bg-[#0A0D0F] border border-[rgba(242,239,233,0.12)]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-[#F2EFE9] truncate">
                            {selectedCertFile.name}
                          </p>
                          <p className="text-xs text-[#8C989B] font-mono-tech tabular-nums">
                            {formatFileSize(selectedCertFile.size)} · Ready to upload
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCertFile(null)}
                          className="text-xs font-medium text-[#F87171] hover:underline cursor-pointer shrink-0"
                        >
                          Remove
                        </button>
                      </div>

                      {selectedCertPreviewUrl && (
                        <img
                          src={selectedCertPreviewUrl}
                          alt="Selected certificate preview"
                          className="mt-3 max-h-48 rounded-lg border border-[rgba(242,239,233,0.12)] object-contain"
                        />
                      )}
                    </div>
                  )}

                  {!selectedCertFile && editingCert?.hasFile && !removeExistingCertFile && (
                    <div className="mt-3 p-4 rounded-xl bg-[#0A0D0F] border border-[rgba(242,239,233,0.12)] flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-[#F2EFE9] truncate">
                          Current file: {editingCert.originalFileName}
                        </p>
                        <p className="text-xs text-[#8C989B] font-mono-tech tabular-nums">
                          {formatFileSize(editingCert.fileSize)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRemoveExistingCertFile(true)}
                        className="text-xs font-medium text-[#F87171] hover:underline cursor-pointer shrink-0"
                      >
                        Remove file
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {certFormError && (
                <p role="alert" className="text-xs font-medium text-[#F87171]">
                  {certFormError}
                </p>
              )}

              <div className="pt-4 border-t border-[rgba(242,239,233,0.1)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCertFormOpen(false)}
                  className="min-h-[42px] px-4 py-2 rounded-lg bg-[#0A0D0F] hover:bg-[#172024] border border-[rgba(242,239,233,0.14)] text-sm font-medium text-[#F2EFE9] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={certSaving}
                  className="min-h-[42px] px-5 py-2 rounded-lg bg-[#4DB6AC] hover:bg-[#5EC4BA] disabled:opacity-50 text-sm font-semibold text-[#071618] cursor-pointer"
                >
                  {certSaving ? 'Saving...' : editingCert ? 'Save Changes' : 'Save Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW CERTIFICATE MODAL ================= */}
      {viewingCert && token && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-cert-title"
          className="fixed inset-0 z-50 bg-[#07090B]/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setViewingCert(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#11171A] border border-[rgba(242,239,233,0.14)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(242,239,233,0.1)]">
              <div>
                <p className="font-mono-tech text-xs text-[#4DB6AC]">
                  {viewingCert.status === 'published' ? 'Published' : 'Draft'} · {viewingCert.category}
                </p>
                <h2 id="view-cert-title" className="font-display text-lg font-semibold text-[#F2EFE9]">
                  {viewingCert.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingCert(null)}
                aria-label="Close details"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-[#8C989B] hover:text-[#F2EFE9] hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {viewingCert.fileUrl && (
                <SecureAssetPreview
                  fileUrl={viewingCert.fileUrl}
                  fileMime={viewingCert.fileMime}
                  title={viewingCert.title}
                  originalFileName={viewingCert.originalFileName}
                  token={token}
                />
              )}

              <p className="text-sm text-[#CBC6BC] leading-relaxed">{viewingCert.description}</p>

              <dl className="divide-y divide-[rgba(242,239,233,0.1)] border-t border-b border-[rgba(242,239,233,0.1)] text-sm">
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#8C989B]">Issuing Organization</dt>
                  <dd className="font-medium text-[#F2EFE9]">{viewingCert.issuer}</dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#8C989B]">Date Issued</dt>
                  <dd className="font-mono-tech tabular-nums text-[#F2EFE9]">
                    {formatDisplayDate(viewingCert.issueDate)}
                  </dd>
                </div>
                {viewingCert.expirationDate && (
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-[#8C989B]">Expiration Date</dt>
                    <dd className="font-mono-tech tabular-nums text-[#F2EFE9]">
                      {formatDisplayDate(viewingCert.expirationDate)}
                    </dd>
                  </div>
                )}
                {viewingCert.credentialId && (
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-[#8C989B]">Credential ID</dt>
                    <dd className="font-mono-tech text-[#F2EFE9]">{viewingCert.credentialId}</dd>
                  </div>
                )}
              </dl>

              {isSafeHttpUrl(viewingCert.verificationUrl) && (
                <div className="flex justify-end">
                  <a
                    href={viewingCert.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#4DB6AC] hover:bg-[#5EC4BA] text-[#071618] text-sm font-semibold"
                  >
                    <span>Open Verification Link</span>
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODALS ================= */}
      {deletingProject && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-proj-title"
          className="fixed inset-0 z-50 bg-[#07090B]/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#11171A] border border-[rgba(242,239,233,0.14)] shadow-2xl p-6">
            <h2 id="delete-proj-title" className="font-display text-lg font-semibold text-[#F2EFE9]">
              Delete project?
            </h2>
            <p className="mt-2 text-sm text-[#8C989B] leading-relaxed">
              This will permanently remove{' '}
              <strong className="font-semibold text-[#F2EFE9]">{deletingProject.title}</strong> and
              its uploaded preview image from the server.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingProject(null)}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0A0D0F] hover:bg-[#172024] border border-[rgba(242,239,233,0.14)] text-sm font-medium text-[#F2EFE9] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteProjectBusy}
                onClick={handleConfirmDeleteProject}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 text-sm font-medium text-white cursor-pointer"
              >
                {deleteProjectBusy ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingCert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-cert-title"
          className="fixed inset-0 z-50 bg-[#07090B]/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#11171A] border border-[rgba(242,239,233,0.14)] shadow-2xl p-6">
            <h2 id="delete-cert-title" className="font-display text-lg font-semibold text-[#F2EFE9]">
              Delete certificate?
            </h2>
            <p className="mt-2 text-sm text-[#8C989B] leading-relaxed">
              This will permanently remove{' '}
              <strong className="font-semibold text-[#F2EFE9]">{deletingCert.title}</strong> and
              any uploaded file from the server.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingCert(null)}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0A0D0F] hover:bg-[#172024] border border-[rgba(242,239,233,0.14)] text-sm font-medium text-[#F2EFE9] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteCertBusy}
                onClick={handleConfirmDeleteCert}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 text-sm font-medium text-white cursor-pointer"
              >
                {deleteCertBusy ? 'Deleting...' : 'Delete Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingMessage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-msg-title"
          className="fixed inset-0 z-50 bg-[#07090B]/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#11171A] border border-[rgba(242,239,233,0.14)] shadow-2xl p-6">
            <h2 id="delete-msg-title" className="font-display text-lg font-semibold text-[#F2EFE9]">
              Delete message?
            </h2>
            <p className="mt-2 text-sm text-[#8C989B] leading-relaxed">
              Permanently remove the inquiry from{' '}
              <strong className="font-semibold text-[#F2EFE9]">{deletingMessage.name}</strong>?
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingMessage(null)}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0A0D0F] hover:bg-[#172024] border border-[rgba(242,239,233,0.14)] text-sm font-medium text-[#F2EFE9] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMsgBusy}
                onClick={handleConfirmDeleteMessage}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 text-sm font-medium text-white cursor-pointer"
              >
                {deleteMsgBusy ? 'Deleting...' : 'Delete Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
