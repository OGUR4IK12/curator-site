const express = require('express');
const { Pool } = require('pg');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '526721'; // Твой пин-код админа

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Настройка сессий (хранение входа на 30 дней)
app.use(session({
  secret: process.env.SESSION_SECRET || 'antarctica_secret_key_526721',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
}));

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  :root {
    --text: #1c1c1e; --text-sec: #8e8e93; --bg: #f2f2f7;
    --glass-bg: rgba(255, 255, 255, 0.65);
    --glass-border: rgba(255, 255, 255, 0.8);
    --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
    --accent: #007aff; --danger: #ff3b30; --success: #34c759; --warning: #ff9500;
  }
  [data-theme="dark"] {
    --text: #ffffff; --text-sec: #8e8e93; --bg: #000000;
    --glass-bg: rgba(30, 30, 32, 0.65);
    --glass-border: rgba(255, 255, 255, 0.15);
    --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
    --accent: #0a84ff; --danger: #ff453a; --success: #32d74b; --warning: #ff9f0a;
  }

  * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; transition: background-color 0.3s, color 0.3s, border-color 0.3s; }
  
  body { 
    margin: 0; background: var(--bg); color: var(--text); display: flex; justify-content: center; align-items: center; padding: 20px; min-height: 100vh; position: relative; overflow-x: hidden; 
  }

  #bg-canvas { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0; pointer-events: none; opacity: 0.6; }
  [data-theme="dark"] #bg-canvas { opacity: 0.3; }

  .content-wrapper { position: relative; z-index: 10; width: 100%; display: flex; justify-content: center; align-items: center; }

  .glass { 
    background: var(--glass-bg); 
    backdrop-filter: blur(24px) saturate(200%); -webkit-backdrop-filter: blur(24px) saturate(200%); 
    border: 1px solid var(--glass-border); 
    box-shadow: var(--glass-shadow); 
    border-radius: 32px; 
  }

  .dock { display: flex; gap: 8px; padding: 8px; background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid var(--glass-border); border-radius: 20px; box-shadow: var(--glass-shadow); width: fit-content; margin: 0 auto 32px auto; flex-wrap: wrap; justify-content: center; }
  .dock-btn { display: flex; align-items: center; justify-content: center; padding: 0 16px; height: 44px; border-radius: 12px; background: transparent; border: none; cursor: pointer; color: var(--text); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); font-size: 14px; font-weight: 500; text-decoration: none; }
  .dock-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }
  [data-theme="dark"] .dock-btn:hover { background: rgba(255,255,255,0.1); }
  .dock-btn.active { background: rgba(255,255,255,0.3); }

  .container { padding: 40px; width: 100%; max-width: 480px; margin: 20px auto; position: relative; z-index: 10; }
  .wide-container { max-width: 1100px; width: 100%; }
  
  h1, h2, h3 { text-align: center; color: var(--text); margin-bottom: 16px; font-weight: 600; letter-spacing: -0.04em; }
  
  @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  .animate-in { animation: slideUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; opacity: 0; }
  .delay-1 { animation-delay: 0.1s; } .delay-2 { animation-delay: 0.2s; } .delay-3 { animation-delay: 0.3s; }

  input, select, textarea { 
    width: 100%; padding: 16px; margin-bottom: 16px; 
    background: rgba(255,255,255,0.3); border: 1px solid var(--glass-border); border-radius: 16px; 
    font-size: 15px; color: var(--text); outline: none; backdrop-filter: blur(10px);
  }
  [data-theme="dark"] input, [data-theme="dark"] select, [data-theme="dark"] textarea { background: rgba(0,0,0,0.2); }
  input:focus, select:focus, textarea:focus { border-color: var(--accent); background: rgba(255,255,255,0.5); }
  
  button { width: 100%; padding: 16px; background: var(--accent); color: #fff; border: none; border-radius: 16px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 4px 15px rgba(0,122,255,0.3); }
  button:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 25px rgba(0,122,255,0.4); }
  button:active { transform: scale(0.98); }

  .link { text-align: center; margin-top: 24px; font-size: 14px; }
  .link a { color: var(--text-sec); text-decoration: none; transition: color 0.2s; }
  .link a:hover { color: var(--text); }
  
  .alert { padding: 16px; border-radius: 16px; margin-bottom: 20px; text-align: center; font-size: 14px; background: rgba(255,59,48,0.1); color: var(--danger); border: 1px solid rgba(255,59,48,0.2); backdrop-filter: blur(10px); }
  
  .card { 
    padding: 24px; border-radius: 24px; margin-bottom: 16px; 
    background: var(--glass-bg); backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; 
  }
  .card:hover { transform: translateY(-4px) scale(1.01); }
  
  .badge { display: inline-block; padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 600; margin-bottom: 12px; background: rgba(255,255,255,0.4); color: var(--text); backdrop-filter: blur(5px); }
  .badge.pending { color: var(--warning); border: 1px solid rgba(255,149,0,0.3); }
  .badge.approved { color: var(--success); border: 1px solid rgba(52,199,89,0.3); }
  .badge.rejected { color: var(--danger); border: 1px solid rgba(255,59,48,0.3); }
  .badge.taken { color: var(--accent); border: 1px solid rgba(0,122,255,0.3); }
  
  .action-bar { display: flex; gap: 8px; margin-top: 20px; }
  .action-btn { display: flex; align-items: center; justify-content: center; padding: 10px 16px; border-radius: 12px; background: rgba(255,255,255,0.4); border: 1px solid var(--glass-border); cursor: pointer; transition: all 0.2s; text-decoration: none; font-size: 13px; font-weight: 600; color: var(--text); }
  .action-btn:hover { background: rgba(255,255,255,0.6); transform: scale(1.05); }
  
  .main-menu { display: grid; grid-template-columns: 1fr; gap: 16px; width: 100%; max-width: 600px; margin: 0 auto; }
  .menu-panel { padding: 30px; display: flex; flex-direction: column; align-items: center; text-align: center; text-decoration: none; color: var(--text); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; border-radius: 28px; background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow); }
  .menu-panel:hover { transform: translateY(-6px) scale(1.02); }
  .menu-panel h2 { font-size: 22px; margin-bottom: 8px; }
  .menu-panel p { color: var(--text-sec); font-size: 15px; margin-bottom: 0; }

  .grid { display: grid; grid-template-columns: 1fr; gap: 16px; } 
  @media (min-width: 768px) { .grid { grid-template-columns: 1fr 1fr; } }
  .admin-grid { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start; }
  @media (min-width: 900px) { .admin-grid { grid-template-columns: 1fr 1fr; } }
  
  .worker-row { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-radius: 20px; margin-bottom: 12px; background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid var(--glass-border); transition: all 0.2s; }
  
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
  @media (min-width: 768px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
  .stat-card { background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid var(--glass-border); padding: 24px; border-radius: 24px; text-align: center; box-shadow: var(--glass-shadow); }
  .stat-val { font-size: 36px; font-weight: 700; color: var(--text); line-height: 1; margin-bottom: 8px; }
  .stat-lbl { font-size: 13px; color: var(--text-sec); font-weight: 500; }

  .comments-box { margin-top: 16px; padding: 16px; background: rgba(0,0,0,0.03); border: 1px solid var(--glass-border); border-radius: 16px; font-size: 13px; }
  [data-theme="dark"] .comments-box { background: rgba(255,255,255,0.03); }
  .announcement { background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid var(--glass-border); padding: 24px; border-radius: 24px; margin-bottom: 24px; box-shadow: var(--glass-shadow); }
  
  .progress-bar { width: 100%; height: 8px; background: rgba(0,0,0,0.1); border-radius: 4px; margin-top: 16px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--accent); border-radius: 4px; transition: width 0.5s; }
`;

const scripts = `
  <canvas id="bg-canvas"></canvas>
  <div id="preloader" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:var(--bg);z-index:9999;display:flex;flex-direction:column;justify-content:center;align-items:center;backdrop-filter:blur(10px);"><div class="title-container" id="title-container" style="display:flex;gap:2px;"></div></div>
  <button class="dock" onclick="toggleTheme()" id="theme-btn" style="position:fixed; top:20px; right:20px; z-index:100; padding:12px; cursor:pointer; border:none; font-size:16px; font-weight:600;">Тема</button>

  <script>
    function toggleTheme() {
      const body = document.body;
      const isDark = body.getAttribute('data-theme') === 'dark';
      body.setAttribute('data-theme', isDark ? '' : 'dark');
      localStorage.setItem('theme', isDark ? '' : 'dark');
    }
    if (localStorage.getItem('theme') !== 'light') document.body.setAttribute('data-theme', 'dark');

    if (!sessionStorage.getItem('preloaderShown')) {
      const titleText = "SURVIVAL IN ANTARCTICA";
      const container = document.getElementById('title-container');
      titleText.split('').forEach((char, index) => {
        if (char === ' ') { const space = document.createElement('span'); space.innerHTML = '&nbsp;'; container.appendChild(space); } 
        else {
          const span = document.createElement('span'); span.textContent = char; 
          span.style.cssText = "color:var(--text);font-size:clamp(20px,4vw,36px);font-weight:700;display:inline-block;opacity:0;transform:translateY(20px) scale(0.8);transition:all 0.8s cubic-bezier(0.175,0.885,0.32,1.275);";
          container.appendChild(span);
          setTimeout(() => span.style.cssText += "opacity:1;transform:translateY(0) scale(1);", 100 + index * 40);
        }
      });
      setTimeout(() => { document.getElementById('preloader').style.opacity = '0'; setTimeout(() => document.getElementById('preloader').remove(), 800); sessionStorage.setItem('preloaderShown', 'true'); }, 2500);
    } else { document.getElementById('preloader').remove(); }

    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let width, height, mouse = { x: -1000, y: -1000 }, cubes = [];
    const spacing = 60, cubeSize = 20;

    function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; initCubes(); }
    function initCubes() { cubes = []; for (let x = spacing/2; x < width; x += spacing) { for (let y = spacing/2; y < height; y += spacing) { cubes.push({ x, y, baseX: x, baseY: y, vx: 0, vy: 0, phase: Math.random() * Math.PI * 2, speed: 0.001 + Math.random() * 0.002 }); } } }
    
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('touchmove', (e) => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; });

    function animate(time) {
      ctx.clearRect(0, 0, width, height);
      cubes.forEach(cube => {
        let targetX = cube.baseX + Math.sin(time * cube.speed + cube.phase) * 8;
        let targetY = cube.baseY + Math.cos(time * cube.speed + cube.phase) * 8;
        let dx = mouse.x - cube.x, dy = mouse.y - cube.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) { let force = (150 - dist) / 150; targetX -= (dx / dist) * force * 30; targetY -= (dy / dist) * force * 30; }
        cube.vx += (targetX - cube.x) * 0.05; cube.vy += (targetY - cube.y) * 0.05; cube.vx *= 0.8; cube.vy *= 0.8; cube.x += cube.vx; cube.y += cube.vy;
        
        ctx.fillStyle = document.body.getAttribute('data-theme') === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'; 
        ctx.strokeStyle = document.body.getAttribute('data-theme') === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'; 
        ctx.lineWidth = 1; ctx.beginPath(); 
        if (ctx.roundRect) ctx.roundRect(cube.x - cubeSize/2, cube.y - cubeSize/2, cubeSize, cubeSize, 4); else ctx.rect(cube.x - cubeSize/2, cube.y - cubeSize/2, cubeSize, cubeSize);
        ctx.fill(); ctx.stroke();
      });
      requestAnimationFrame(animate);
    }
    window.addEventListener('resize', resize); resize(); requestAnimationFrame(animate);
  </script>
`;

const renderDashboard = async (user, res, message = '') => {
  const { rows: tasks } = await pool.query(`SELECT * FROM tasks WHERE role = $1 AND status != 'Удалено' AND (completed_at IS NULL OR completed_at > NOW() - INTERVAL '24 hours') ORDER BY created_at DESC`, [user.role]);
  const { rows: ann } = await pool.query(`SELECT * FROM announcements ORDER BY created_at DESC LIMIT 1`);
  const announcement = ann.length > 0 ? `<div class="announcement animate-in"><h3>${ann[0].title}</h3><p>${ann[0].content}</p></div>` : '';

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Кабинет сотрудника</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container wide-container animate-in">
    <div class="dock"><a href="/logout" class="dock-btn">Выйти</a><button class="dock-btn" onclick="document.getElementById('settings-modal').style.display='flex'">Настройки</button></div>
    <div style="text-align:center; margin-bottom:32px;"><h2 style="margin:0;">${user.name}</h2><p style="color:var(--text-sec); font-size:15px; margin-top:8px;">${user.role} · Очков: <b style="color:var(--warning);">${user.points}</b></p></div>
    ${message ? `<div class="alert" style="background:rgba(52,199,89,0.1); color:var(--success); border-color:rgba(52,199,89,0.2);">${message}</div>` : ''}
    ${announcement}
    <div class="grid">`;
  
  if (tasks.length === 0) html += `<p style="text-align:center; color:var(--text-sec); grid-column: 1/-1; padding:40px;">Для вашего отдела пока нет активных задач.</p>`;
  else {
    tasks.forEach((task, i) => {
      let badgeClass = 'pending', badgeText = 'Свободна'; let actionHtml = ''; let deadlineHtml = '';
      if (task.deadline) { const d = new Date(task.deadline).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); deadlineHtml = `<p style="font-size:13px; color:var(--danger); margin-bottom:16px; font-weight:600;">Дедлайн: ${d}</p>`; }
      if (task.status === 'Свободна') { actionHtml = `<form action="/task/take" method="POST"><input type="hidden" name="task_id" value="${task.id}"><button type="submit" style="width:100%;">Взять задачу</button></form>`; }
      else if (task.status === 'В работе') {
        if (task.taken_by === user.username) { badgeClass = 'taken'; badgeText = 'В работе'; actionHtml = `<form action="/task/done" method="POST" enctype="multipart/form-data" style="margin-top:16px;"><input type="hidden" name="task_id" value="${task.id}"><input type="file" name="proof" required style="padding:12px; font-size:14px; margin-bottom:12px; border-radius:16px;"><button type="submit" style="width:100%; background:var(--success); box-shadow:0 4px 15px rgba(52,199,89,0.3);">Отправить на проверку</button></form>`; }
        else { badgeClass = 'taken'; badgeText = 'В работе'; actionHtml = `<p style="color:var(--text-sec); font-size:14px; font-weight:500; padding-top:12px; border-top:1px solid var(--glass-border); margin-top:16px;">Взял: ${task.taken_by}</p>`; }
      } else if (task.status === 'Выполнено') { badgeClass = 'approved'; badgeText = 'На проверке'; actionHtml = `<p style="color:var(--success); font-size:14px; font-weight:500; padding-top:12px; border-top:1px solid var(--glass-border); margin-top:16px;">Сдал: ${task.taken_by}</p>`; }
      html += `<div class="card ${badgeClass} animate-in delay-${Math.min(i+1, 3)}"><span class="badge ${badgeClass}">${badgeText}</span><h3 style="margin-top:0; text-align:left;">${task.title}</h3>${deadlineHtml}<p style="color:var(--text-sec); font-size:15px; margin-bottom:20px; line-height:1.5;">${task.description}</p>${actionHtml}`;
      if (task.comments) html += `<div class="comments-box"><b>Чат:</b><br><span style="color:var(--text-sec)">${task.comments.replace(/\n/g, '<br>')}</span></div>`;
      html += `</div>`;
    });
  }
  html += `</div><div id="settings-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.4); backdrop-filter:blur(20px); z-index:10000; justify-content:center; align-items:center;"><div class="card" style="max-width:400px; width:100%; position:relative; border-radius:32px;"><button class="action-btn" onclick="document.getElementById('settings-modal').style.display='none'" style="position:absolute; top:20px; right:20px; padding:8px 12px;">Закрыть</button><h3 style="text-align:center; margin-bottom:24px;">Сменить пароль</h3><form action="/change-password" method="POST"><input type="password" name="old_password" placeholder="Старый пароль" required><input type="password" name="new_password" placeholder="Новый пароль" required><button type="submit" style="width:100%;">Обновить</button></form></div></div></div></div></body></html>`;
  res.send(html);
};

// --- РОУТЫ ---

app.get('/', (req, res) => { 
  if (req.session.user) return res.redirect('/dashboard');
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Survival in Antarctica</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="main-menu"><a href="/login" class="menu-panel animate-in delay-1"><h2>Сотрудникам</h2><p>Вход в кабинет для получения задач</p></a><a href="/apply" class="menu-panel animate-in delay-2"><h2>Соискателям</h2><p>Подать заявку в команду</p></a><a href="/check-status" class="menu-panel animate-in delay-3"><h2>Проверка статуса</h2><p>Узнать, рассмотрели ли вашу заявку</p></a></div></div></body></html>`); 
});

app.get('/apply', (req, res) => { 
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Подать заявку</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="text-align:center; margin-bottom:24px;">Заявка в команду</h2>${req.query.error ? '<div class="alert">Заполните все обязательные поля!</div>' : ''}<form action="/apply" method="POST">
    <input name="name" placeholder="Ваше имя" required>
    <input name="location" placeholder="Страна / Город" required>
    <input name="roblox" placeholder="Ник в Roblox" required>
    <input name="discord" placeholder="Ник в Discord" required>
    <input name="tiktok" placeholder="Ник в TikTok (необязательно)">
    <select name="role" required>
      <option value="" disabled selected hidden>Выберите роль...</option>
      <option>Скриптер</option>
      <option>3D-Модельер (делает модели в Blender)</option>
      <option>Билдер (строит в Roblox Studio)</option>
      <option>Тестер (тестирует в Roblox Studio)</option>
      <option>GUI-дизайнер</option>
      <option>Аниматор</option>
    </select>
    <input name="username" placeholder="Логин для входа" required>
    <input name="password" type="password" placeholder="Пароль для входа" required>
    <button type="submit">Отправить заявку</button>
  </form><div class="link"><a href="/">← На главную</a></div></div></div></body></html>`); 
});

app.post('/apply', async (req, res) => { 
  const { name, location, roblox, discord, tiktok, role, username, password } = req.body; 
  if (!name || !location || !roblox || !discord || !role || !username || !password) return res.redirect('/apply?error=1'); 
  try { 
    await pool.query(`INSERT INTO applications (name, location, roblox_nick, discord, telegram, role, username, password, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'На рассмотрении')`, [name, location, roblox, discord, tiktok || null, role, username.trim(), password.trim()]); 
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="color:var(--success); text-align:center;">Успешно!</h2><p style="color:var(--text-sec); text-align:center; margin-bottom:24px;">Заявка отправлена. Мы свяжемся с вами после рассмотрения.</p><div class="link"><a href="/">← На главную</a></div></div></div></body></html>`); 
  } catch (err) { 
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="color:var(--danger); text-align:center;">Ошибка</h2><div class="alert">Этот логин уже занят.</div><div class="link"><a href="/apply">← Назад</a></div></div></div></body></html>`); 
  } 
});

app.get('/check-status', (req, res) => { 
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Статус заявки</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="text-align:center; margin-bottom:24px;">Статус заявки</h2><form action="/check-status" method="POST"><input name="username" placeholder="Логин" required><input name="password" type="password" placeholder="Пароль" required><button type="submit">Проверить</button></form><div class="link"><a href="/">← На главную</a></div></div></div></body></html>`); 
});

app.post('/check-status', async (req, res) => { 
  const username = (req.body.username || '').trim(); 
  const password = (req.body.password || '').trim(); 
  try { 
    const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2 AND is_deleted = false', [username, password]); 
    if (rows.length === 0) { 
      return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="text-align:center;">Ошибка</h2><div class="alert">Неверный логин или пароль.</div><div class="link"><a href="/check-status">← Назад</a></div></div></div></body></html>`); 
    } 
    const data = rows[0]; 
    let statusText = 'На рассмотрении', cardClass = 'pending', extraText = ''; 
    if (data.status === 'Одобрено') { statusText = 'Одобрено. Добро пожаловать в команду.'; cardClass = 'approved'; } 
    if (data.status === 'Отклонено') { statusText = 'Отклонено.'; cardClass = 'rejected'; } 
    if (data.admin_comment) { extraText = `<div class="comments-box" style="color:var(--danger); margin-top:16px;"><b>Комментарий куратора:</b><br>${data.admin_comment}</div>`; } 
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="text-align:center;">Ваша заявка</h2><div class="card ${cardClass}" style="margin-top:24px;"><span class="badge ${cardClass}">${statusText}</span><p style="margin:12px 0 8px;"><b>Имя:</b> ${data.name}</p><p style="margin:0 0 16px;"><b>Роль:</b> ${data.role}</p>${extraText}</div><div class="link"><a href="/check-status">← Назад</a></div></div></div></body></html>`); 
  } catch (err) { 
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="text-align:center;">Ошибка</h2><div class="alert">${err.message}</div><div class="link"><a href="/check-status">← Назад</a></div></div></div></body></html>`); 
  } 
});

app.get('/login', (req, res) => { 
  if (req.session.user) return res.redirect('/dashboard');
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Вход</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="text-align:center; margin-bottom:24px;">Вход для сотрудников</h2><form action="/login" method="POST"><input name="username" placeholder="Логин" required><input name="password" type="password" placeholder="Пароль" required><button type="submit">Войти в кабинет</button></form><div class="link"><a href="/">← На главную</a></div></div></div></body></html>`); 
});

app.post('/login', async (req, res) => { 
  const { username, password } = req.body; 
  try { 
    const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2 AND is_deleted = false', [username.trim(), password.trim()]); 
    if (rows.length === 0) return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="text-align:center;">Ошибка</h2><div class="alert">Неверный логин или пароль.</div><div class="link"><a href="/login">← Назад</a></div></div></div></body></html>`); 
    const user = rows[0]; 
    if (user.status !== 'Одобрено') return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="text-align:center;">Доступ закрыт</h2><div class="alert">Ваша заявка еще не одобрена.</div><div class="link"><a href="/">← На главную</a></div></div></div></body></html>`); 
    
    req.session.user = user;
    res.redirect('/dashboard');
  } catch (err) { res.status(500).send('Ошибка сервера'); } 
});

app.get('/dashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const { rows } = await pool.query('SELECT * FROM applications WHERE id = $1', [req.session.user.id]);
    if (rows.length === 0) { req.session.destroy(); return res.redirect('/login'); }
    req.session.user = rows[0];
    await renderDashboard(req.session.user, res);
  } catch (err) { res.status(500).send('Ошибка сервера'); }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => { res.redirect('/'); });
});

app.post('/change-password', async (req, res) => { 
  if (!req.session.user) return res.redirect('/login');
  const { old_password, new_password } = req.body; 
  if (req.session.user.password !== old_password) {
    return res.send('<script>alert("Старый пароль неверный"); history.back();</script>');
  }
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
  let chunks = []; 
  req.on('data', chunk => chunks.push(chunk)); 
  req.on('end', async () => { 
    const buffer = Buffer.concat(chunks); 
    const boundary = req.headers['content-type'].split('boundary=')[1]; 
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
    } else { 
      res.redirect('/dashboard'); 
    } 
  }); 
});

// АДМИН-ПАНЕЛЬ
app.get('/admin', async (req, res) => { 
  const pass = req.query.pass; 
  const tab = req.query.tab || 'dash'; 
  if (pass !== ADMIN_PASSWORD) {
    return res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Вход в админку</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in" style="max-width:380px; margin-top:120px;"><h2 style="text-align:center;">Вход для админа</h2><form><input name="pass" type="password" placeholder="Пароль" required><button type="submit">Войти</button></form></div></div></body></html>`);
  }
  
  try { 
    const stats = await pool.query(`SELECT (SELECT COUNT(*) FROM applications WHERE status = 'Одобрено' AND is_deleted = false) as workers, (SELECT COUNT(*) FROM applications WHERE status = 'На рассмотрении' AND is_deleted = false) as new_apps, (SELECT COUNT(*) FROM tasks WHERE status = 'В работе') as in_work, (SELECT COUNT(*) FROM tasks WHERE status = 'Выполнено') as on_review`); 
    const s = stats.rows[0]; 
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Админ-панель</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container wide-container animate-in">
    <div class="dock">
      <a href="/admin?pass=${pass}&tab=dash" class="dock-btn ${tab === 'dash' ? 'active' : ''}">Обзор</a>
      <a href="/admin?pass=${pass}&tab=announcements" class="dock-btn ${tab === 'announcements' ? 'active' : ''}">Объявления</a>
      <a href="/admin?pass=${pass}&tab=tasks" class="dock-btn ${tab === 'tasks' ? 'active' : ''}">Задачи</a>
      <a href="/admin?pass=${pass}&tab=applications" class="dock-btn ${tab === 'applications' ? 'active' : ''}">Заявки</a>
      <a href="/admin?pass=${pass}&tab=workers" class="dock-btn ${tab === 'workers' ? 'active' : ''}">Сотрудники</a>
      <a href="/admin?pass=${pass}&tab=trash" class="dock-btn ${tab === 'trash' ? 'active' : ''}">Корзина</a>
    </div>
    <h2 style="text-align:center; margin-bottom:32px;">Админ-панель</h2>`;

    if (tab === 'dash') { 
      html += `<div class="stats-grid animate-in delay-1"><div class="stat-card"><div class="stat-val">${s.workers}</div><div class="stat-lbl">Сотрудников</div></div><div class="stat-card"><div class="stat-val">${s.new_apps}</div><div class="stat-lbl">Новых заявок</div></div><div class="stat-card"><div class="stat-val">${s.in_work}</div><div class="stat-lbl">В работе</div></div><div class="stat-card"><div class="stat-val">${s.on_review}</div><div class="stat-lbl">На проверке</div></div></div>`; 
      const totalTasks = parseInt(s.in_work) + parseInt(s.on_review); 
      const progress = totalTasks === 0 ? 0 : Math.round((s.on_review / totalTasks) * 100); 
      html += `<div class="card animate-in delay-2"><div style="display:flex; justify-content:space-between; align-items:center;"><h3 style="margin:0; font-size:16px;">Прогресс</h3><span style="font-size:14px; font-weight:600; color:var(--accent);">${progress}%</span></div><div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div></div>`; 
    }
    
    html += `</div></div></body></html>`;
    res.send(html);
  } catch (err) { 
    res.status(500).send('Ошибка сервера'); 
  }
});

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
