import { Router } from 'express';
import { prisma } from '../index';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'ACTIVE' && user.status !== 'PENDING_FIRST_LOGIN') {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        userCode: user.userCode,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/heartbeat
router.post('/heartbeat', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { lastActivityAt: new Date() }
    });
    
    // In a full implementation, you'd also update the LoginSession here based on a session ID from the token/cookie
    
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const now = new Date();
    
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { lastLogoutAt: now, lastActivityAt: now }
    });
    
    // Also mark session as ENDED if session tracking is active
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
