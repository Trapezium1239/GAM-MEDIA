import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://gam.church';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/sermons', '/music', '/programs', '/giving', '/gallery', '/welcome', '/devotional', '/pastor', '/roster', '/projects'],
        disallow: ['/app', '/admin', '/profile', '/login', '/settings', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}