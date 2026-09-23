import { Router } from 'express';
import { prisma } from '../index';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';

const router = Router();

// POST /api/associate-applications (Public)
router.post('/', async (req, res) => {
  try {
    const { fullName, phone, email, city, message } = req.body;
    
    if (!fullName || !phone || !email) {
      return res.status(400).json({ error: 'Name, phone, and email are required' });
    }

    const application = await prisma.associateApplication.create({
      data: {
        fullName,
        phone,
        email,
        city,
        message,
        source: 'website',
        status: 'PENDING_TL_REVIEW'
      }
    });

    // Log the event
    await prisma.applicationHistory.create({
      data: {
        applicationId: application.id,
        status: 'PENDING_TL_REVIEW',
        comments: 'Application submitted via website'
      }
    });

    res.status(201).json({ message: 'Application submitted successfully', applicationId: application.id });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/associate-applications (Protected)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { role, userId } = req.user!;
    let whereClause = {};

    if (role === 'TEAM_LEADER') {
      whereClause = { assignedTeamLeaderId: userId };
    } else if (role === 'SENIOR_TL') {
      whereClause = { assignedSeniorTlId: userId };
    }
    // Admin sees all

    const applications = await prisma.associateApplication.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/associate-applications/:id/create-account
router.post('/:id/create-account', authenticateToken, requireRole(['TEAM_LEADER']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user!;
    const tlId = userId; // Since only TLs can hit this in this flow

    // Verify application and ownership
    const application = await prisma.associateApplication.findUnique({
      where: { id }
    });

    if (!application) return res.status(404).json({ error: 'Application not found' });
    if (application.assignedTeamLeaderId !== tlId) {
      return res.status(403).json({ error: 'Forbidden. Not your application.' });
    }
    if (application.status !== 'PENDING_TL_REVIEW' && application.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Application is not in a valid state for account creation' });
    }

    // Get TL to resolve STL
    const teamLeader = await prisma.user.findUnique({
      where: { id: tlId },
      select: { parentUserId: true } // STL is the TL's parent
    });

    if (!teamLeader || !teamLeader.parentUserId) {
      return res.status(400).json({ error: 'Team Leader is missing Senior TL relationship. Cannot create orphan Associate.' });
    }

    const stlId = teamLeader.parentUserId;

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({ where: { email: application.email } });
    if (existingUser) return res.status(400).json({ error: 'User with this email already exists' });

    // Generate secure temp password and ID
    const tempPassword = 'Temp' + Math.random().toString(36).slice(-8) + '!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    
    // Get count for Associate ID generation (Naive approach for demo, in prod use sequences or robust generation)
    const count = await prisma.user.count({ where: { role: 'ASSOCIATE' } });
    const userCode = `ASSOC${String(count + 1).padStart(3, '0')}`;

    // Transactional Account Creation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const newUser = await tx.user.create({
        data: {
          userCode,
          role: 'ASSOCIATE',
          fullName: application.fullName,
          email: application.email,
          mobile: application.phone,
          passwordHash,
          parentUserId: tlId,
          seniorTlId: stlId,
          sponsorId: tlId,
          mustChangePassword: true,
          status: 'ACTIVE'
        }
      });

      // 2. Update Application Status
      await tx.associateApplication.update({
        where: { id },
        data: { status: 'ACCOUNT_CREATED' }
      });

      // 3. Add History
      await tx.applicationHistory.create({
        data: {
          applicationId: id,
          status: 'ACCOUNT_CREATED',
          comments: `Account ${userCode} created by TL ${tlId}`
        }
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          action: 'CREATE_ACCOUNT',
          entityType: 'User',
          entityId: newUser.id,
          actorUserId: tlId,
          newValue: JSON.stringify({ userCode, email: newUser.email, role: 'ASSOCIATE' })
        }
      });

      return { newUser, tempPassword };
    });

    // TODO: Send email here (We will mock this for now)
    
    res.json({
      message: 'Account created successfully',
      userCode: result.newUser.userCode,
      email: result.newUser.email,
      temporaryPassword: result.tempPassword // Displayed ONCE to TL to show on UI as per requirement
    });

  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
