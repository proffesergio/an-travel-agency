import {
  listPackages,
  getPackageBySlug as getDbPackageBySlug,
} from '@/lib/services/packages';
import { ALL_PACKAGES } from '@/lib/seed-data';

export type PackageCategory = 'hajj' | 'umrah' | 'tour';

/**
 * Unified shape consumed by public pages — works for both MongoDB packages
 * (created in the admin panel) and the bundled seed/demo packages.
 */
export interface DisplayPackage {
  id: string;
  slug: string;
  category: PackageCategory;
  title: string;
  titleBn: string;
  price: number;
  duration: string;
  durationBn: string;
  featured: boolean;
  imageUrl: string;
  description: string;
  descriptionBn: string;
  inclusions: string[];
  itinerary: { day: string; title: string; description: string }[];
}

interface DbPackageDoc {
  _id: unknown;
  slug: string;
  category: PackageCategory;
  title: string;
  titleBn?: string;
  price: number;
  duration: string;
  durationBn?: string;
  featured?: boolean;
  available?: boolean;
  imageUrl?: string;
  description?: string;
  descriptionBn?: string;
  inclusions?: string[];
  itinerary?: { day?: string; title?: string; description?: string }[];
}

function fromDb(doc: DbPackageDoc): DisplayPackage {
  return {
    id: String(doc._id),
    slug: doc.slug,
    category: doc.category,
    title: doc.title,
    titleBn: doc.titleBn || doc.title,
    price: doc.price,
    duration: doc.duration,
    durationBn: doc.durationBn || doc.duration,
    featured: Boolean(doc.featured),
    imageUrl: doc.imageUrl || '',
    description: doc.description || '',
    descriptionBn: doc.descriptionBn || doc.description || '',
    inclusions: doc.inclusions ?? [],
    itinerary: (doc.itinerary ?? []).map((d) => ({
      day: d.day ?? '',
      title: d.title ?? '',
      description: d.description ?? '',
    })),
  };
}

function seedByCategory(category: PackageCategory): DisplayPackage[] {
  return ALL_PACKAGES.filter((p) => p.category === category).map((p) => ({
    ...p,
    featured: Boolean(p.featured),
  }));
}

/**
 * Packages created in the admin panel take over as soon as at least one
 * available package exists for the category; the seed/demo packages remain
 * as a fallback so the site never renders empty (also covers DB outages).
 */
export async function getDisplayPackagesByCategory(
  category: PackageCategory
): Promise<DisplayPackage[]> {
  try {
    const docs = (await listPackages({ category, available: true })) as unknown as DbPackageDoc[];
    if (docs.length > 0) return docs.map(fromDb);
  } catch (error) {
    console.error(`[data/packages] DB unavailable for category ${category}, using seed`, error);
  }
  return seedByCategory(category);
}

export async function getDisplayPackageBySlug(slug: string): Promise<DisplayPackage | null> {
  try {
    const doc = (await getDbPackageBySlug(slug)) as unknown as DbPackageDoc | null;
    if (doc && doc.available !== false) return fromDb(doc);
  } catch (error) {
    console.error(`[data/packages] DB unavailable for slug ${slug}, using seed`, error);
  }
  const seed = ALL_PACKAGES.find((p) => p.slug === slug);
  return seed ? { ...seed, featured: Boolean(seed.featured) } : null;
}

export async function getFeaturedDisplayPackages(): Promise<DisplayPackage[]> {
  try {
    const docs = (await listPackages({ available: true })) as unknown as DbPackageDoc[];
    const featured = docs.filter((d) => d.featured);
    if (featured.length > 0) return featured.map(fromDb);
  } catch (error) {
    console.error('[data/packages] DB unavailable for featured, using seed', error);
  }
  return ALL_PACKAGES.filter((p) => p.featured).map((p) => ({
    ...p,
    featured: true,
  }));
}
