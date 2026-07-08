import { connectDB } from '@/lib/mongodb';
import Activity from '@/models/Activity';

export type ActivityAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'export';
export type ActivityEntity = 'package' | 'hotel' | 'enquiry' | 'settings' | 'user';

export interface LogActivityInput {
  action: ActivityAction;
  entityType: ActivityEntity;
  actor: string;
  entityId?: string;
  entityName?: string;
  details?: string;
  ipAddress?: string;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await connectDB();
    await Activity.create({
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      entityName: input.entityName,
      adminEmail: input.actor,
      details: input.details,
      ipAddress: input.ipAddress,
    });
  } catch (error) {
    console.error('[activity] failed to log', input.action, input.entityType, error);
  }
}

export async function listRecentActivity(limit = 10) {
  await connectDB();
  return Activity.find().sort({ createdAt: -1 }).limit(limit).lean();
}
