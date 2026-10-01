import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gam.church';
  const lastModified = new Date();
  
  const publicRoutes = [
    '',
    '/sermons',
    '/music',
    '/programs',
    '/giving',
    '/gallery',
    '/welcome',
    '/devotional',
    '/devotional/archive',
    '/pastor',
    '/roster',
    '/projects',
  ];
  
  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));
}