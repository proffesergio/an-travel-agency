import { connectDB } from '@/lib/mongodb';
import Package, { type IPackage } from '@/models/Package';
import { logActivity } from '@/lib/services/activity';
import type { PackageInput, PackageUpdate } from '@/lib/validation/package';

export interface PackageFilters {
  category?: string;
  search?: string;
  available?: boolean;
}

export async function listPackages(filters: PackageFilters = {}) {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filters.category && filters.category !== 'all') query.category = filters.category;
  if (typeof filters.available === 'boolean') query.available = filters.available;
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { titleBn: { $regex: filters.search, $options: 'i' } },
    ];
  }
  return Package.find(query).sort({ createdAt: -1 }).lean();
}

export async function getPackageById(id: string) {
  await connectDB();
  return Package.findById(id).lean();
}

export async function getPackageBySlug(slug: string) {
  await connectDB();
  return Package.findOne({ slug }).lean();
}

export async function createPackage(input: PackageInput, actor: string): Promise<IPackage> {
  await connectDB();
  const pkg = await Package.create(input);
  await logActivity({
    action: 'create',
    entityType: 'package',
    entityId: pkg._id.toString(),
    entityName: pkg.title,
    actor,
    details: `Created ${pkg.category} package: ${pkg.title}`,
  });
  return pkg;
}

export async function updatePackage(
  id: string,
  input: PackageUpdate,
  actor: string
): Promise<IPackage | null> {
  await connectDB();
  const pkg = await Package.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!pkg) return null;
  await logActivity({
    action: 'update',
    entityType: 'package',
    entityId: id,
    entityName: pkg.title,
    actor,
    details: `Updated ${pkg.category} package: ${pkg.title}`,
  });
  return pkg;
}

export async function deletePackage(id: string, actor: string): Promise<IPackage | null> {
  await connectDB();
  const pkg = await Package.findByIdAndDelete(id);
  if (!pkg) return null;
  await logActivity({
    action: 'delete',
    entityType: 'package',
    entityId: id,
    entityName: pkg.title,
    actor,
    details: `Deleted ${pkg.category} package: ${pkg.title}`,
  });
  return pkg;
}
