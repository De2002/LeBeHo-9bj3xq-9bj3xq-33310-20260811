import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
}

const BASE_URL = 'https://lebelho.onspace.app';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
const SITE_NAME = 'LeBeHo — Let\'s Be Honest';

export function SEOHead({
  title,
  description = 'A pseudonymous social platform for honest opinions. Share what you really think — anonymously — on life, society, politics, relationships and more.',
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noIndex = false,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} — LeBeHo` : SITE_NAME;
  const canonicalUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Helper to upsert a meta tag
    const setMeta = (attr: string, attrVal: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // Basic meta
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noIndex ? 'noindex,nofollow' : 'index,follow');
    setMeta('name', 'author', 'LeBeHo');
    setMeta('name', 'theme-color', '#000000');

    // Open Graph
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:locale', 'en_US');

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);
    setMeta('name', 'twitter:site', '@lebelho');

    // Canonical
    setLink('canonical', canonicalUrl);

    return () => {
      // Reset to defaults on unmount
      document.title = SITE_NAME;
    };
  }, [fullTitle, description, image, canonicalUrl, type, noIndex]);

  return null;
}
