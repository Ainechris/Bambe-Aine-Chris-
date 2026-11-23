export type PageSectionId =
  | 'home'
  | 'about'
  | 'process'
  | 'work'
  | 'skills'
  | 'certificates'
  | 'contact';

export interface SeoRouteMeta {
  path: string;
  sectionId: PageSectionId;
  label: string;
  title: string;
  description: string;
  keywords: string;
  ogType: 'profile' | 'website';
  priority: string;
  changefreq: string;
}

export const PERSON_IDENTITY = {
  fullName: 'BAMBE Aine Chris',
  displayName: 'Aine Chris',
  alternateNames: [
    'Bambe Aine Chris',
    'Aine Chris',
    'Ainechris',
    'Bambe Aine',
    'Chris Aine',
    'Aine Chris Software Developer',
    'Bambe Aine Chris Rwanda',
    'Aine Chris Backend Developer',
  ],
  jobTitle: 'Student Software Developer',
  careerDirection: 'Backend Developer',
  institution: 'Intango TSS',
  program: 'Software Development (L4 SOD)',
  expectedGraduation: '2028',
  schoolLocation: 'Busaanza, Rwanda',
  schoolOwner: 'CLA (located in Nyarutarama)',
  location: 'Busaanza, Rwanda',
  email: 'ainechrisb@gmail.com',
  githubUrl: 'https://github.com/Ainechris',
  instagramUrl: 'https://www.instagram.com/__aine_.23/',
  youtubeUrl: null as string | null,
  ogImagePath: '/og-image.jpg',
} as const;

export const SITE_KEYWORDS =
  'BAMBE Aine Chris, Aine Chris, Ainechris, Student Software Developer, Backend Developer Rwanda, Intango TSS, Busaanza, JavaScript, Node.js, Express.js, MySQL, Software Engineering Portfolio';

export const PUBLIC_ROUTES: SeoRouteMeta[] = [
  {
    path: '/',
    sectionId: 'home',
    label: 'Home',
    title: 'BAMBE Aine Chris (Ainechris) — Software Developer',
    description:
      'Portfolio of BAMBE Aine Chris (Ainechris), Level 4 Software Development student at Intango TSS in Busaanza, Rwanda building Node.js, Express, and MySQL backends.',
    keywords: SITE_KEYWORDS,
    ogType: 'profile',
    priority: '1.0',
    changefreq: 'weekly',
  },
  {
    path: '/about',
    sectionId: 'about',
    label: 'About',
    title: 'About BAMBE Aine Chris | Intango TSS Rwanda',
    description:
      'About BAMBE Aine Chris (Ainechris), a Level 4 Software Development student at Intango TSS in Busaanza, Rwanda specializing in practical backend engineering.',
    keywords: `${SITE_KEYWORDS}, Intango TSS Busaanza, CLA Nyarutarama, Class of 2028`,
    ogType: 'profile',
    priority: '0.9',
    changefreq: 'monthly',
  },
  {
    path: '/process',
    sectionId: 'process',
    label: 'Process',
    title: 'Development Process | BAMBE Aine Chris',
    description:
      'Explore how BAMBE Aine Chris approaches backend and web engineering across five stages: Discover, Explore, Build, Refine, and Create.',
    keywords: `${SITE_KEYWORDS}, Software Engineering Workflow, REST API Architecture`,
    ogType: 'website',
    priority: '0.7',
    changefreq: 'monthly',
  },
  {
    path: '/work',
    sectionId: 'work',
    label: 'Work',
    title: 'Selected Work & Projects | BAMBE Aine Chris',
    description:
      'Explore software projects, backend builds, and GitHub repositories by BAMBE Aine Chris (Ainechris), student software developer in Busaanza, Rwanda.',
    keywords: `${SITE_KEYWORDS}, Software Projects, GitHub Repositories`,
    ogType: 'website',
    priority: '0.9',
    changefreq: 'weekly',
  },
  {
    path: '/skills',
    sectionId: 'skills',
    label: 'Skills',
    title: 'Technical Stack & Skills | BAMBE Aine Chris',
    description:
      'Core technical stack of BAMBE Aine Chris: JavaScript, Node.js, Express.js, MySQL, database fundamentals, HTML5, CSS3, Git, and GitHub.',
    keywords: `${SITE_KEYWORDS}, HTML5, CSS3, Git, GitHub, SQL`,
    ogType: 'website',
    priority: '0.8',
    changefreq: 'monthly',
  },
  {
    path: '/certificates',
    sectionId: 'certificates',
    label: 'Certificates',
    title: 'Certificates & Credentials | BAMBE Aine Chris',
    description:
      'Verified technical certificates, completed programs, and software development learning milestones published by BAMBE Aine Chris.',
    keywords: `${SITE_KEYWORDS}, Certificates, Credentials, Learning Milestones`,
    ogType: 'website',
    priority: '0.8',
    changefreq: 'weekly',
  },
  {
    path: '/contact',
    sectionId: 'contact',
    label: 'Contact',
    title: 'Contact BAMBE Aine Chris | Internships & Roles',
    description:
      'Contact BAMBE Aine Chris (Ainechris) for internships, junior software roles, scholarships, freelance builds, and developer collaborations.',
    keywords: `${SITE_KEYWORDS}, Software Internship Rwanda, Backend Collaboration`,
    ogType: 'website',
    priority: '0.8',
    changefreq: 'monthly',
  },
];

export const ADMIN_ROUTE_META = {
  path: '/admin',
  title: 'Admin Dashboard | BAMBE Aine Chris Portfolio',
  description: 'Private portfolio management dashboard.',
};

export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const cleaned = pathname.replace(/\/+$/, '');
  return cleaned || '/';
}

export function findPublicRoute(pathname: string): SeoRouteMeta | null {
  const normalized = normalizePathname(pathname);
  return PUBLIC_ROUTES.find((r) => r.path === normalized) ?? null;
}

export function resolveAbsoluteAssetUrl(origin: string, assetPath: string | null | undefined): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  if (!assetPath) return `${cleanOrigin}${PERSON_IDENTITY.ogImagePath}`;
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${cleanOrigin}${normalizedPath}`;
}

export function buildJsonLdGraph(origin: string, currentPath: string) {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const normalizedPath = normalizePathname(currentPath);
  const pageUrl = `${cleanOrigin}${normalizedPath === '/' ? '' : normalizedPath}` || cleanOrigin;
  const imageUrl = `${cleanOrigin}${PERSON_IDENTITY.ogImagePath}`;
  const personId = `${cleanOrigin}/#person`;
  const websiteId = `${cleanOrigin}/#website`;

  const routeMeta = findPublicRoute(normalizedPath) ?? PUBLIC_ROUTES[0];
  const isProfilePage = routeMeta.ogType === 'profile';

  const graph: Array<Record<string, unknown>> = [
    {
      '@type': 'Person',
      '@id': personId,
      name: PERSON_IDENTITY.fullName,
      alternateName: PERSON_IDENTITY.alternateNames,
      url: cleanOrigin,
      image: imageUrl,
      email: `mailto:${PERSON_IDENTITY.email}`,
      jobTitle: PERSON_IDENTITY.jobTitle,
      description:
        'BAMBE Aine Chris (Aine Chris / Ainechris) is a Level 4 Software Development student at Intango TSS in Busaanza, Rwanda working toward becoming a backend developer.',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Busaanza',
        addressCountry: 'RW',
        addressRegion: 'Rwanda',
      },
      affiliation: {
        '@type': 'EducationalOrganization',
        name: PERSON_IDENTITY.institution,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Busaanza',
          addressCountry: 'RW',
        },
        parentOrganization: {
          '@type': 'Organization',
          name: 'CLA',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Nyarutarama',
            addressCountry: 'RW',
          },
        },
      },
      knowsAbout: [
        'Software Development',
        'Backend Development',
        'JavaScript',
        'Node.js',
        'Express.js',
        'MySQL',
        'Database Fundamentals',
        'Web Development',
        'HTML5',
        'CSS3',
        'Git',
        'GitHub',
        'Problem Solving',
      ],
      sameAs: [PERSON_IDENTITY.githubUrl, PERSON_IDENTITY.instagramUrl],
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: cleanOrigin,
      name: 'BAMBE Aine Chris — Software Developer Portfolio',
      alternateName: ['Bambe Aine Chris Portfolio', 'Aine Chris Portfolio', 'Ainechris Portfolio'],
      description: PUBLIC_ROUTES[0].description,
      inLanguage: 'en',
      publisher: { '@id': personId },
      creator: { '@id': personId },
    },
    {
      '@type': isProfilePage ? 'ProfilePage' : normalizedPath === '/work' || normalizedPath === '/certificates' ? 'CollectionPage' : 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: routeMeta.title,
      description: routeMeta.description,
      inLanguage: 'en',
      isPartOf: { '@id': websiteId },
      about: { '@id': personId },
      mainEntity: { '@id': personId },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: imageUrl,
        width: 1200,
        height: 630,
      },
    },
  ];

  if (normalizedPath !== '/') {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'BAMBE Aine Chris',
          item: cleanOrigin,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: routeMeta.label,
          item: pageUrl,
        },
      ],
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

export function buildProjectJsonLdGraph(
  origin: string,
  project: {
    slug: string;
    title: string;
    description: string;
    technologies: string[];
    githubUrl: string | null;
    liveUrl: string | null;
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
  },
) {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const projectUrl = `${cleanOrigin}/work/${encodeURIComponent(project.slug)}`;
  const imageUrl = resolveAbsoluteAssetUrl(cleanOrigin, project.imageUrl);
  const personId = `${cleanOrigin}/#person`;
  const websiteId = `${cleanOrigin}/#website`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': personId,
        name: PERSON_IDENTITY.fullName,
        url: cleanOrigin,
        sameAs: [PERSON_IDENTITY.githubUrl, PERSON_IDENTITY.instagramUrl],
      },
      {
        '@type': 'SoftwareSourceCode',
        '@id': `${projectUrl}#software`,
        name: project.title,
        description: project.description,
        url: project.liveUrl || projectUrl,
        codeRepository: project.githubUrl || undefined,
        programmingLanguage: project.technologies,
        image: imageUrl,
        dateCreated: project.createdAt,
        dateModified: project.updatedAt,
        author: { '@id': personId },
      },
      {
        '@type': 'WebPage',
        '@id': `${projectUrl}#webpage`,
        url: projectUrl,
        name: `${project.title} | BAMBE Aine Chris`,
        description: project.description,
        inLanguage: 'en',
        isPartOf: { '@id': websiteId },
        mainEntity: { '@id': `${projectUrl}#software` },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: imageUrl,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'BAMBE Aine Chris',
            item: cleanOrigin,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Selected Work',
            item: `${cleanOrigin}/work`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: project.title,
            item: projectUrl,
          },
        ],
      },
    ],
  };
}
