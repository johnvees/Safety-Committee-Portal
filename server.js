const jsonServer = require('json-server');
const fs = require('fs');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// ─── SSE: real-time push ───────────────────────────────────────────────────────
const clients = new Set()

function broadcast(payload) {
  const msg = `data: ${JSON.stringify(payload)}\n\n`
  for (const client of clients) {
    try {
      client.write(msg)
      // Force-flush the compression buffer — json-server's defaults middleware
      // applies gzip to all responses, which buffers SSE events indefinitely.
      // res.flush() (added by the compression package) drains that buffer immediately.
      if (typeof client.flush === 'function') client.flush()
    } catch {
      clients.delete(client)
    }
  }
}

// Hook into lowdb's write — fires synchronously after every DB mutation.
// This is more reliable than wrapping res.json/res.jsonp because json-server
// uses res.jsonp internally, which our middleware would miss.
const _dbWrite = router.db.write.bind(router.db)
router.db.write = function () {
  const result = _dbWrite()
  broadcast({ type: 'change', resource: 'findings' })
  return result
}

// ─── Users: file-backed mutable store ─────────────────────────────────────────
const USERS_FILE = './users.json';
let users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
const saveUsers = () => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
const nextUserId = () => users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

// Increase body size limit to 100mb to support base64 file uploads
server.use(require('body-parser').json({ limit: '100mb' }));
server.use(require('body-parser').urlencoded({ limit: '100mb', extended: true }));

server.use(middlewares);

// ─── SSE endpoint ──────────────────────────────────────────────────────────────
server.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()

  // Confirm connection
  res.write('data: {"type":"connected"}\n\n')
  if (typeof res.flush === 'function') res.flush()

  // Heartbeat every 25s to keep the connection alive through proxies/browsers
  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n')
    if (typeof res.flush === 'function') res.flush()
  }, 25000)

  clients.add(res)
  req.on('close', () => {
    clearInterval(heartbeat)
    clients.delete(res)
  })
})

// ─── Auth ──────────────────────────────────────────────────────────────────────
server.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  const user = users.find(u => u.username === username && u.password === password);
  if (!user)
    return res.status(401).json({ error: 'Username atau password salah' });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// ─── Users CRUD ────────────────────────────────────────────────────────────────
server.get('/users', (_req, res) => {
  res.json(users.map(({ password: _, ...u }) => u));
});

server.post('/users', (req, res) => {
  const { name, username, password, role, department, division, position, email } = req.body || {};
  if (!name || !username || !password || !role)
    return res.status(400).json({ error: 'Field wajib: nama, username, password, role' });
  if (users.find(u => u.username === username))
    return res.status(409).json({ error: 'Username sudah digunakan' });
  const newUser = {
    id: nextUserId(), name, username, password, role,
    department: department || '', division: division || '',
    position: position || '', email: email || '',
  };
  users.push(newUser);
  saveUsers();
  const { password: _, ...safe } = newUser;
  res.status(201).json(safe);
});

server.put('/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: 'User tidak ditemukan' });
  const { password, ...data } = req.body || {};
  users[idx] = { ...users[idx], ...data, id };
  if (password && password.trim()) users[idx].password = password.trim();
  saveUsers();
  const { password: _, ...safe } = users[idx];
  res.json(safe);
});

server.delete('/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: 'User tidak ditemukan' });
  users.splice(idx, 1);
  saveUsers();
  res.json({ success: true });
});

// ─── GuidelineDocs: strip fileUrl from list (lazy load) ───────────────────────
server.get('/guidelineDocs', (_req, res) => {
  const docs = router.db.get('guidelineDocs').value();
  res.json(docs.map(({ fileUrl, ...rest }) => rest));
});

server.use(router);

server.listen(3001, () => {
  console.log('JSON Server is running on port 3001');
});
