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

export const PUBLIC_ROUTES: SeoRouteMeta[] = [
  {
    path: '/',
    sectionId: 'home',
    label: 'Home',
    title: 'BAMBE Aine Chris (Ainechris) | Student Software Developer',
    description:
      'Portfolio of BAMBE Aine Chris (Aine Chris / Ainechris), a Level 4 Software Development student at Intango TSS in Busaanza, Rwanda focused on backend engineering with JavaScript, Node.js, Express.js, and MySQL.',
    priority: '1.0',
    changefreq: 'weekly',
  },
  {
    path: '/about',
    sectionId: 'about',
    label: 'About',
    title: 'About BAMBE Aine Chris | Intango TSS Software Development Student',
    description:
      'Learn about BAMBE Aine Chris (Bambe Aine Chris / Ainechris), a Level 4 Software Development student at Intango TSS in Busaanza, Rwanda aiming to specialize in backend engineering.',
    priority: '0.9',
    changefreq: 'monthly',
  },
  {
    path: '/process',
    sectionId: 'process',
    label: 'Process',
    title: 'How BAMBE Aine Chris Works | Software Development Process',
    description:
      'Explore how BAMBE Aine Chris approaches software engineering and problem-solving across five stages: Discover, Explore, Build, Refine, and Create.',
    priority: '0.7',
    changefreq: 'monthly',
  },
  {
    path: '/work',
    sectionId: 'work',
    label: 'Work',
    title: 'Selected Work & Projects | BAMBE Aine Chris (Ainechris)',
    description:
      'Explore software development projects, backend builds, and public GitHub repositories by BAMBE Aine Chris in Busaanza, Rwanda.',
    priority: '0.9',
    changefreq: 'weekly',
  },
  {
    path: '/skills',
    sectionId: 'skills',
    label: 'Skills',
    title: 'Technical Stack & Skills | BAMBE Aine Chris (Ainechris)',
    description:
      'Technical stack of BAMBE Aine Chris including JavaScript, Node.js, Express.js, HTML, CSS, MySQL, database fundamentals, Git, and GitHub.',
    priority: '0.8',
    changefreq: 'monthly',
  },
  {
    path: '/certificates',
    sectionId: 'certificates',
    label: 'Certificates',
    title: 'Certificates & Learning Milestones | BAMBE Aine Chris',
    description:
      'Documented courses, credentials, and learning milestones published by software development student BAMBE Aine Chris.',
    priority: '0.8',
    changefreq: 'weekly',
  },
  {
    path: '/contact',
    sectionId: 'contact',
    label: 'Contact',
    title: 'Contact BAMBE Aine Chris | Internships, Projects & Collaborations',
    description:
      'Connect with BAMBE Aine Chris (Aine Chris) for internships, software development roles, scholarships, freelance projects, and technical collaborations.',
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

export function buildJsonLdGraph(origin: string, currentPath: string) {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const normalizedPath = normalizePathname(currentPath);
  const pageUrl = `${cleanOrigin}${normalizedPath === '/' ? '' : normalizedPath}` || cleanOrigin;
  const imageUrl = `${cleanOrigin}${PERSON_IDENTITY.ogImagePath}`;
  const personId = `${cleanOrigin}/#person`;
  const websiteId = `${cleanOrigin}/#website`;

  const routeMeta = findPublicRoute(normalizedPath) ?? PUBLIC_ROUTES[0];

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
        'HTML',
        'CSS',
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
    },
    {
      '@type': 'ProfilePage',
      '@id': `${pageUrl}#profilepage`,
      url: pageUrl,
      name: routeMeta.title,
      description: routeMeta.description,
      isPartOf: { '@id': websiteId },
      about: { '@id': personId },
      mainEntity: { '@id': personId },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: imageUrl,
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
  const imageUrl = project.imageUrl
    ? `${cleanOrigin}${project.imageUrl}`
    : `${cleanOrigin}${PERSON_IDENTITY.ogImagePath}`;
  const personId = `${cleanOrigin}/#person`;
  const websiteId = `${cleanOrigin}/#website`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
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
        isPartOf: { '@id': websiteId },
        mainEntity: { '@id': `${projectUrl}#software` },
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
