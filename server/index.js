import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'ampyflybusiness@gmail.com').toLowerCase();
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const BRIEF_TO_EMAIL = process.env.BRIEF_TO_EMAIL || 'ampyflybusiness@gmail.com';

// ---------- Default Seed Data ----------
const SEED_QUESTS = [
  {
    id: 'ampyfly-genesis-alpha',
    title: 'AMPYFLY Genesis Alpha & Human Pass',
    brand: 'AMPYFLY',
    sector: 'Ecosystem',
    status: 'LIVE',
    prize_usd: 0,
    prize_xp: 7000,
    participants: 342,
    approved_count: 298,
    duration: '14 Days',
    nda_protected: false,
    accent: '#38BDF8',
    summary: 'Claim Founding Member status, verify your 4-Layer Human Pass, and drop your first sector Alpha to unlock Season 1 Tier 2 cash pools.',
    highlights: ['7,000 XP Only Reward', 'Unlocks Tier 2 Cash Quests', '4-Layer Anti-Bot Verified'],
    tasks: [
      { id: 't1', type: 'social_follow', platform: 'X (Twitter)', title: 'Follow @AMPYFLY on X', url: 'https://x.com/AMPYFLY', xp: 1200, verifyMode: 'Follow & Verify' },
      { id: 't2', type: 'social_engage', platform: 'X (Twitter)', title: 'Like & Repost Launch Thread', url: 'https://x.com/AMPYFLY', xp: 1400, verifyMode: 'Post URL Proof' },
      { id: 't3', type: 'alpha_post', platform: 'AMPYFLY Alpha', title: 'Publish 1 Verified Sector Alpha Post', url: '#alpha', xp: 1800, verifyMode: 'Auto-Checked' },
      { id: 't4', type: 'clan_referral', platform: 'Clan System', title: 'Invite 2 Verified Humans via Referral Link', url: '#profile', xp: 1600, verifyMode: 'Referral Code' },
      { id: 't5', type: 'secret_keyword', platform: 'Anti-Bot Check', title: 'Enter Genesis Verification Keyword (AMPYFLY)', url: '', xp: 1000, keyword: 'AMPYFLY', verifyMode: 'Instant Check' }
    ]
  },
  {
    id: 'kgen-yoruba-clan',
    title: 'KGEN Yoruba Task — Clan Growth',
    brand: 'KGEN',
    sector: 'AI & Gaming',
    status: 'ENDED',
    prize_usd: 800,
    prize_xp: 1000,
    participants: 282,
    approved_count: 205,
    duration: '12 Days',
    nda_protected: false,
    accent: '#22C55E',
    summary: 'Built and mobilized a dedicated Yoruba language task clan inside KGEN, converting 282 clan members into 220 active participants and 205 fully approved completions.',
    highlights: ['282 Clan Members', '220 Active Participants', '205 Approved (93.2% QA)'],
    tasks: [
      { id: 'ky1', type: 'clan_referral', platform: 'KGEN Clan', title: 'Join Verified AMPYFLY Yoruba Clan', url: '', xp: 300, verifyMode: 'Clan ID' },
      { id: 'ky2', type: 'ai_capture', platform: 'KGEN AI', title: 'Submit Yoruba Voice & Language Prompts', url: '', xp: 700, verifyMode: 'Scout QA Audit' }
    ]
  },
  {
    id: 'spike-gam3gg-vol2',
    title: 'Spike Gam3gg Vote — Vol. 2: Africa',
    brand: 'Gam3gg / Spike',
    sector: 'Gaming',
    status: 'ENDED',
    prize_usd: 440,
    prize_xp: 3000,
    participants: 205,
    approved_count: 205,
    duration: '5 Days',
    nda_protected: false,
    accent: '#FF5733',
    summary: 'Coordinated community voters and regional gaming creators across WhatsApp and X—delivering 205 verified votes, 22+ UGC creator posts, and 20,000+ organic X impressions.',
    highlights: ['205 Verified Votes', '22+ Creator Assets', '20,000+ X Impressions'],
    tasks: [
      { id: 'sg1', type: 'voting_poll', platform: 'Gam3gg', title: 'Cast & Screenshot Verified Creator Vote', url: '', xp: 1500, verifyMode: 'Proof Screenshot' },
      { id: 'sg2', type: 'ugc_proof', platform: 'X (Twitter)', title: 'Publish Gaming Creator Support Post', url: '', xp: 1500, verifyMode: 'Link Audit' }
    ]
  },
  {
    id: 'kgen-ai-testers',
    title: 'KGEN AI Platform — Early Tester Sprint',
    brand: 'KGEN AI',
    sector: 'AI',
    status: 'ENDED',
    prize_usd: 800,
    prize_xp: 1000,
    participants: 120,
    approved_count: 120,
    duration: '3 Weeks',
    nda_protected: false,
    accent: '#A855F7',
    summary: 'Recruited, onboarded, and retained 120 active first-wave testers for the KGEN AI platform through direct WhatsApp distribution channels and guided onboarding checklists.',
    highlights: ['120 Active Early Testers', 'Direct WhatsApp Activation', '100% Verified Onboarding'],
    tasks: [
      { id: 'ka1', type: 'app_download', platform: 'KGEN AI', title: 'Complete Early Tester Account Setup', url: '', xp: 500, verifyMode: 'UID Verification' },
      { id: 'ka2', type: 'ugc_proof', platform: 'Feedback Form', title: 'Submit Structured Bug & UX Report', url: '', xp: 500, verifyMode: 'Scout Audit' }
    ]
  },
  {
    id: 'nda-social-growth',
    title: 'Undisclosed Social Growth (Followers & Engagement)',
    brand: 'NDA Partner',
    sector: 'Web3 & Social',
    status: 'ENDED',
    prize_usd: 600,
    prize_xp: 2000,
    participants: 2000,
    approved_count: 1910,
    duration: '4 Days',
    nda_protected: true,
    accent: '#F59E0B',
    summary: 'High-velocity 96-hour social awareness and authentic engagement sprint mobilizing 2,000 verified human accounts under strict client NDA.',
    highlights: ['2,000 Verified Participants', '4-Day High-Velocity Sprint', 'NDA-Protected Audit'],
    tasks: [
      { id: 'ns1', type: 'social_follow', platform: 'X / Socials', title: 'Follow & Engage Partner Launch Posts', url: '', xp: 1000, verifyMode: 'Social OAuth' },
      { id: 'ns2', type: 'ugc_proof', platform: 'Community', title: 'Quote-Post with Organic Takeaway', url: '', xp: 1000, verifyMode: 'Anti-Bot Filter' }
    ]
  },
  {
    id: 'nda-app-download',
    title: 'Undisclosed App Download & Community Growth',
    brand: 'NDA Partner',
    sector: 'Fintech & Mobile',
    status: 'ENDED',
    prize_usd: 650,
    prize_xp: 1500,
    participants: 1500,
    approved_count: 1435,
    duration: '7 Days',
    nda_protected: true,
    accent: '#06B6D4',
    summary: '7-day mobile app install, verified signup, and community retention sprint delivering 1,500 real human installs with zero duplicate device clusters.',
    highlights: ['1,500 Verified Installs', '7-Day Sprint Window', 'Device-Fingerprint Clean'],
    tasks: [
      { id: 'na1', type: 'app_download', platform: 'iOS / Android', title: 'Install App & Complete Onboarding', url: '', xp: 900, verifyMode: 'Install Proof' },
      { id: 'na2', type: 'social_follow', platform: 'Community Hub', title: 'Join Official Community & Verify Role', url: '', xp: 600, verifyMode: 'Role Check' }
    ]
  },
  {
    id: 'fintech-q4-waitlist',
    title: 'Fintech Q4 Beta Waitlist Sprint',
    brand: 'Partner Reveal Soon',
    sector: 'Fintech',
    status: 'UPCOMING',
    prize_usd: 1200,
    prize_xp: 2500,
    participants: 0,
    approved_count: 0,
    duration: '7 Days',
    nda_protected: false,
    accent: '#38BDF8',
    summary: 'Priority waitlist, early mobile testing, and short-form creator UGC blitz reserved for Tier 2 Verified Humans on AMPYFLY.',
    highlights: ['$1,200 USDC + 2,500 XP', 'Tier 2 Human Pass Priority', 'Launching Soon'],
    tasks: [
      { id: 'fq1', type: 'site_visit', platform: 'Web Waitlist', title: 'Reserve Early Access Spot (15s Visit)', url: '', xp: 1000, verifyMode: 'Webhook Check' },
      { id: 'fq2', type: 'ugc_proof', platform: 'X / TikTok', title: 'Create 30s Product Walkthrough Clip', url: '', xp: 1500, verifyMode: 'Scout QA' }
    ]
  }
];

const SEED_ALPHA = [
  {
    id: 'a1',
    author_name: 'Tunde Plays',
    author_handle: '@tundeplays',
    sector: 'Gaming',
    content: 'Mobile esports titles targeting African creator clans are seeing 3x higher Day-7 retention when quests reward squad milestones instead of single clicks.',
    upvotes: 42,
    created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
  },
  {
    id: 'a2',
    author_name: 'Zara AI',
    author_handle: '@zara_builds',
    sector: 'AI',
    content: 'Local language voice datasets (Yoruba, Hausa, Pidgin, Swahili) are the hottest B2B demand in AI right now. Verified human clans have a massive edge here.',
    upvotes: 67,
    created_at: new Date(Date.now() - 3600 * 1000 * 14).toISOString()
  }
];

// ---------- Storage Layer (Postgres or Local JSON Fallback) ----------
const usePg = Boolean(process.env.DATABASE_URL);
let pool = null;

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

function loadLocalDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const initial = { users: [], quests: SEED_QUESTS, submissions: [], alpha_posts: SEED_ALPHA, brand_briefs: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveLocalDb(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

async function initDb() {
  if (!usePg) {
    loadLocalDb();
    console.log('[AMPYFLY] Using local JSON storage at data/db.json (set DATABASE_URL for PostgreSQL/Supabase)');
    return;
  }
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: IS_PROD ? { rejectUnauthorized: false } : false
  });
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    await pool.query(fs.readFileSync(schemaPath, 'utf8'));
  }
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM quests');
  if (rows[0].count === 0) {
    for (const q of SEED_QUESTS) {
      await pool.query(
        `INSERT INTO quests (id, title, brand, sector, status, prize_usd, prize_xp, participants, approved_count, duration, nda_protected, accent, summary, highlights, tasks)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (id) DO NOTHING`,
        [q.id, q.title, q.brand, q.sector, q.status, q.prize_usd, q.prize_xp, q.participants, q.approved_count, q.duration, q.nda_protected, q.accent, q.summary, JSON.stringify(q.highlights), JSON.stringify(q.tasks)]
      );
    }
    for (const a of SEED_ALPHA) {
      await pool.query(
        `INSERT INTO alpha_posts (author_name, author_handle, sector, content, upvotes) VALUES ($1,$2,$3,$4,$5)`,
        [a.author_name, a.author_handle, a.sector, a.content, a.upvotes]
      );
    }
  }
  console.log('[AMPYFLY] Connected to PostgreSQL database');
}

// ---------- App & Security Middleware ----------
const app = express();
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Serverless (Vercel): make sure the database schema and seeds are ready before any request.
const dbReady = initDb().catch((err) => {
  console.error('[AMPYFLY] Database init failed:', err.message);
  throw err;
});
app.use(async (req, res, next) => {
  try {
    await dbReady;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database unavailable. Check DATABASE_URL.' });
  }
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' }
});

const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 150,
  standardHeaders: 'draft-8',
  legacyHeaders: false
});

app.use('/api', publicApiLimiter);

const COOKIE_OPTS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

function requireAdmin(req, res, next) {
  const token = req.cookies.ampyfly_admin;
  if (!token) return res.status(401).json({ error: 'Admin authentication required' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired admin session' });
  }
}

function getOptionalUser(req) {
  const token = req.cookies.ampyfly_user;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ---------- Admin Auth Routes (Hidden — No Public Links) ----------
app.post('/api/admin/login', adminLoginLimiter, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!ADMIN_PASSWORD_HASH) {
    return res.status(503).json({ error: 'ADMIN_PASSWORD_HASH is not configured on the server.' });
  }

  const emailMatches = email === ADMIN_EMAIL;
  const passMatches = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (!emailMatches || !passMatches) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ role: 'admin', email }, JWT_SECRET, { expiresIn: '12h' });
  res.cookie('ampyfly_admin', token, { ...COOKIE_OPTS, maxAge: 12 * 60 * 60 * 1000 });
  res.json({ ok: true, email });
});

app.get('/api/admin/me', (req, res) => {
  const token = req.cookies.ampyfly_admin;
  if (!token) return res.json({ authenticated: false });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return res.json({ authenticated: payload.role === 'admin', email: payload.email });
  } catch {
    return res.json({ authenticated: false });
  }
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('ampyfly_admin', COOKIE_OPTS);
  res.json({ ok: true });
});

// ---------- User Auth & Profile Routes ----------
app.post('/api/auth/register', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const displayName = String(req.body.displayName || '').trim() || 'AMP Explorer';
  const rawHandle = String(req.body.handle || displayName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'explorer');
  const handle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;

  if (!email || password.length < 6) {
    return res.status(400).json({ error: 'Valid email and 6+ character password required.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (usePg) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO users (email, password_hash, display_name, handle) VALUES ($1,$2,$3,$4)
         RETURNING id, email, display_name, handle, bio, xp, earned_usd, trust_tier, wallets, socials`,
        [email, passwordHash, displayName, handle]
      );
      const user = rows[0];
      const token = jwt.sign({ id: user.id, email: user.email, handle: user.handle }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('ampyfly_user', token, COOKIE_OPTS);
      return res.status(201).json({ user });
    } catch {
      return res.status(409).json({ error: 'Email or handle already registered.' });
    }
  } else {
    const db = loadLocalDb();
    if (db.users.some(u => u.email === email || u.handle === handle)) {
      return res.status(409).json({ error: 'Email or handle already registered.' });
    }
    const user = {
      id: crypto.randomUUID(),
      email,
      password_hash: passwordHash,
      display_name: displayName,
      handle,
      bio: 'Verified AMPYFLY Quester & Alpha Hunter',
      xp: 0,
      earned_usd: 0,
      trust_tier: 1,
      wallets: { baseUsdc: '', solana: '', fiatRail: '' },
      socials: { x: '', telegram: '', discord: '', whatsapp: '' }
    };
    db.users.push(user);
    saveLocalDb(db);
    const token = jwt.sign({ id: user.id, email: user.email, handle: user.handle }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('ampyfly_user', token, COOKIE_OPTS);
    const { password_hash, ...safeUser } = user;
    return res.status(201).json({ user: safeUser });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  let user = null;
  if (usePg) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    user = rows[0];
  } else {
    const db = loadLocalDb();
    user = db.users.find(u => u.email === email);
  }

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, handle: user.handle }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('ampyfly_user', token, COOKIE_OPTS);
  const { password_hash, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('ampyfly_user', COOKIE_OPTS);
  res.json({ ok: true });
});

app.get('/api/auth/me', async (req, res) => {
  const session = getOptionalUser(req);
  if (!session) return res.json({ user: null });
  if (usePg) {
    const { rows } = await pool.query(
      'SELECT id, email, display_name, handle, bio, xp, earned_usd, trust_tier, wallets, socials FROM users WHERE id = $1',
      [session.id]
    );
    return res.json({ user: rows[0] || null });
  }
  const db = loadLocalDb();
  const user = db.users.find(u => u.id === session.id);
  if (!user) return res.json({ user: null });
  const { password_hash, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.patch('/api/auth/profile', async (req, res) => {
  const session = getOptionalUser(req);
  if (!session) return res.status(401).json({ error: 'Sign in required' });
  const { display_name, bio, wallets, socials } = req.body;

  if (usePg) {
    const { rows } = await pool.query(
      `UPDATE users SET display_name = COALESCE($1, display_name), bio = COALESCE($2, bio),
       wallets = COALESCE($3, wallets), socials = COALESCE($4, socials)
       WHERE id = $5
       RETURNING id, email, display_name, handle, bio, xp, earned_usd, trust_tier, wallets, socials`,
      [display_name, bio, wallets ? JSON.stringify(wallets) : null, socials ? JSON.stringify(socials) : null, session.id]
    );
    return res.json({ user: rows[0] });
  }
  const db = loadLocalDb();
  const user = db.users.find(u => u.id === session.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (display_name) user.display_name = display_name;
  if (bio !== undefined) user.bio = bio;
  if (wallets) user.wallets = { ...user.wallets, ...wallets };
  if (socials) user.socials = { ...user.socials, ...socials };
  saveLocalDb(db);
  const { password_hash, ...safeUser } = user;
  res.json({ user: safeUser });
});

// ---------- Quests Routes ----------
app.get('/api/quests', async (req, res) => {
  if (usePg) {
    const { rows } = await pool.query('SELECT * FROM quests ORDER BY created_at DESC');
    return res.json({ quests: rows });
  }
  res.json({ quests: loadLocalDb().quests });
});

app.post('/api/admin/quests', requireAdmin, async (req, res) => {
  const q = req.body;
  const id = q.id || `${String(q.title || 'quest').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
  const quest = {
    id,
    title: String(q.title || 'Untitled Sprint').trim(),
    brand: String(q.brand || 'AMPYFLY Partner').trim(),
    sector: String(q.sector || 'Web3').trim(),
    status: ['LIVE', 'ENDED', 'UPCOMING'].includes(q.status) ? q.status : 'LIVE',
    prize_usd: Number(q.prize_usd || 0),
    prize_xp: Number(q.prize_xp || 1000),
    participants: Number(q.participants || 0),
    approved_count: Number(q.approved_count || 0),
    duration: String(q.duration || '7 Days'),
    nda_protected: Boolean(q.nda_protected),
    accent: String(q.accent || '#38BDF8'),
    summary: String(q.summary || ''),
    highlights: Array.isArray(q.highlights) ? q.highlights : [],
    tasks: Array.isArray(q.tasks) ? q.tasks : []
  };

  if (usePg) {
    await pool.query(
      `INSERT INTO quests (id, title, brand, sector, status, prize_usd, prize_xp, participants, approved_count, duration, nda_protected, accent, summary, highlights, tasks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [quest.id, quest.title, quest.brand, quest.sector, quest.status, quest.prize_usd, quest.prize_xp, quest.participants, quest.approved_count, quest.duration, quest.nda_protected, quest.accent, quest.summary, JSON.stringify(quest.highlights), JSON.stringify(quest.tasks)]
    );
  } else {
    const db = loadLocalDb();
    db.quests.unshift(quest);
    saveLocalDb(db);
  }
  res.status(201).json({ quest });
});

app.patch('/api/admin/quests/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (usePg) {
    await pool.query('UPDATE quests SET status = COALESCE($1, status) WHERE id = $2', [status, id]);
  } else {
    const db = loadLocalDb();
    const target = db.quests.find(q => q.id === id);
    if (target && status) target.status = status;
    saveLocalDb(db);
  }
  res.json({ ok: true });
});

app.delete('/api/admin/quests/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (usePg) {
    await pool.query('DELETE FROM quests WHERE id = $1', [id]);
  } else {
    const db = loadLocalDb();
    db.quests = db.quests.filter(q => q.id !== id);
    saveLocalDb(db);
  }
  res.json({ ok: true });
});

// ---------- Proof Submissions & Admin QA ----------
app.post('/api/submissions', async (req, res) => {
  const session = getOptionalUser(req);
  const { quest_id, proof_url, proof_note, completed_task_ids, user_handle } = req.body;
  const handle = session?.handle || user_handle || '@guest';

  const entry = {
    id: crypto.randomUUID(),
    quest_id,
    user_handle: handle,
    proof_url: String(proof_url || '').trim(),
    proof_note: String(proof_note || '').trim(),
    completed_task_ids: Array.isArray(completed_task_ids) ? completed_task_ids : [],
    status: 'PENDING',
    created_at: new Date().toISOString()
  };

  if (usePg) {
    await pool.query(
      `INSERT INTO submissions (id, quest_id, user_handle, proof_url, proof_note, completed_task_ids) VALUES ($1,$2,$3,$4,$5,$6)`,
      [entry.id, entry.quest_id, entry.user_handle, entry.proof_url, entry.proof_note, JSON.stringify(entry.completed_task_ids)]
    );
    await pool.query('UPDATE quests SET participants = participants + 1 WHERE id = $1', [quest_id]);
  } else {
    const db = loadLocalDb();
    db.submissions.unshift(entry);
    const q = db.quests.find(x => x.id === quest_id);
    if (q) q.participants += 1;
    saveLocalDb(db);
  }
  res.status(201).json({ submission: entry });
});

app.get('/api/admin/overview', requireAdmin, async (req, res) => {
  if (usePg) {
    const [subs, briefs] = await Promise.all([
      pool.query('SELECT * FROM submissions ORDER BY created_at DESC LIMIT 100'),
      pool.query('SELECT * FROM brand_briefs ORDER BY created_at DESC LIMIT 100')
    ]);
    return res.json({ submissions: subs.rows, briefs: briefs.rows });
  }
  const db = loadLocalDb();
  res.json({ submissions: db.submissions, briefs: db.brand_briefs });
});

app.patch('/api/admin/submissions/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const status = req.body.status === 'APPROVED' ? 'APPROVED' : 'REJECTED';

  if (usePg) {
    const { rows } = await pool.query('UPDATE submissions SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    const sub = rows[0];
    if (sub && status === 'APPROVED') {
      const qRes = await pool.query('SELECT prize_xp, prize_usd FROM quests WHERE id = $1', [sub.quest_id]);
      const q = qRes.rows[0];
      if (q) {
        await pool.query('UPDATE quests SET approved_count = approved_count + 1 WHERE id = $1', [sub.quest_id]);
        await pool.query('UPDATE users SET xp = xp + $1 WHERE handle = $2', [q.prize_xp || 0, sub.user_handle]);
      }
    }
  } else {
    const db = loadLocalDb();
    const sub = db.submissions.find(s => s.id === id);
    if (sub) {
      sub.status = status;
      if (status === 'APPROVED') {
        const q = db.quests.find(x => x.id === sub.quest_id);
        if (q) q.approved_count += 1;
        const u = db.users.find(x => x.handle === sub.user_handle);
        if (u && q) u.xp += Number(q.prize_xp || 0);
      }
      saveLocalDb(db);
    }
  }
  res.json({ ok: true });
});

// ---------- Alpha Feed Routes ----------
app.get('/api/alpha', async (req, res) => {
  if (usePg) {
    const { rows } = await pool.query('SELECT * FROM alpha_posts ORDER BY created_at DESC LIMIT 50');
    return res.json({ posts: rows });
  }
  res.json({ posts: loadLocalDb().alpha_posts });
});

app.post('/api/alpha', async (req, res) => {
  const session = getOptionalUser(req);
  const { sector, content, author_name, author_handle } = req.body;
  if (!content || String(content).trim().length < 8) {
    return res.status(400).json({ error: 'Alpha post must be at least 8 characters.' });
  }
  const post = {
    id: crypto.randomUUID(),
    author_name: author_name || session?.handle || 'AMP Member',
    author_handle: session?.handle || author_handle || '@member',
    sector: String(sector || 'Gaming'),
    content: String(content).trim(),
    upvotes: 1,
    created_at: new Date().toISOString()
  };

  if (usePg) {
    await pool.query(
      `INSERT INTO alpha_posts (id, author_name, author_handle, sector, content, upvotes) VALUES ($1,$2,$3,$4,$5,1)`,
      [post.id, post.author_name, post.author_handle, post.sector, post.content]
    );
    if (session) await pool.query('UPDATE users SET xp = xp + 50 WHERE id = $1', [session.id]);
  } else {
    const db = loadLocalDb();
    db.alpha_posts.unshift(post);
    if (session) {
      const u = db.users.find(x => x.id === session.id);
      if (u) u.xp += 50;
    }
    saveLocalDb(db);
  }
  res.status(201).json({ post });
});

app.post('/api/alpha/:id/upvote', async (req, res) => {
  const { id } = req.params;
  if (usePg) {
    await pool.query('UPDATE alpha_posts SET upvotes = upvotes + 1 WHERE id = $1', [id]);
  } else {
    const db = loadLocalDb();
    const p = db.alpha_posts.find(x => x.id === id);
    if (p) p.upvotes += 1;
    saveLocalDb(db);
  }
  res.json({ ok: true });
});

// ---------- Brand Campaign Brief -> ampyflybusiness@gmail.com ----------
app.post('/api/briefs', async (req, res) => {
  const { company, email, sector, package_type, budget, timeline, goal } = req.body;
  if (!company || !email || !goal) {
    return res.status(400).json({ error: 'Company, email, and goal are required.' });
  }
  const brief = {
    id: crypto.randomUUID(),
    company: String(company).trim(),
    email: String(email).trim(),
    sector: String(sector || 'Gaming'),
    package_type: String(package_type || 'Growth Sprint'),
    budget: String(budget || 'TBD'),
    timeline: String(timeline || '7 Days'),
    goal: String(goal).trim(),
    created_at: new Date().toISOString()
  };

  if (usePg) {
    await pool.query(
      `INSERT INTO brand_briefs (id, company, email, sector, package_type, budget, timeline, goal) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [brief.id, brief.company, brief.email, brief.sector, brief.package_type, brief.budget, brief.timeline, brief.goal]
    );
  } else {
    const db = loadLocalDb();
    db.brand_briefs.unshift(brief);
    saveLocalDb(db);
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({
        from: `"AMPYFLY Brief Intake" <${process.env.SMTP_USER}>`,
        to: BRIEF_TO_EMAIL,
        replyTo: brief.email,
        subject: `[AMPYFLY Brief] ${brief.company} — ${brief.package_type}`,
        text: `Company: ${brief.company}\nEmail: ${brief.email}\nSector: ${brief.sector}\nPackage: ${brief.package_type}\nBudget: ${brief.budget}\nTimeline: ${brief.timeline}\n\nGoal:\n${brief.goal}`
      });
    } catch (err) {
      console.error('[AMPYFLY] SMTP forwarding error:', err.message);
    }
  }

  res.status(201).json({ ok: true, brief, forwardedTo: BRIEF_TO_EMAIL });
});

// ---------- Serve Frontend ----------
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

app.use((req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

export default app;

// On Vercel the platform runs the exported app; locally we listen on PORT.
if (!process.env.VERCEL) {
  dbReady.then(() => {
    app.listen(PORT, () => {
      console.log(`[AMPYFLY] Server running on http://localhost:${PORT}`);
      console.log(`[AMPYFLY] Private Admin Portal: http://localhost:${PORT}/#ops`);
    });
  }).catch(() => process.exit(1));
}
