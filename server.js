const express = require('express');
const { Pool } = require('pg');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2566';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use(session({
  store: new pgSession({ pool: pool, tableName: 'user_sessions', createTableIfNotExists: true }),
  secret: process.env.SESSION_SECRET || 'antarctica_secret_key_2566',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
}));

// --- СТИЛИ (Mobile-First) ---
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  
  :root {
    --text: #ffffff;
    --text-sec: #8e8e93;
    --bg: #050505;
    --card-bg: rgba(24, 24, 27, 0.75);
    --border: #27272a;
    --accent: #ffffff;
  }

  * {
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
  }

  body {
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }
  
  #bg-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 0;
    pointer-events: none;
  }

  .content-wrapper {
    position: relative;
    z-index: 10;
    width: 100%;
    flex: 1;
  }

  .glass {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 20px;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .container {
    padding: 20px;
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
    position: relative;
  }

  @media (min-width: 768px) {
    .container { padding: 40px; }
  }
  
  h1, h2, h3 {
    font-weight: 800;
    letter-spacing: -0.04em;
  }

  h2 {
    font-size: 28px;
    margin-bottom: 20px;
    text-align: center;
  }

  @media (min-width: 768px) {
    h2 { font-size: 48px; }
  }

  /* ГЛАВНАЯ СТРАНИЦА */
  .hero {
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 20px;
    position: relative;
  }

  .section {
    padding: 60px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  @media (min-width: 768px) {
    .section { padding: 100px 20px; }
  }

  .grid-ideas {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    width: 100%;
    max-width: 1100px;
    margin-top: 40px;
  }
  
  /* 3D КАРТОЧКИ */
  .idea-card {
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    transition: transform 0.1s ease-out, box-shadow 0.1s ease-out;
    transform-style: preserve-3d;
    will-change: transform;
    opacity: 0; /* Скрыто до анимации */
    transform: translateY(40px) scale(0.95);
  }

  .idea-card:hover {
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    border-color: var(--text-sec);
  }

  .idea-card h3 { font-size: 22px; }
  .idea-card p { color: var(--text-sec); font-size: 15px; line-height: 1.6; }
  .idea-num { font-size: 14px; font-weight: 700; color: var(--text-sec); opacity: 0.5; }

  /* ФОРМЫ И АДМИНКА */
  input, select, textarea, button {
    width: 100%;
    padding: 16px;
    margin-bottom: 16px;
    border-radius: 12px;
    font-size: 16px;
  }

  input, select, textarea {
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
    outline: none;
  }

  button {
    background: var(--accent);
    color: var(--bg);
    border: none;
    font-weight: 600;
    cursor: pointer;
  }

  .menu-panel {
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-decoration: none;
    color: var(--text);
    transition: all 0.3s;
    cursor: pointer;
    border-radius: 16px;
    background: var(--card-bg);
    border: 1px solid var(--border);
  }

  .menu-panel:hover {
    border-color: var(--text-sec);
    transform: translateY(-4px);
  }

  .main-menu {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    width: 100%;
    max-width: 600px;
    margin: 40px auto;
  }
  
  .card {
    padding: 24px;
    border-radius: 16px;
    margin-bottom: 16px;
    background: var(--card-bg);
    border: 1px solid var(--border);
  }

  .badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text-sec);
    margin-bottom: 12px;
  }

  .badge.pending { color: #f59e0b; border-color: rgba(245,158,11,0.3); }
  .badge.approved { color: #10b981; border-color: rgba(16,185,129,0.3); }
  .badge.rejected { color: #ef4444; border-color: rgba(239,68,68,0.3); }

  .admin-tabs {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 32px;
  }

  @media (min-width: 768px) {
    .admin-tabs { flex-direction: row; }
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 20px;
    border-radius: 10px;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
    font-size: 14px;
    text-decoration: none;
    cursor: pointer;
    width: 100%;
  }

  @media (min-width: 768px) {
    .action-btn { width: auto; }
  }

  .action-btn:hover { border-color: var(--text); }

  /* ФУТЕР (Подвал сайта) */
  .site-footer {
    position: relative;
    z-index: 10;
    width: 100%;
    background: rgba(0, 0, 0, 0.4);
    border-top: 1px solid var(--border);
    padding: 60px 20px 30px;
    margin-top: auto;
  }

  .footer-content {
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr;
    gap: 40px;
  }

  @media (min-width: 768px) {
    .footer-content { grid-template-columns: repeat(2, 1fr); }
  }

  .footer-col h4 {
    font-size: 16px;
    margin-bottom: 16px;
    color: var(--text);
    letter-spacing: 0.5px;
  }

  .footer-col p, .footer-col ul {
    color: var(--text-sec);
    font-size: 14px;
    line-height: 1.6;
  }

  .footer-col ul {
    list-style: none;
    padding: 0;
  }

  .footer-col ul li {
    margin-bottom: 10px;
  }

  .footer-col ul li a {
    color: var(--text-sec);
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-col ul li a:hover {
    color: var(--text);
  }
`;

const scripts = `
  <div id="cursor-glow"></div>
  <canvas id="bg-canvas"></canvas>

  <script>
    const glow = document.getElementById('cursor-glow');
    window.addEventListener('mousemove', (e) => {
      if (glow) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
      }
    }, { passive: true });

    // 3D НАКЛОН КАРТОЧЕК
    document.querySelectorAll('.idea-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        card.style.transform = \`perspective(1000px) rotateX(\${rotateX}deg) rotateY(\${rotateY}deg) scale3d(1.02, 1.02, 1.02)\`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      });
    });

    // КУБИКИ
    if (!window.location.pathname.startsWith('/admin')) {
      const canvas = document.getElementById('bg-canvas');
      const ctx = canvas.getContext('2d', { alpha: true });
      let width, height, mouse = { x: -1000, y: -1000 }, cubes = [];
      const spacing = 50, cubeSize = 20;
      
      function resize() { 
        width = canvas.width = window.innerWidth; 
        height = canvas.height = window.innerHeight; 
        initCubes(); 
      }
      
      function initCubes() { 
        cubes = []; 
        for (let x = spacing/2; x < width; x += spacing) { 
          for (let y = spacing/2; y < height; y += spacing) { 
            cubes.push({ x, y, baseX: x, baseY: y, vx: 0, vy: 0, phase: Math.random() * Math.PI * 2, speed: 0.001 + Math.random() * 0.002 }); 
          } 
        } 
      }
      
      window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
      window.addEventListener('touchmove', (e) => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }, { passive: true });
      
      function animateCanvas(time) {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        
        cubes.forEach(cube => {
          let targetX = cube.baseX + Math.sin(time * cube.speed + cube.phase) * 8;
          let targetY = cube.baseY + Math.cos(time * cube.speed + cube.phase) * 8;
          let dx = mouse.x - cube.x, dy = mouse.y - cube.y, distSq = dx * dx + dy * dy;
          
          if (distSq < 22500) { 
            let dist = Math.sqrt(distSq); 
            let force = (150 - dist) / 150; 
            targetX -= (dx / dist) * force * 40; 
            targetY -= (dy / dist) * force * 40; 
          }
          
          cube.vx += (targetX - cube.x) * 0.05; 
          cube.vy += (targetY - cube.y) * 0.05; 
          cube.vx *= 0.8; 
          cube.vy *= 0.8; 
          cube.x += cube.vx; 
          cube.y += cube.vy;
          
          ctx.beginPath(); 
          if (ctx.roundRect) {
            ctx.roundRect(cube.x - cubeSize/2, cube.y - cubeSize/2, cubeSize, cubeSize, 5); 
          } else {
            ctx.rect(cube.x - cubeSize/2, cube.y - cubeSize/2, cubeSize, cubeSize);
          }
          ctx.fill();
        });
        requestAnimationFrame(animateCanvas);
      }
      
      window.addEventListener('resize', resize); 
      resize(); 
      requestAnimationFrame(animateCanvas);
    }
  </script>

  <!-- Anime.js v4 для анимаций карточек -->
  <script type="module">
    import { animate, stagger } from 'https://esm.sh/animejs@4';

    // Надежная анимация карточек при скролле (через IntersectionObserver)
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animate('.idea-card', {
          opacity: [0, 1],
          y: [40, 0],
          scale: [0.95, 1],
          delay: stagger(100),
          duration: 800,
          ease: 'out(3)'
        });
        observer.disconnect(); // Отключаем после первого появления
      }
    }, { threshold: 0.1 });

    const section = document.querySelector('.section');
    if (section) observer.observe(section);
  </script>
`;

// --- ХЕЛПЕР ДЛЯ ПОДВАЛА ---
const footerHtml = `
  <footer class="site-footer">
    <div class="footer-content">
      <div class="footer-col">
        <h4>Навигация</h4>
        <ul>
          <li><a href="/">Главная</a></li>
          <li><a href="/apply">Подать заявку</a></li>
          <li><a href="/check-status">Проверить статус</a></li>
          <li><a href="/login">Вход для сотрудников</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Контакты</h4>
        <ul>
          <li><a href="#">Discord</a></li>
        </ul>
      </div>
    </div>
  </footer>
`;

const renderDashboard = async (user, res, message = '') => {
  const { rows: tasks } = await pool.query(`SELECT * FROM tasks WHERE (role = $1 OR role = 'all' OR role = $2) AND status != 'Удалено' AND (completed_at IS NULL OR completed_at > NOW() - INTERVAL '24 hours') ORDER BY created_at DESC`, [user.role, user.username]);
  const { rows: ann } = await pool.query(`SELECT * FROM announcements ORDER BY created_at DESC LIMIT 1`);
  const announcement = ann.length > 0 ? `<div class="card" style="border-left: 4px solid var(--accent); margin-bottom: 24px;"><h3 style="margin-bottom: 8px;">${ann[0].title}</h3><p style="color:var(--text-sec);">${ann[0].content}</p></div>` : '';

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Кабинет</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; flex-wrap: wrap; gap: 16px;">
      <div><h2 style="text-align:left; margin:0; font-size:24px;">${user.name}</h2><p style="color:var(--text-sec); font-size:14px; margin-top:4px;">${user.role} · Очки: <b style="color:var(--text);">${user.points}</b></p></div>
      <div style="display:flex; gap:8px;"><button onclick="document.getElementById('settings-modal').style.display='flex'" class="action-btn" style="width:auto;">Настройки</button><a href="/logout" class="action-btn">Выйти</a></div>
    </div>
    ${message ? `<div class="card" style="background:rgba(16,185,129,0.1); color:#10b981; border-color:rgba(16,185,129,0.2);">${message}</div>` : ''}
    ${announcement}
    <div class="grid-ideas">`;
  
  if (tasks.length === 0) html += `<p style="text-align:center; color:var(--text-sec); grid-column: 1/-1; padding:40px;">Нет активных задач.</p>`;
  else {
    tasks.forEach((task) => {
      let badgeClass = 'pending', badgeText = 'Свободна'; let actionHtml = '';
      if (task.status === 'Свободна') { actionHtml = `<form action="/task/take" method="POST"><input type="hidden" name="task_id" value="${task.id}"><button type="submit" style="margin-top:16px;">Взять задачу</button></form>`; }
      else if (task.status === 'В работе') {
        if (task.taken_by === user.username) { badgeClass = 'pending'; badgeText = 'В работе'; actionHtml = `<form action="/task/done" method="POST" enctype="multipart/form-data" style="margin-top:16px;"><input type="hidden" name="task_id" value="${task.id}"><input type="file" name="proof" required style="margin-bottom:12px;"><button type="submit" style="background:#10b981; color:#fff; margin-top:8px;">Сдать на проверку</button></form>`; }
        else { badgeClass = 'pending'; badgeText = 'В работе'; actionHtml = `<p style="color:var(--text-sec); font-size:13px; margin-top:16px;">Взял: ${task.taken_by}</p>`; }
      } else if (task.status === 'Выполнено') { badgeClass = 'approved'; badgeText = 'На проверке'; }
      
      html += `<div class="card idea-card" style="border-left: 4px solid var(--text); opacity: 1; transform: none;"><span class="badge ${badgeClass}">${badgeText} · ${task.role}</span><h3 style="margin:0;">${task.title}</h3><p style="color:var(--text-sec); font-size:14px; margin-top:8px;">${task.description}</p>${actionHtml}</div>`;
    });
  }
  
  html += `</div></div>
  <div id="settings-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); backdrop-filter:blur(5px); z-index:10000; justify-content:center; align-items:center; padding: 16px;">
    <div class="glass" style="max-width:400px; width:100%; padding:32px; position:relative;">
      <button onclick="document.getElementById('settings-modal').style.display='none'" style="position:absolute; top:16px; right:16px; background:transparent; border:none; color:var(--text-sec); font-size:24px; cursor:pointer; width:auto;">&times;</button>
      <h3 style="text-align:center; margin-bottom:24px;">Сменить пароль</h3>
      <form action="/change-password" method="POST"><input type="password" name="old_password" placeholder="Старый пароль" required><input type="password" name="new_password" placeholder="Новый пароль" required><button type="submit" style="width:100%;">Обновить</button></form>
    </div>
  </div>
  ${footerHtml}
  </body></html>`;
  res.send(html);
};

// --- ГЛАВНАЯ СТРАНИЦА (БЕЗ НАДПИСИ ИГЛА СВЕРХУ) ---
app.get('/', (req, res) => { 
  if (req.session.user) return res.redirect('/dashboard');
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>ИГЛА | Survival in Antarctica</title><style>${css}</style></head><body>${scripts}
  
  <div class="content-wrapper">
    <div class="hero">
      <div class="main-menu">
        <a href="/apply" class="menu-panel"><h3>Присоединиться</h3><p>Подать заявку в команду</p></a>
        <a href="/login" class="menu-panel"><h3>Сотрудникам</h3><p>Вход в личный кабинет</p></a>
        <a href="/check-status" class="menu-panel"><h3>Статус</h3><p>Проверить статус заявки</p></a>
      </div>
    </div>

    <div class="section">
      <h2>Почему мы лучшие?</h2>
      <p style="color:var(--text-sec); text-align:center; max-width:600px;">Мы не стоим на месте. Мы взяли все баги, все ошибки и превратили их в идеальный опыт выживания.</p>
      <div class="grid-ideas">
        <div class="glass idea-card">
          <div class="idea-num">01</div>
          <h3>Уникальные механики</h3>
          <p>Мы разработали систему замерзания, которой нет ни у кого. Пока другие копируют, мы создаем.</p>
        </div>
        <div class="glass idea-card">
          <div class="idea-num">02</div>
          <h3>Скорость и качество</h3>
          <p>Наши баги фиксятся за часы, а не дни. Команда работает 24/7, чтобы игроки чувствовали стабильность.</p>
        </div>
        <div class="glass idea-card">
          <div class="idea-num">03</div>
          <h3>Мы задаем тренд</h3>
          <p>Наши идеи копируют. Это значит, что мы на шаг впереди. Мы продолжим создавать будущее.</p>
        </div>
      </div>
    </div>
  </div>
  
  ${footerHtml}
  </body></html>`); 
});

app.get('/apply', (req, res) => { res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Подать заявку</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass"><h2 style="text-align:center; margin-bottom:24px;">Заявка в команду</h2>${req.query.error ? '<div class="card" style="background:rgba(239,68,68,0.1); color:#ef4444; border-color:rgba(239,68,68,0.2);">Заполните все поля!</div>' : ''}<form action="/apply" method="POST"><input name="name" placeholder="Ваше имя" required><input name="location" placeholder="Страна / Город" required><input name="roblox" placeholder="Ник в Roblox" required><input name="discord" placeholder="Discord" required><input name="telegram" placeholder="Telegram (необязательно)"><select name="role" required><option value="" disabled selected hidden>Кем вы хотите быть?</option><option>Билдер</option><option>Скриптер</option><option>GUI-дизайнер</option><option>Аниматор</option><option>Тестер</option></select><input name="username" placeholder="Логин для входа" required><input name="password" type="password" placeholder="Пароль для входа" required><button type="submit">Отправить заявку</button></form><div style="text-align:center; margin-top:24px;"><a href="/" style="color:var(--text-sec); text-decoration:none;">← На главную</a></div></div></div>${footerHtml}</body></html>`); });

app.post('/apply', async (req, res) => { const { name, location, roblox, discord, telegram, role, username, password } = req.body; if (!name || !location || !roblox || !discord || !role || !username || !password) return res.redirect('/apply?error=1'); try { await pool.query(`INSERT INTO applications (name, location, roblox_nick, discord, telegram, role, username, password, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'На рассмотрении')`, [name, location, roblox, discord, telegram || null, role, username.trim(), password.trim()]); res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass"><h2 style="color:#10b981; text-align:center;">Успешно!</h2><p style="color:var(--text-sec); text-align:center; margin-bottom:24px;">Заявка отправлена. Мы свяжемся с вами.</p><div style="text-align:center;"><a href="/" style="color:var(--text-sec); text-decoration:none;">← На главную</a></div></div></div>${footerHtml}</body></html>`); } catch (err) { res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass"><h2 style="color:#ef4444; text-align:center;">Ошибка</h2><div class="card" style="background:rgba(239,68,68,0.1); color:#ef4444; border-color:rgba(239,68,68,0.2);">Логин уже занят.</div><div style="text-align:center;"><a href="/apply" style="color:var(--text-sec); text-decoration:none;">← Назад</a></div></div></div>${footerHtml}</body></html>`); } });

app.get('/check-status', (req, res) => { res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Статус заявки</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass"><h2 style="text-align:center; margin-bottom:24px;">Статус заявки</h2><form action="/check-status" method="POST"><input name="username" placeholder="Логин" required><input name="password" type="password" placeholder="Пароль" required><button type="submit">Проверить</button></form><div style="text-align:center; margin-top:24px;"><a href="/" style="color:var(--text-sec); text-decoration:none;">← На главную</a></div></div></div>${footerHtml}</body></html>`); });

app.post('/check-status', async (req, res) => { const username = (req.body.username || '').trim(); const password = (req.body.password || '').trim(); try { const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2 AND is_deleted = false', [username, password]); if (rows.length === 0) { return res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass"><h2 style="text-align:center;">Ошибка</h2><div class="card" style="background:rgba(239,68,68,0.1); color:#ef4444; border-color:rgba(239,68,68,0.2);">Неверный логин или пароль.</div><div style="text-align:center;"><a href="/check-status" style="color:var(--text-sec); text-decoration:none;">← Назад</a></div></div></div>${footerHtml}</body></html>`); } const data = rows[0]; let statusText = 'На рассмотрении', cardClass = 'pending', extraText = ''; if (data.status === 'Одобрено') { statusText = 'Одобрено. Добро пожаловать в команду.'; cardClass = 'approved'; } if (data.status === 'Отклонено') { statusText = 'Отклонено.'; cardClass = 'rejected'; } if (data.admin_comment) { extraText = `<div class="card" style="color:#ef4444; margin-top:16px;"><b>Комментарий куратора:</b><br>${data.admin_comment}</div>`; } res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass"><h2 style="text-align:center;">Ваша заявка</h2><div class="card" style="margin-top:24px;"><span class="badge ${cardClass}">${statusText}</span><p style="margin:12px 0 8px;"><b>Имя:</b> ${data.name}</p><p style="margin:0 0 16px;"><b>Роль:</b> ${data.role}</p>${extraText}</div><div style="text-align:center;"><a href="/check-status" style="color:var(--text-sec); text-decoration:none;">← Назад</a></div></div></div>${footerHtml}</body></html>`); } catch (err) { res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass"><h2 style="text-align:center;">Ошибка</h2><div class="card" style="background:rgba(239,68,68,0.1); color:#ef4444; border-color:rgba(239,68,68,0.2);">${err.message}</div><div style="text-align:center;"><a href="/check-status" style="color:var(--text-sec); text-decoration:none;">← Назад</a></div></div></div>${footerHtml}</body></html>`); } });

app.get('/login', (req, res) => { 
  if (req.session.user) return res.redirect('/dashboard');
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Вход</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass"><h2 style="text-align:center; margin-bottom:24px;">Вход для сотрудников</h2><form action="/login" method="POST"><input name="username" placeholder="Логин" required><input name="password" type="password" placeholder="Пароль" required><button type="submit">Войти</button></form><div style="text-align:center; margin-top:24px;"><a href="/" style="color:var(--text-sec); text-decoration:none;">← На главную</a></div></div></div>${footerHtml}</body></html>`); 
});

app.post('/login', async (req, res) => { 
  const { username, password } = req.body; 
  try { 
    const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2 AND is_deleted = false', [username.trim(), password.trim()]); 
    if (rows.length === 0) return res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass"><h2 style="text-align:center;">Ошибка</h2><div class="card" style="background:rgba(239,68,68,0.1); color:#ef4444; border-color:rgba(239,68,68,0.2);">Неверный логин или пароль.</div><div style="text-align:center;"><a href="/login" style="color:var(--text-sec); text-decoration:none;">← Назад</a></div></div></div>${footerHtml}</body></html>`); 
    const user = rows[0]; 
    if (user.status !== 'Одобрено') return res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass"><h2 style="text-align:center;">Доступ закрыт</h2><div class="card" style="background:rgba(239,68,68,0.1); color:#ef4444; border-color:rgba(239,68,68,0.2);">Заявка не одобрена.</div><div style="text-align:center;"><a href="/" style="color:var(--text-sec); text-decoration:none;">← На главную</a></div></div></div>${footerHtml}</body></html>`); 
    req.session.user = user;
    res.redirect('/dashboard');
  } catch (err) { res.status(500).send('Ошибка'); } 
});

app.get('/dashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const { rows } = await pool.query('SELECT * FROM applications WHERE id = $1', [req.session.user.id]);
    if (rows.length === 0) { req.session.destroy(); return res.redirect('/login'); }
    req.session.user = rows[0];
    await renderDashboard(req.session.user, res);
  } catch (err) { res.status(500).send('Ошибка'); }
});

app.get('/logout', (req, res) => { req.session.destroy(() => { res.redirect('/'); }); });

app.post('/change-password', async (req, res) => { 
  if (!req.session.user) return res.redirect('/login');
  const { old_password, new_password } = req.body; 
  if (req.session.user.password !== old_password) return res.send('<script>alert("Старый пароль неверный"); history.back();</script>');
  await pool.query('UPDATE applications SET password = $1 WHERE id = $2', [new_password.trim(), req.session.user.id]); 
  req.session.user.password = new_password.trim();
  await renderDashboard(req.session.user, res, 'Пароль успешно изменен!'); 
});

app.post('/task/take', async (req, res) => { 
  if (!req.session.user) return res.redirect('/login');
  const { task_id } = req.body; 
  await pool.query("UPDATE tasks SET status = 'В работе', taken_by = $1 WHERE id = $2", [req.session.user.username, task_id]); 
  await renderDashboard(req.session.user, res); 
});

app.post('/task/done', (req, res) => { 
  if (!req.session.user) return res.redirect('/login');
  let chunks = []; req.on('data', chunk => chunks.push(chunk)); 
  req.on('end', async () => { 
    const buffer = Buffer.concat(chunks); const boundary = req.headers['content-type'].split('boundary=')[1]; 
    const parts = buffer.toString('binary').split('--' + boundary); 
    let task_id, proofBase64 = '', filename = 'file'; 
    for (let part of parts) { 
      if (part.includes('name="task_id"')) task_id = part.split('\r\n\r\n')[1].split('\r\n')[0]; 
      if (part.includes('name="proof"')) { 
        const nameMatch = part.match(/filename="(.*)"/); 
        if (nameMatch) filename = nameMatch[1]; 
        const matches = part.match(/Content-Type: (.*)\r\n\r\n([\s\S]*)\r\n$/); 
        if (matches) { proofBase64 = `data:${matches[1]};base64,${Buffer.from(matches[2], 'binary').toString('base64')}`; } 
      } 
    } 
    if (task_id) { 
      await pool.query("UPDATE tasks SET status = 'Выполнено', completed_at = NOW(), proof_file = $1, proof_filename = $2 WHERE id = $3 AND taken_by = $4", [proofBase64, filename, task_id, req.session.user.username]); 
      await renderDashboard(req.session.user, res); 
    } else { res.redirect('/dashboard'); } 
  }); 
});

// АДМИН-ПАНЕЛЬ
app.get('/admin', async (req, res) => { 
  const pass = req.query.pass; const tab = req.query.tab || 'dash'; 
  if (pass !== ADMIN_PASSWORD) return res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Вход в админку</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass" style="max-width:380px; margin-top:120px;"><h2 style="text-align:center;">Вход для админа</h2><form><input name="pass" type="password" placeholder="Пароль" required><button type="submit">Войти</button></form></div></div>${footerHtml}</body></html>`);
  
  try { 
    const stats = await pool.query(`SELECT (SELECT COUNT(*) FROM applications WHERE status = 'Одобрено' AND is_deleted = false) as workers, (SELECT COUNT(*) FROM applications WHERE status = 'На рассмотрении' AND is_deleted = false) as new_apps, (SELECT COUNT(*) FROM tasks WHERE status = 'В работе') as in_work, (SELECT COUNT(*) FROM tasks WHERE status = 'Выполнено') as on_review`); 
    const s = stats.rows[0]; 
    const { rows: allWorkers } = await pool.query("SELECT username, name FROM applications WHERE status = 'Одобрено' AND is_deleted = false ORDER BY name ASC");
    
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Админ-панель</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; flex-direction: column; align-items: flex-start; gap: 16px;">
      <h2 style="margin:0; font-size:24px;">Админ-панель</h2>
      <div class="admin-tabs">
        <a href="/admin?pass=${pass}&tab=dash" class="action-btn" style="${tab === 'dash' ? 'background:var(--text); color:var(--bg);' : ''}">Обзор</a>
        <a href="/admin?pass=${pass}&tab=announcements" class="action-btn" style="${tab === 'announcements' ? 'background:var(--text); color:var(--bg);' : ''}">Объявления</a>
        <a href="/admin?pass=${pass}&tab=tasks" class="action-btn" style="${tab === 'tasks' ? 'background:var(--text); color:var(--bg);' : ''}">Задачи</a>
        <a href="/admin?pass=${pass}&tab=applications" class="action-btn" style="${tab === 'applications' ? 'background:var(--text); color:var(--bg);' : ''}">Заявки</a>
        <a href="/admin?pass=${pass}&tab=workers" class="action-btn" style="${tab === 'workers' ? 'background:var(--text); color:var(--bg);' : ''}">Сотрудники</a>
        <a href="/admin?pass=${pass}&tab=trash" class="action-btn" style="${tab === 'trash' ? 'background:var(--text); color:var(--bg);' : ''}">Корзина</a>
      </div>
    </div>`;

    if (tab === 'dash') { 
      html += `<div class="grid-ideas" style="margin-bottom:32px;"><div class="card"><h3 style="font-size:28px; margin:0;">${s.workers}</h3><p style="color:var(--text-sec);">Сотрудников</p></div><div class="card"><h3 style="font-size:28px; margin:0;">${s.new_apps}</h3><p style="color:var(--text-sec);">Новых заявок</p></div><div class="card"><h3 style="font-size:28px; margin:0;">${s.in_work}</h3><p style="color:var(--text-sec);">В работе</p></div><div class="card"><h3 style="font-size:28px; margin:0;">${s.on_review}</h3><p style="color:var(--text-sec);">На проверке</p></div></div>`; 
      const { rows: topWorkers } = await pool.query("SELECT * FROM applications WHERE status = 'Одобрено' AND is_deleted = false ORDER BY points DESC LIMIT 5"); 
      html += `<h3 style="margin-top:32px;">Топ сотрудников</h3><div class="grid-ideas">`; 
      topWorkers.forEach((w) => { html += `<div class="card"><p style="margin:0; font-size:16px; font-weight:600;">${w.name}</p><p style="margin:4px 0 0; color:var(--text-sec); font-size:13px;">${w.role} · ${w.points} очк.</p></div>`; }); 
      html += `</div>`; 
    }
    else if (tab === 'announcements') {
      html += `<div class="card"><h3>Новое объявление</h3><form action="/admin/announcement" method="POST" style="margin-top:16px;"><input type="hidden" name="pass" value="${pass}"><input name="title" placeholder="Заголовок" required><textarea name="content" placeholder="Текст..." rows="3" required></textarea><button type="submit">Опубликовать</button></form></div>`;
      const { rows: anns } = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
      html += `<div class="grid-ideas">`;
      anns.forEach(ann => { html += `<div class="card"><h3>${ann.title}</h3><p style="font-size:14px; color:var(--text-sec);">${ann.content}</p><form action="/admin/delete-announcement" method="POST" onsubmit="return confirm('Удалить?');"><input type="hidden" name="id" value="${ann.id}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="action-btn" style="margin-top:12px; color:#ef4444;">Удалить</button></form></div>`; });
      html += `</div>`;
    }
    else if (tab === 'tasks') {
      const { rows: tasksList } = await pool.query("SELECT * FROM tasks WHERE status != 'Удалено' ORDER BY created_at DESC");
      let workerOptions = allWorkers.map(w => `<option value="${w.username}">${w.name}</option>`).join('');
      html += `<div class="card"><h3>Создать задачу</h3><form action="/admin/task/add" method="POST" style="margin-top:16px;"><input type="hidden" name="pass" value="${pass}"><input name="title" placeholder="Название" required><textarea name="description" placeholder="Описание" rows="3" required></textarea><select name="target" required><option value="" disabled selected hidden>Кому?</option><option value="all">Всем</option><option value="Билдер">Билдеры</option><option value="Скриптер">Скриптеры</option><option value="GUI-дизайнер">GUI-дизайнеры</option><option value="Аниматор">Аниматоры</option><option value="Тестер">Тестеры</option>${workerOptions}</select><input type="datetime-local" name="deadline"><button type="submit">Создать</button></form></div>`;
      html += `<div class="grid-ideas" style="margin-top:24px;">`;
      tasksList.forEach(t => {
        let proofBlock = t.proof_file ? `<a href="${t.proof_file}" download="${t.proof_filename}" class="action-btn" style="margin-top:12px;">Скачать отчет</a>` : '';
        html += `<div class="card"><span class="badge">${t.status}</span><h3>${t.title}</h3><p style="font-size:14px; color:var(--text-sec);">${t.description}</p><p style="font-size:13px; margin-top:8px;"><b>Кому:</b> ${t.role} | <b>Взял:</b> ${t.taken_by || 'Никто'}</p>${proofBlock}`;
        if (t.status === 'Выполнено') html += `<div style="display:flex; gap:10px; margin-top:16px;"><form action="/admin/task/approve" method="POST"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="task_id" value="${t.id}"><button type="submit" style="background:#10b981; color:#fff;">Принять</button></form><form action="/admin/task/reject" method="POST"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="task_id" value="${t.id}"><button type="submit" style="background:#ef4444; color:#fff;">Отклонить</button></form></div>`;
        html += `<form action="/admin/task/delete" method="POST" onsubmit="return confirm('Удалить?');" style="margin-top:8px;"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="id" value="${t.id}"><button type="submit" class="action-btn" style="width:100%; color:#ef4444;">Удалить задачу</button></form></div>`;
      });
      html += `</div>`;
    }
    else if (tab === 'applications') {
      const { rows: apps } = await pool.query("SELECT * FROM applications WHERE status = 'На рассмотрении' AND is_deleted = false");
      html += `<div class="grid-ideas">`;
      if (apps.length === 0) html += `<p>Нет новых заявок.</p>`;
      apps.forEach(a => {
        html += `<div class="card"><h3>${a.name} (${a.role})</h3><p style="font-size:14px; margin-top:8px;"><b>Roblox:</b> ${a.roblox_nick} | <b>Discord:</b> ${a.discord}</p><p style="font-size:14px;"><b>Логин:</b> ${a.username}</p><div style="display:flex; gap:10px; margin-top:16px;"><form action="/admin/app/approve" method="POST"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="id" value="${a.id}"><button type="submit" style="background:#10b981; color:#fff;">Одобрить</button></form><form action="/admin/app/reject" method="POST" style="flex:1; display:flex; gap:8px;"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="id" value="${a.id}"><input name="comment" placeholder="Причина" required style="margin:0; padding:10px;"><button type="submit" style="background:#ef4444; color:#fff; width:auto;">Отклонить</button></form></div></div>`;
      });
      html += `</div>`;
    }
    else if (tab === 'workers') {
      const { rows: workers } = await pool.query("SELECT * FROM applications WHERE status = 'Одобрено' AND is_deleted = false ORDER BY role ASC");
      html += `<div class="grid-ideas">`;
      workers.forEach(w => {
        html += `<div class="card"><h3>${w.name} (${w.role})</h3><p style="margin:8px 0 0 0; font-size:13px; color:var(--text-sec); line-height:1.6;"><b>Город:</b> ${w.location} <br><b>Discord:</b> ${w.discord} <br><b>TG:</b> ${w.telegram || 'Нет'} <br><b>Roblox:</b> ${w.roblox_nick} <br><b>Логин:</b> ${w.username} | <b>Очки:</b> ${w.points}</p><form action="/admin/worker/fire" method="POST" style="margin-top:16px;"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="id" value="${w.id}"><button type="submit" style="background:#ef4444; color:#fff;">Уволить</button></form></div>`;
      });
      html += `</div>`;
    }
    else if (tab === 'trash') {
      const { rows: trash } = await pool.query("SELECT * FROM applications WHERE is_deleted = true");
      html += `<div class="grid-ideas">`;
      if (trash.length === 0) html += `<p>Корзина пуста.</p>`;
      trash.forEach(tr => {
        html += `<div class="card"><h3>${tr.name} (${tr.role})</h3><p style="margin:4px 0 0; color:var(--text-sec); font-size:12px;">Статус: ${tr.status}</p><div style="display:flex; gap:10px; margin-top:16px;"><form action="/admin/worker/restore" method="POST"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="id" value="${tr.id}"><button type="submit" style="background:#10b981; color:#fff;">Восстановить</button></form><form action="/admin/worker/delete-forever" method="POST" onsubmit="return confirm('УДАЛИТЬ НАВСЕГДА?');"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="id" value="${tr.id}"><button type="submit" style="background:#ef4444; color:#fff;">Удалить</button></form></div></div>`;
      });
      html += `</div>`;
    }
    html += `</div></div>${footerHtml}</body></html>`;
    res.send(html);
  } catch (err) { res.status(500).send('Ошибка: ' + err.message); }
});

app.post('/admin/announcement', async (req, res) => { const { pass, title, content } = req.body; await pool.query('INSERT INTO announcements (title, content) VALUES ($1, $2)', [title, content]); res.redirect(`/admin?pass=${pass}&tab=announcements`); });
app.post('/admin/task/add', async (req, res) => { const { pass, title, description, target, deadline } = req.body; await pool.query('INSERT INTO tasks (title, description, role, deadline, status) VALUES ($1, $2, $3, $4, $5)', [title, description, target, deadline || null, 'Свободна']); res.redirect(`/admin?pass=${pass}&tab=tasks`); });
app.post('/admin/task/approve', async (req, res) => { const { pass, task_id } = req.body; const { rows } = await pool.query("SELECT * FROM tasks WHERE id = $1", [task_id]); if (rows.length > 0) { const task = rows[0]; await pool.query("UPDATE tasks SET status = 'Завершено' WHERE id = $1", [task_id]); await pool.query("UPDATE applications SET points = points + 10 WHERE username = $1", [task.taken_by]); } res.redirect(`/admin?pass=${pass}&tab=tasks`); });
app.post('/admin/task/reject', async (req, res) => { const { pass, task_id } = req.body; await pool.query("UPDATE tasks SET status = 'В работе', proof_file = NULL, proof_filename = NULL WHERE id = $1", [task_id]); res.redirect(`/admin?pass=${pass}&tab=tasks`); });
app.post('/admin/task/delete', async (req, res) => { const { pass, id } = req.body; if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа'); await pool.query("UPDATE tasks SET status = 'Удалено' WHERE id = $1", [id]); res.redirect(`/admin?pass=${pass}&tab=tasks`); });
app.post('/admin/app/approve', async (req, res) => { const { pass, id } = req.body; await pool.query("UPDATE applications SET status = 'Одобрено' WHERE id = $1", [id]); res.redirect(`/admin?pass=${pass}&tab=applications`); });
app.post('/admin/app/reject', async (req, res) => { const { pass, id, comment } = req.body; await pool.query("UPDATE applications SET status = 'Отклонено', admin_comment = $1, is_deleted = true WHERE id = $2", [comment, id]); res.redirect(`/admin?pass=${pass}&tab=applications`); });
app.post('/admin/worker/fire', async (req, res) => { const { pass, id } = req.body; await pool.query("UPDATE applications SET is_deleted = true, status = 'Уволен' WHERE id = $1", [id]); res.redirect(`/admin?pass=${pass}&tab=workers`); });
app.post('/admin/worker/restore', async (req, res) => { const { pass, id } = req.body; await pool.query("UPDATE applications SET is_deleted = false, status = 'Одобрено' WHERE id = $1", [id]); res.redirect(`/admin?pass=${pass}&tab=trash`); });
app.post('/admin/worker/delete-forever', async (req, res) => { const { pass, id } = req.body; await pool.query("DELETE FROM applications WHERE id = $1", [id]); res.redirect(`/admin?pass=${pass}&tab=trash`); });
app.post('/admin/delete-announcement', async (req, res) => { const { id, pass } = req.body; if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа'); await pool.query('DELETE FROM announcements WHERE id = $1', [id]); res.redirect('/admin?pass=' + pass + '&tab=announcements'); });

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
