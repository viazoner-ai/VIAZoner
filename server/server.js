/**
 * volonter.by — API сервер
 * Node.js (встроенный http) + SQLite через node:sqlite.
 * SQL-схема написана так, чтобы без переписывания переносилась на MySQL/MariaDB
 * (типы INTEGER/TEXT/REAL совместимы; достаточно сменить драйвер и диалект AUTOINCREMENT).
 *
 * Порт: 8787. Запуск: npm run dev  (в папке server)
 */
import http from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
mkdirSync(DATA_DIR, { recursive: true });

const SECRET_FILE = path.join(DATA_DIR, '.secret');
let SECRET = randomBytes(32).toString('hex');
if (existsSync(SECRET_FILE)) {
  SECRET = readFileSync(SECRET_FILE, 'utf8').trim();
} else {
  writeFileSync(SECRET_FILE, SECRET, { mode: 0o600 });
}

const db = new DatabaseSync(path.join(DATA_DIR, 'volonterby.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

/* ============================ СХЕМА ============================ */
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  role          TEXT NOT NULL CHECK (role IN ('volunteer','organization','person')),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE,
  phone         TEXT DEFAULT '',
  city          TEXT NOT NULL DEFAULT '',
  password_hash TEXT,
  about         TEXT DEFAULT '',
  avatar_seed   INTEGER,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS volunteer_profiles (
  user_id      INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  skills       TEXT DEFAULT '',
  interests    TEXT DEFAULT '',
  schedule     TEXT DEFAULT '',
  verified     INTEGER DEFAULT 0,
  last_active  TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS requests (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  author_name       TEXT NOT NULL,
  author_type       TEXT NOT NULL DEFAULT 'organization',
  city              TEXT NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT DEFAULT '',
  category          TEXT NOT NULL DEFAULT 'other',
  date_start        TEXT,
  date_end          TEXT,
  time_text         TEXT DEFAULT '',
  urgent            INTEGER DEFAULT 0,
  volunteers_needed INTEGER DEFAULT 1,
  volunteers_found  INTEGER DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'open',
  conditions        TEXT DEFAULT '',
  created_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS responses (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id   INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  volunteer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message      TEXT DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'applied',
  rating       INTEGER,
  review       TEXT DEFAULT '',
  hours        INTEGER DEFAULT 0,
  created_at   TEXT NOT NULL,
  UNIQUE (request_id, volunteer_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER,
  from_user  INTEGER NOT NULL,
  to_user    INTEGER NOT NULL,
  text       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);
`);

/* ============================ ХЕЛПЕРЫ ============================ */
const now = () => new Date().toISOString();

function hashPassword(pw, salt = randomBytes(12).toString('hex')) {
  return salt + ':' + createHash('sha256').update(salt + pw).digest('hex');
}
function checkPassword(pw, stored) {
  const [salt, hex] = String(stored).split(':');
  return hashPassword(pw, salt) === stored && !!hex;
}

function cleanUser(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return rest;
}

function publicVolunteer(u) {
  if (!u) return null;
  const { password_hash, email, phone, ...rest } = u;
  return rest;
}

/** Агрегированный профиль волонтёра (рейтинг, число дел) */
function volunteerAgg(uid) {
  const row = db.prepare(`
    SELECT
      COALESCE((SELECT AVG(rating) FROM responses WHERE volunteer_id = ? AND rating IS NOT NULL), 0) AS rating_avg,
      (SELECT COUNT(*) FROM responses WHERE volunteer_id = ? AND rating IS NOT NULL)                AS rating_count,
      (SELECT COUNT(*) FROM responses WHERE volunteer_id = ? AND status = 'done')                   AS help_count,
      COALESCE((SELECT SUM(hours)   FROM responses WHERE volunteer_id = ? AND status = 'done'), 0)  AS hours_total
  `).get(uid, uid, uid, uid);
  return row;
}

function volunteerRow(u, extra = '') {
  const agg = volunteerAgg(u.id);
  return {
    id: u.id, name: u.name, city: u.city, about: u.about,
    avatarSeed: u.avatar_seed, verified: u.verified ?? 0,
    skills: (u.skills || '').split(',').map((s) => s.trim()).filter(Boolean),
    interests: (u.interests || '').split(',').map((s) => s.trim()).filter(Boolean),
    schedule: u.schedule || '',
    lastActive: u.last_active || '',
    ratingAvg: Math.round((agg.rating_avg || 0) * 10) / 10,
    ratingCount: agg.rating_count,
    helpCount: agg.help_count,
    hoursTotal: agg.hours_total,
    ...(extra ? { extra } : {}),
  };
}

function requestRow(r) {
  return {
    id: r.id,
    authorId: r.author_id,
    authorName: r.author_name,
    authorType: r.author_type,
    city: r.city,
    title: r.title,
    description: r.description,
    category: r.category,
    dateStart: r.date_start,
    dateEnd: r.date_end,
    timeText: r.time_text,
    urgent: !!r.urgent,
    volunteersNeeded: r.volunteers_needed,
    volunteersFound: r.volunteers_found,
    status: r.status,
    conditions: r.conditions,
    createdAt: r.created_at,
  };
}

function responseRow(r) {
  return {
    id: r.id,
    requestId: r.request_id,
    volunteerId: r.volunteer_id,
    message: r.message,
    status: r.status,
    rating: r.rating,
    review: r.review,
    hours: r.hours,
    createdAt: r.created_at,
  };
}

/* ============================ AUTH ============================ */
function makeToken(userId) {
  const token = randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?,?,?)').run(token, userId, now());
  return token;
}
function parseAuth(req) {
  const h = req.headers['authorization'] || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  const row = db.prepare(
    `SELECT u.*, s.token FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`
  ).get(token);
  return row ? cleanUser(row) : null;
}

/* ============================ HTTP ============================ */
const PORT = process.env.PORT || 8787;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function send(res, code, data) {
  const body = JSON.stringify(data ?? null);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', ...CORS });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 1.5e6) { reject(new Error('body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}
function jsonError(res, e) {
  console.error('API error:', e);
  send(res, 500, { error: 'Внутренняя ошибка сервера' });
}

const CITY_SYNONYMS = { минск: 'Минск', гродно: 'Гродно', брест: 'Брест', витебск: 'Витебск', гомель: 'Гомель', могилев: 'Могилёв', могилёв: 'Могилёв', орша: 'Орша', бобруйск: 'Бобруйск', барановичи: 'Барановичи', пинск: 'Пинск', лида: 'Лида', полоцк: 'Полоцк', новополоцк: 'Новополоцк', борисов: 'Борисов', солигорск: 'Солигорск', мозырь: 'Мозырь', солигорск: 'Солигорск', жлобин: 'Жлобин', светлогорск: 'Светлогорск', слуцк: 'Слуцк', кобрин: 'Кобрин' };
function normalizeCity(v = '') {
  const k = String(v).trim().toLowerCase();
  return CITY_SYNONYMS[k] || String(v).trim();
}

/* ============================ РОУТЫ ============================ */
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const p = url.pathname.replace(/\/+$/, '') || '/';
  const me = parseAuth(req);
  const q = url.searchParams;

  try {
    /* ---------- Регистрация ---------- */
    if (p === '/api/register' && req.method === 'POST') {
      const b = await readBody(req);
      const role = b.role;
      if (!['volunteer', 'organization', 'person'].includes(role)) return send(res, 400, { error: 'Выберите тип аккаунта' });
      const name = String(b.name || '').trim();
      const email = String(b.email || '').trim().toLowerCase();
      const phone = String(b.phone || '').trim();
      const city = normalizeCity(b.city);
      const password = String(b.password || '');
      if (name.length < 2) return send(res, 400, { error: 'Укажите имя' });
      if (!city) return send(res, 400, { error: 'Укажите город' });
      if (password.length < 4) return send(res, 400, { error: 'Пароль — минимум 4 символа' });

      const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (exists) return send(res, 409, { error: 'Пользователь с такой почтой уже есть' });

      const info = db.prepare(
        `INSERT INTO users (role, name, email, phone, city, password_hash, about, avatar_seed, created_at)
         VALUES (?,?,?,?,?,?,?,?,?)`
      ).run(role, name, email || null, phone, city, hashPassword(password), String(b.about || '').trim(), Math.floor(Math.random() * 100000), now());

      const userId = Number(info.lastInsertRowid);
      if (role === 'volunteer') {
        db.prepare(
          `INSERT INTO volunteer_profiles (user_id, skills, interests, schedule, verified, last_active)
           VALUES (?,?,?,?,0,?)`
        ).run(userId, String(b.skills || ''), String(b.interests || ''), String(b.schedule || '').trim(), now());
      }
      const user = cleanUser(db.prepare('SELECT * FROM users WHERE id = ?').get(userId));
      return send(res, 201, { token: makeToken(userId), user });
    }

    /* ---------- Вход / выход ---------- */
    if (p === '/api/login' && req.method === 'POST') {
      const b = await readBody(req);
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(b.email || '').trim().toLowerCase());
      if (!user || !checkPassword(String(b.password || ''), user.password_hash)) {
        return send(res, 401, { error: 'Неверная почта или пароль' });
      }
      return send(res, 200, { token: makeToken(user.id), user: cleanUser(user) });
    }

    if (p === '/api/logout' && req.method === 'POST') {
      const token = (req.headers['authorization'] || '').startsWith('Bearer ') ? req.headers['authorization'].slice(7) : null;
      if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return send(res, 200, { ok: true });
    }

    if (p === '/api/me' && req.method === 'GET') {
      return send(res, 200, { user: me });
    }

    /* ---------- Профиль волонтёра ---------- */
    if (p === '/api/profile' && req.method === 'PATCH') {
      if (!me) return send(res, 401, { error: 'Нужно войти' });
      const b = await readBody(req);
      const update = { ...me, ...b };
      const email = String(b.email ?? me.email ?? '').trim().toLowerCase();
      const dupe = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, me.id);
      if (dupe) return send(res, 409, { error: 'Эта почта уже занята' });
      db.prepare('UPDATE users SET name=?, email=?, phone=?, city=?, about=? WHERE id=?').run(
        String(update.name || me.name).trim(), email, String(update.phone || '').trim(),
        normalizeCity(update.city || me.city), String(update.about || '').trim(), me.id
      );
      if (me.role === 'volunteer') {
        db.prepare('UPDATE volunteer_profiles SET skills=?, interests=?, schedule=? WHERE user_id=?').run(
          String(b.skills ?? ''), String(b.interests ?? ''), String(b.schedule ?? '').trim(), me.id
        );
      }
      const user = cleanUser(db.prepare('SELECT * FROM users WHERE id = ?').get(me.id));
      return send(res, 200, { user });
    }

    /* ---------- Список волонтёров (база) ---------- */
    if (p === '/api/volunteers' && req.method === 'GET') {
      const city = normalizeCity(q.get('city') || '');
      const skill = (q.get('skill') || '').trim();
      const search = (q.get('q') || '').trim();
      const sort = q.get('sort') || 'rating';

      let where = "u.role = 'volunteer'";
      const params = [];
      if (city) { where += ' AND u.city = ?'; params.push(city); }
      if (skill) { where += ' AND (vp.skills LIKE ? OR vp.interests LIKE ?)'; params.push(`%${skill}%`, `%${skill}%`); }
      if (search) { where += ' AND (u.name LIKE ? OR u.about LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

      const orderBy =
        sort === 'help' ? '(SELECT COUNT(*) FROM responses r WHERE r.volunteer_id = u.id AND r.status = \'done\') DESC, rating_avg DESC'
        : 'rating_avg DESC, help_count DESC';
      const rows = db.prepare(`
        SELECT u.*, vp.skills, vp.interests, vp.schedule, vp.verified, vp.last_active,
          COALESCE((SELECT AVG(r.rating) FROM responses r WHERE r.volunteer_id = u.id AND r.rating IS NOT NULL), 0) AS rating_avg,
          (SELECT COUNT(*) FROM responses r WHERE r.volunteer_id = u.id AND r.rating IS NOT NULL) AS rating_count,
          (SELECT COUNT(*) FROM responses r WHERE r.volunteer_id = u.id AND r.status = 'done') AS help_count,
          (SELECT COUNT(*) FROM responses r WHERE r.volunteer_id = u.id AND r.status = 'done') AS done_count,
          COALESCE((SELECT SUM(r.hours) FROM responses r WHERE r.volunteer_id = u.id AND r.status = 'done'), 0) AS hours_total
        FROM users u
        LEFT JOIN volunteer_profiles vp ON vp.user_id = u.id
        WHERE ${where}
        ORDER BY ${orderBy}
        LIMIT 200
      `).all(...params);
      return send(res, 200, { volunteers: rows.map((u) => volunteerRow(u)) });
    }

    /* ---------- Профиль волонтёра (детально + отзывы) ---------- */
    if (/^\/api\/volunteers\/\d+$/.test(p) && req.method === 'GET') {
      const id = Number(p.split('/')[3]);
      const u = db.prepare(`SELECT u.*, vp.skills, vp.interests, vp.schedule, vp.verified, vp.last_active
        FROM users u LEFT JOIN volunteer_profiles vp ON vp.user_id = u.id WHERE u.id = ? AND u.role='volunteer'`).get(id);
      if (!u) return send(res, 404, { error: 'Волонтёр не найден' });
      const reviews = db.prepare(`
        SELECT r.rating, r.review, r.hours, r.created_at, req.title AS request_title, req.city, req.author_name
        FROM responses r JOIN requests req ON req.id = r.request_id
        WHERE r.volunteer_id = ? AND r.status = 'done' AND r.rating IS NOT NULL AND r.review != ''
        ORDER BY r.created_at DESC LIMIT 30
      `).all(id);
      return send(res, 200, { volunteer: volunteerRow(u), reviews });
    }

    /* ---------- Заявки на помощь (лента) ---------- */
    if (p === '/api/requests' && req.method === 'GET') {
      const city = normalizeCity(q.get('city') || '');
      const category = q.get('category') || '';
      const status = q.get('status') || '';
      const search = (q.get('q') || '').trim();
      const urgentOnly = q.get('urgent') === '1';
      const authorId = q.get('author') ? Number(q.get('author')) : null;

      let where = '1=1';
      const params = [];
      if (city) { where += ' AND r.city = ?'; params.push(city); }
      if (category) { where += ' AND r.category = ?'; params.push(category); }
      if (status) { where += ' AND r.status = ?'; params.push(status); }
      else if (!authorId) { where += " AND r.status IN ('open','in_progress')"; }
      if (urgentOnly) { where += ' AND r.urgent = 1'; }
      if (authorId) { where += ' AND r.author_id = ?'; params.push(authorId); }
      if (search) { where += ' AND (r.title LIKE ? OR r.description LIKE ? OR r.city LIKE ? OR r.author_name LIKE ?)'; const s = `%${search}%`; params.push(s, s, s, s); }

      const rows = db.prepare(`
        SELECT r.*,
          (SELECT COUNT(*) FROM responses resp WHERE resp.request_id = r.id) AS responses_count,
          (SELECT COUNT(*) FROM responses resp WHERE resp.request_id = r.id AND resp.status IN ('accepted','done')) AS accepted_count,
          (SELECT COUNT(*) FROM responses resp WHERE resp.request_id = r.id AND resp.status IN ('applied','accepted')) AS found_now,
          (SELECT resp.status FROM responses resp WHERE resp.request_id = r.id AND resp.volunteer_id = ?) AS my_status,
          (SELECT resp.id FROM responses resp WHERE resp.request_id = r.id AND resp.volunteer_id = ?) AS my_response_id
        FROM requests r
        WHERE ${where}
        ORDER BY r.urgent DESC, (r.date_start IS NULL) ASC, r.date_start ASC, r.created_at DESC
        LIMIT 200
      `).all(me?.id ?? -1, me?.id ?? -1);
      const list = rows.map((r) => ({
        ...requestRow(r),
        volunteersFound: r.found_now,
        responsesCount: r.responses_count,
        acceptedCount: r.accepted_count,
        myStatus: r.my_status || null,
        myResponseId: r.my_response_id || null,
      }));
      return send(res, 200, { requests: list });
    }

    /* ---------- Публикация заявки ---------- */
    if (p === '/api/requests' && req.method === 'POST') {
      if (!me) return send(res, 401, { error: 'Нужно войти' });
      if (me.role === 'volunteer') return send(res, 403, { error: 'Волонтёры оставляют отклики, а заявки создают организации и частные лица' });
      const b = await readBody(req);
      const title = String(b.title || '').trim();
      const city = normalizeCity(b.city || me.city);
      const dateStart = b.dateStart ? String(b.dateStart).slice(0, 10) : null;
      const dateEnd = b.dateEnd ? String(b.dateEnd).slice(0, 10) : null;
      if (title.length < 5) return send(res, 400, { error: 'Опишите, какая помощь нужна (минимум 5 символов)' });
      if (!city) return send(res, 400, { error: 'Укажите город' });

      const info = db.prepare(`
        INSERT INTO requests (author_id, author_name, author_type, city, title, description, category, date_start, date_end, time_text, urgent, volunteers_needed, status, conditions, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'open',?,?)
      `).run(
        me.id, me.name, me.role === 'organization' ? 'organization' : 'person',
        city, title, String(b.description || '').trim(), b.category || 'other',
        dateStart, dateEnd, String(b.timeText || '').trim(),
        b.urgent ? 1 : 0, Math.max(1, Number(b.volunteersNeeded) || 1),
        String(b.conditions || '').trim(), now()
      );
      const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(Number(info.lastInsertRowid));
      return send(res, 201, { request: requestRow(row) });
    }

    /* ---------- Заявка (детально) ---------- */
    if (/^\/api\/requests\/\d+$/.test(p) && req.method === 'GET') {
      const id = Number(p.split('/')[3]);
      const r = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
      if (!r) return send(res, 404, { error: 'Заявка не найдена' });
      const volunteers = db.prepare(`
        SELECT resp.*, u.name AS volunteer_name, u.city AS volunteer_city, u.phone AS volunteer_phone, u.email AS volunteer_email,
          (SELECT COUNT(*) FROM responses rr WHERE rr.volunteer_id = u.id AND rr.status = 'done') AS help_count
        FROM responses resp JOIN users u ON u.id = resp.volunteer_id
        WHERE resp.request_id = ?
        ORDER BY CASE resp.status WHEN 'accepted' THEN 0 WHEN 'done' THEN 1 ELSE 2 END, resp.created_at ASC
      `).all(id);
      const foundNow = volunteers.filter((v) => v.status === 'applied' || v.status === 'accepted').length;
      const result = {
        ...requestRow(r),
        volunteersFound: foundNow,
        volunteers: volunteers.map((v) => ({ ...responseRow(v), volunteerName: v.volunteer_name, volunteerCity: v.volunteer_city, volunteerPhone: v.volunteer_phone, volunteerEmail: v.volunteer_email, volunteerHelpCount: v.help_count })),
      };
      return send(res, 200, { request: result });
    }

    /* ---------- Статус заявки ---------- */
    if (/^\/api\/requests\/\d+$/.test(p) && req.method === 'PATCH') {
      if (!me) return send(res, 401, { error: 'Нужно войти' });
      const id = Number(p.split('/')[3]);
      const r = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
      if (!r) return send(res, 404, { error: 'Заявка не найдена' });
      if (r.author_id !== me.id) return send(res, 403, { error: 'Это может сделать только автор заявки' });
      const b = await readBody(req);
      const status = b.status;
      if (!['open', 'in_progress', 'done', 'closed'].includes(status)) return send(res, 400, { error: 'Неверный статус' });
      db.prepare('UPDATE requests SET status = ? WHERE id = ?').run(status, id);
      const updated = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
      return send(res, 200, { request: requestRow(updated) });
    }

    /* ---------- Отклик волонтёра ---------- */
    if (/^\/api\/requests\/\d+\/respond$/.test(p) && req.method === 'POST') {
      if (!me) return send(res, 401, { error: 'Нужно войти' });
      if (me.role !== 'volunteer') return send(res, 403, { error: 'Откликаться на заявки могут волонтёры' });
      const id = Number(p.split('/')[3]);
      const r = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
      if (!r) return send(res, 404, { error: 'Заявка не найдена' });
      if (!['open', 'in_progress'].includes(r.status)) return send(res, 400, { error: 'Заявка уже закрыта' });
      const existing = db.prepare('SELECT id FROM responses WHERE request_id = ? AND volunteer_id = ?').get(id, me.id);
      if (existing) return send(res, 400, { error: 'Вы уже откликнулись на эту заявку' });
      const b = await readBody(req);
      db.prepare('INSERT INTO responses (request_id, volunteer_id, message, status, created_at) VALUES (?,?,?,\'applied\',?)')
        .run(id, me.id, String(b.message || '').trim().slice(0, 1000), now());
      db.prepare('UPDATE requests SET status = CASE WHEN status = \'open\' THEN \'in_progress\' ELSE status END, volunteers_found = volunteers_found + 1 WHERE id = ?').run(id);
      db.prepare('UPDATE volunteer_profiles SET last_active = ? WHERE user_id = ?').run(now(), me.id);
      return send(res, 201, { ok: true });
    }

    /* ---------- Действия с откликом (организация) ---------- */
    if (/^\/api\/responses\/\d+$/.test(p) && req.method === 'PATCH') {
      if (!me) return send(res, 401, { error: 'Нужно войти' });
      const id = Number(p.split('/')[3]);
      const resp = db.prepare(`SELECT resp.*, req.author_id, req.title AS request_title FROM responses resp JOIN requests req ON req.id = resp.request_id WHERE resp.id = ?`).get(id);
      if (!resp) return send(res, 404, { error: 'Отклик не найден' });
      const b = await readBody(req);
      const action = b.action;

      // Волонтёр отменяет свой отклик
      if (action === 'cancel') {
        if (resp.volunteer_id !== me.id) return send(res, 403, { error: 'Недостаточно прав' });
        if (resp.status !== 'applied') return send(res, 400, { error: 'Отклик уже обработан' });
        db.prepare('DELETE FROM responses WHERE id = ?').run(id);
        db.prepare('UPDATE requests SET volunteers_found = MAX(0, volunteers_found - 1) WHERE id = ?').run(resp.request_id);
        return send(res, 200, { ok: true });
      }

      // Организация: принять / отклонить / завершить
      if (resp.author_id !== me.id) return send(res, 403, { error: 'Решать может только автор заявки' });

      if (action === 'accept') {
        if (resp.status !== 'applied') return send(res, 400, { error: 'Отклик уже обработан' });
        db.prepare('UPDATE responses SET status = \'accepted\' WHERE id = ?').run(id);
        return send(res, 200, { ok: true });
      }
      if (action === 'decline') {
        if (resp.status !== 'applied') return send(res, 400, { error: 'Отклик уже обработан' });
        db.prepare('UPDATE responses SET status = \'declined\' WHERE id = ?').run(id);
        db.prepare('UPDATE requests SET volunteers_found = MAX(0, volunteers_found - 1) WHERE id = ?').run(resp.request_id);
        return send(res, 200, { ok: true });
      }

      // Завершение помощи + оценка волонтёра
      if (action === 'finish') {
        const status = resp.status;
        if (!['accepted'].includes(status)) return send(res, 400, { error: 'Сначала примите отклик' });
        const rating = b.rating ? Math.min(5, Math.max(1, Math.round(Number(b.rating)))) : null;
        const review = String(b.review || '').trim().slice(0, 600);
        const hours = Math.max(0, Math.round(Number(b.hours) || 0));
        db.prepare('UPDATE responses SET status = \'done\', rating = ?, review = ?, hours = ? WHERE id = ?')
          .run(rating, review, hours, id);
        // Остальные принятые волонтёры по этой заявке — тоже можно считать завершёнными? Нет, каждый закрывается отдельно.
        const left = db.prepare(`SELECT COUNT(*) c FROM responses WHERE request_id = ? AND status IN ('accepted')`).get(resp.request_id);
        if (left.c === 0) {
          const hasAny = db.prepare(`SELECT COUNT(*) c FROM responses WHERE request_id = ? AND status = 'done'`).get(resp.request_id);
          db.prepare(`UPDATE requests SET status = ? WHERE id = ?`).run(hasAny.c ? 'done' : 'in_progress', resp.request_id);
        }
        return send(res, 200, { ok: true });
      }
      return send(res, 400, { error: 'Неизвестное действие' });
    }

    /* ---------- Сообщения ---------- */
    if (p === '/api/messages' && req.method === 'POST') {
      if (!me) return send(res, 401, { error: 'Нужно войти' });
      const b = await readBody(req);
      const toUser = Number(b.to_user);
      const text = String(b.text || '').trim();
      if (!toUser || text.length < 1) return send(res, 400, { error: 'Пустое сообщение' });
      const target = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(toUser);
      if (!target) return send(res, 404, { error: 'Пользователь не найден' });
      if (toUser === me.id) return send(res, 400, { error: 'Нельзя писать самому себе' });
      db.prepare('INSERT INTO messages (request_id, from_user, to_user, text, created_at) VALUES (?,?,?,?,?)')
        .run(b.request_id ? Number(b.request_id) : null, me.id, toUser, text.slice(0, 2000), now());
      return send(res, 201, { ok: true, toUser: { id: target.id, name: target.name, role: target.role } });
    }

    if (p === '/api/messages' && req.method === 'GET') {
      if (!me) return send(res, 401, { error: 'Нужно войти' });
      const peer = q.get('peer') ? Number(q.get('peer')) : null;
      const rows = db.prepare(`
        SELECT m.*, u_from.name AS from_name, u_from.role AS from_role, u_to.name AS to_name
        FROM messages m
        JOIN users u_from ON u_from.id = m.from_user
        JOIN users u_to ON u_to.id = m.to_user
        WHERE (m.from_user = ? AND (? IS NULL OR m.to_user = ?)) OR (m.to_user = ? AND (? IS NULL OR m.from_user = ?))
        ORDER BY m.created_at ASC LIMIT 500
      `).all(me.id, peer, peer, me.id, peer, peer);
      return send(res, 200, { messages: rows });
    }

    if (p === '/api/inbox' && req.method === 'GET') {
      if (!me) return send(res, 401, { error: 'Нужно войти' });
      const rows = db.prepare(`
        SELECT other.id AS peer_id, other.name AS peer_name, other.role AS peer_role,
          m.text AS last_text, m.created_at AS last_at
        FROM (
          SELECT CASE WHEN from_user = ? THEN to_user ELSE from_user END AS peer,
                 MAX(id) AS mid
          FROM messages WHERE from_user = ? OR to_user = ?
          GROUP BY peer
        ) latest
        JOIN messages m ON m.id = latest.mid
        JOIN users other ON other.id = latest.peer
        ORDER BY m.created_at DESC
      `).all(me.id, me.id, me.id);
      return send(res, 200, { conversations: rows });
    }

    /* ---------- Мой кабинет ---------- */
    if (p === '/api/my/requests' && req.method === 'GET') {
      if (!me) return send(res, 401, { error: 'Нужно войти' });
      const rows = db.prepare(`
        SELECT r.*,
          (SELECT COUNT(*) FROM responses resp WHERE resp.request_id = r.id) AS responses_count,
          (SELECT COUNT(*) FROM responses resp WHERE resp.request_id = r.id AND resp.status IN ('accepted','done')) AS accepted_count,
          (SELECT COUNT(*) FROM responses resp WHERE resp.request_id = r.id AND resp.status IN ('applied','accepted')) AS found_now
        FROM requests r WHERE r.author_id = ? ORDER BY r.created_at DESC
      `).all(me.id);
      return send(res, 200, { requests: rows.map((r) => ({ ...requestRow(r), volunteersFound: r.found_now, responsesCount: r.responses_count, acceptedCount: r.accepted_count })) });
    }

    if (p === '/api/my/responses' && req.method === 'GET') {
      if (!me) return send(res, 401, { error: 'Нужно войти' });
      if (me.role !== 'volunteer') return send(res, 403, { error: 'Только для волонтёров' });
      const rows = db.prepare(`
        SELECT resp.*, req.title AS request_title, req.city AS request_city, req.date_start, req.author_name, req.status AS request_status,
          (SELECT COUNT(*) FROM responses rr WHERE rr.request_id = req.id AND rr.status = 'done') AS done_on_request
        FROM responses resp JOIN requests req ON req.id = resp.request_id
        WHERE resp.volunteer_id = ?
        ORDER BY resp.created_at DESC LIMIT 300
      `).all(me.id);
      return send(res, 200, { responses: rows.map((r) => ({ ...responseRow(r), requestTitle: r.request_title, requestCity: r.request_city, requestDateStart: r.date_start, requestAuthorName: r.author_name, requestStatus: r.request_status, doneOnRequest: r.done_on_request })) });
    }

    if (p === '/api/stats' && req.method === 'GET') {
      const volunteers = db.prepare(`SELECT COUNT(*) c FROM users WHERE role='volunteer'`).get().c;
      const active = db.prepare(`SELECT COUNT(*) c FROM requests WHERE status IN ('open','in_progress')`).get().c;
      const done = db.prepare(`SELECT COUNT(*) c FROM responses WHERE status='done'`).get().c;
      const cities = db.prepare(`SELECT city, COUNT(*) c FROM requests GROUP BY city ORDER BY c DESC LIMIT 1`).get();
      return send(res, 200, { stats: { volunteers, activeRequests: active, helpDone: done, topCity: cities?.city || 'Минск' } });
    }

    if (p === '/api/health' && req.method === 'GET') {
      return send(res, 200, { ok: true, name: 'volonter.by API', time: now() });
    }

    send(res, 404, { error: 'Не найдено' });
  } catch (e) {
    jsonError(res, e);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`volonter.by API слушает на http://0.0.0.0:${PORT}`);
});
