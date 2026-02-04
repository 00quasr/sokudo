import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export type TeamRole = 'owner' | 'admin' | 'member';

const ROLE_HIERARCHY: Record<TeamRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export function isAtLeastRole(userRole: string, requiredRole: TeamRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as TeamRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  return userLevel >= requiredLevel;
}

export function isAdmin(role: string): boolean {
  return isAtLeastRole(role, 'admin');
}

export function isOwner(role: string): boolean {
  return role === 'owner';
}

export interface TeamMembership {
  id: number;
  userId: number;
  teamId: number;
  role: string;
}

export async function getTeamMembership(userId: number): Promise<TeamMembership | null> {
  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, userId),
  });
  return membership ?? null;
}

export async function requireTeamMembership(userId: number): Promise<TeamMembership> {
  const membership = await getTeamMembership(userId);
  if (!membership) {
    throw new Error('User is not a member of any team');
  }
  return membership;
}

export async function requireTeamAdmin(userId: number): Promise<TeamMembership> {
  const membership = await requireTeamMembership(userId);
  if (!isAdmin(membership.role)) {
    throw new Error('Insufficient permissions: admin role required');
  }
  return membership;
}

export async function requireTeamOwner(userId: number): Promise<TeamMembership> {
  const membership = await requireTeamMembership(userId);
  if (!isOwner(membership.role)) {
    throw new Error('Insufficient permissions: owner role required');
  }
  return membership;
}

export async function getAuthenticatedUser() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
}

export async function canManageMembers(userId: number): Promise<boolean> {
  const membership = await getTeamMembership(userId);
  if (!membership) return false;
  return isAdmin(membership.role);
}

export async function canViewTeamStats(userId: number): Promise<boolean> {
  const membership = await getTeamMembership(userId);
  if (!membership) return false;
  return isAdmin(membership.role);
}

export async function canCreateChallenges(userId: number): Promise<boolean> {
  const membership = await getTeamMembership(userId);
  if (!membership) return false;
  return isAdmin(membership.role);
}

export async function canRemoveMember(
  actorRole: string,
  targetRole: string,
  actorUserId: number,
  targetUserId: number
): Promise<boolean> {
  if (actorUserId === targetUserId) return false;
  if (!isAdmin(actorRole)) return false;
  // Admins cannot remove owners; owners can remove anyone else
  if (isOwner(targetRole)) return false;
  // Admins can only remove members, not other admins (unless they are the owner)
  if (isAdmin(targetRole) && !isOwner(actorRole)) return false;
  return true;
}

export async function canUpdateMemberRole(
  actorRole: string,
  targetRole: string,
  newRole: TeamRole,
  actorUserId: number,
  targetUserId: number
): Promise<boolean> {
  if (actorUserId === targetUserId) return false;
  if (!isOwner(actorRole)) return false;
  // Cannot assign owner role
  if (newRole === 'owner') return false;
  // Cannot change another owner's role
  if (isOwner(targetRole)) return false;
  return true;
}
