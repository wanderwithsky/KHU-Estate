import { prisma } from '../index';

/**
 * Validates if the requesting user has hierarchy access to the target user.
 * ADMIN has access to all.
 * SENIOR_TL has access to their TLs and their TL's Associates.
 * TEAM_LEADER has access only to their Associates.
 * ASSOCIATE has access only to themselves.
 */
export async function canAccessUser(requestingUserId: string, requestingUserRole: string, targetUserId: string): Promise<boolean> {
  if (requestingUserRole === 'ADMIN') return true;
  if (requestingUserId === targetUserId) return true;

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { parentUserId: true, seniorTlId: true }
  });

  if (!targetUser) return false;

  if (requestingUserRole === 'TEAM_LEADER') {
    return targetUser.parentUserId === requestingUserId;
  }

  if (requestingUserRole === 'SENIOR_TL') {
    return targetUser.seniorTlId === requestingUserId || targetUser.parentUserId === requestingUserId;
  }

  return false;
}

/**
 * Validates if the requesting user has access to a specific Associate Application.
 */
export async function canAccessApplication(requestingUserId: string, requestingUserRole: string, applicationId: string): Promise<boolean> {
  if (requestingUserRole === 'ADMIN') return true;

  const app = await prisma.associateApplication.findUnique({
    where: { id: applicationId },
    select: { assignedTeamLeaderId: true, assignedSeniorTlId: true }
  });

  if (!app) return false;

  if (requestingUserRole === 'TEAM_LEADER') {
    return app.assignedTeamLeaderId === requestingUserId;
  }

  if (requestingUserRole === 'SENIOR_TL') {
    return app.assignedSeniorTlId === requestingUserId;
  }

  return false;
}
