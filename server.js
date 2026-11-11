const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2024';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap');
  
  :root {
    --bg: #09090b; --text: #fafafa; --muted: #a1a1aa; --card: #18181b; --border: #27272a; --accent: #6c5ce7; --accent-hover: #5a4bd1;
    --success: #10b981; --danger: #ef4444; --warning: #f59e0b; --purple: #a29bfe;
  }
  [data-theme="light"] {
    --bg: #f4f4f5; --text: #09090b; --muted: #52525b; --card: #ffffff; --border: #e4e4e7; --accent: #6c5ce7; --accent-hover: #5a4bd1;
    --success: #059669; --danger: #dc2626; --warning: #d97706; --purple: #6c5ce7;
  }

  * { box-sizing: border-box; font-family: 'Inter', sans-serif; transition: background-color 0.3s, color 0.3s, border-color 0.3s; }
  body { margin: 0; background: var(--bg); color: var(--text); display: flex; justify-content: center; align-items: center; padding: 20px; min-height: 100vh; position: relative; overflow-x: hidden; }
  
  #bg-canvas { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; pointer-events: none; opacity: 0.6; }
  [data-theme="light"] #bg-canvas { opacity: 0.3; }

  .theme-toggle { position: fixed; top: 20px; right: 20px; background: var(--card); border: 1px solid var(--border); color: var(--text); width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 100; font-size: 20px; transition: all 0.2s; }
  .theme-toggle:hover { transform: scale(1.1); border-color: var(--accent); }

  .glass { background: var(--card); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
  .container { padding: 40px; width: 100%; max-width: 500px; margin: 40px auto; position: relative; z-index: 1; }
  .wide-container { max-width: 1200px; width: 100%; }
  h1, h2, h3 { text-align: center; color: var(--text); margin-bottom: 25px; font-weight: 600; letter-spacing: -0.5px; }
  
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .animate-in { animation: slideUp 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards; opacity: 0; }
  .delay-1 { animation-delay: 0.1s; } .delay-2 { animation-delay: 0.2s; } .delay-3 { animation-delay: 0.3s; }

  input, select, textarea { width: 100%; padding: 14px 16px; margin-bottom: 16px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; font-size: 14px; color: var(--text); outline: none; }
  input:focus, select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(108,92,231,0.15); }
  
  button { width: 100%; padding: 14px; background: var(--text); color: var(--bg); border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
  button:hover { opacity: 0.9; transform: translateY(-2px); }
  
  .link { text-align: center; margin-top: 24px; font-size: 13px; }
  .link a { color: var(--muted); text-decoration: none; transition: color 0.2s; }
  .link a:hover { color: var(--text); }
  .alert { padding: 14px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-size: 13px; background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); }
  
  .card { padding: 24px; border-radius: 12px; margin-bottom: 16px; background: var(--card); border: 1px solid var(--border); transition: all 0.3s; position: relative; }
  .card:hover { transform: translateY(-4px); border-color: var(--accent); box-shadow: 0 12px 30px rgba(0,0,0,0.1); }
  
  .card::before { content: ''; position: absolute; left: 0; top: 20px; bottom: 20px; width: 3px; border-radius: 0 4px 4px 0; background: var(--border); }
  .card.approved::before { background: var(--success); } .card.rejected::before { background: var(--danger); }
  .card.pending::before { background: var(--warning); } .card.taken::before { background: var(--accent); }
  
  .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; }
  .badge.pending { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
  .badge.approved { background: rgba(16, 185, 129, 0.1); color: var(--success); }
  .badge.rejected { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
  .badge.taken { background: rgba(108, 92, 231, 0.1); color: var(--purple); }
  
  .btn-ok { background: var(--success); color: #fff; width: auto; padding: 8px 16px; font-size: 12px; margin-right: 8px; border-radius: 6px; }
  .btn-bad { background: var(--danger); color: #fff; width: auto; padding: 8px 16px; font-size: 12px; border-radius: 6px; }
  .btn-purple { background: var(--accent); color: #fff; width: auto; padding: 10px 20px; font-size: 13px; border-radius: 6px; }
  .btn-del { background: transparent; color: var(--muted); border: 1px solid var(--border); width: auto; padding: 6px 10px; font-size: 12px; border-radius: 6px; cursor: pointer; }
  .btn-del:hover { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
  
  .tabs { display: flex; justify-content: center; gap: 4px; margin-bottom: 30px; background: var(--bg); padding: 4px; border-radius: 8px; border: 1px solid var(--border); width: fit-content; margin-left: auto; margin-right: auto; overflow-x: auto; max-width: 100%; }
  .tab-btn { background: transparent; color: var(--muted); width: auto; padding: 8px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 13px; white-space: nowrap; }
  .tab-btn.active { background: var(--border); color: var(--text); }

  .main-menu { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; max-width: 800px; }
  @media (max-width: 768px) { .main-menu { grid-template-columns: 1fr; } }
  .menu-panel { padding: 60px 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; text-decoration: none; color: var(--text); transition: all 0.3s; cursor: pointer; border-radius: 12px; background: var(--card); border: 1px solid var(--border); }
  .menu-panel:hover { transform: translateY(-5px); border-color: var(--accent); box-shadow: 0 15px 40px rgba(0,0,0,0.1); }
  .menu-panel h2 { font-size: 24px; margin-bottom: 8px; }
  .menu-panel p { color: var(--muted); font-size: 14px; margin-bottom: 30px; }
  .menu-btn-style { padding: 10px 24px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); font-size: 14px; font-weight: 500; }
  .menu-panel:hover .menu-btn-style { background: var(--text); color: var(--bg); }

  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; } 
  @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  .admin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
  @media (max-width: 900px) { .admin-grid { grid-template-columns: 1fr; } }
  .admin-col { background: var(--bg); padding: 24px; border-radius: 12px; border: 1px solid var(--border); }
  
  .proof-img { max-width: 100%; border-radius: 8px; margin-top: 10px; border: 1px solid var(--border); }
  .worker-row { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--card); border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--border); }
  
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
  @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
  .stat-card { background: var(--bg); border: 1px solid var(--border); padding: 20px; border-radius: 12px; text-align: center; }
  .stat-val { font-size: 32px; font-weight: 800; color: var(--accent); line-height: 1; margin-bottom: 5px; }
  .stat-lbl { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }

  .toast { position: fixed; bottom: 20px; right: 20px; background: var(--card); border: 1px solid var(--accent); color: var(--text); padding: 16px 24px; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); z-index: 9999; transform: translateY(100px); opacity: 0; transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1); display: flex; align-items: center; gap: 10px; }
  .toast.show { transform: translateY(0); opacity: 1; }

  .comments-box { margin-top: 15px; padding: 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; font-size: 13px; }
  .announcement { background: rgba(108,92,231,0.1); border: 1px solid var(--accent); padding: 20px; border-radius: 12px; margin-bottom: 24px; }
  .announcement h3 { margin: 0 0 8px 0; text-align: left; font-size: 16px; color: var(--accent); }
  .announcement p { margin: 0; color: var(--text); font-size: 14px; line-height: 1.5; }
  
  .progress-bar { width: 100%; height: 8px; background: var(--border); border-radius: 4px; margin-top: 10px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--success); border-radius: 4px; transition: width 0.5s; }
`;

const scripts = `
  <div id="preloader" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:#09090b;z-index:9999;display:flex;flex-direction:column;justify-content:center;align-items:center;"><div class="title-container" id="title-container" style="display:flex;gap:2px;"></div></div>
  <canvas id="bg-canvas"></canvas>
  <button class="theme-toggle" onclick="toggleTheme()" id="theme-btn">🌙</button>
  <div id="toast" class="toast">🔔 <span id="toast-text"></span></div>

  <script>
    function toggleTheme() {
      const body = document.body;
      const isLight = body.getAttribute('data-theme') === 'light';
      body.setAttribute('data-theme', isLight ? 'dark' : 'light');
      localStorage.setItem('theme', isLight ? 'dark' : 'light');
      document.getElementById('theme-btn').textContent = isLight ? '🌙' : '☀️';
    }
    if (localStorage.getItem('theme') === 'light') {
      document.body.setAttribute('data-theme', 'light');
      document.getElementById('theme-btn').textContent = '☀️';
    }

    if (!sessionStorage.getItem('preloaderShown')) {
      const titleText = "SURVIVAL IN ANTARCTICA";
      const container = document.getElementById('title-container');
      titleText.split('').forEach((char, index) => {
        if (char === ' ') { const space = document.createElement('span'); space.innerHTML = '&nbsp;'; container.appendChild(space); } 
        else {
          const span = document.createElement('span'); span.textContent = char; 
          span.style.cssText = "color:#fff;font-size:clamp(24px,4vw,48px);font-weight:800;display:inline-block;opacity:0;transform:translate(" + (Math.random()-0.5)*1000 + "px," + (Math.random()-0.5)*1000 + "px) scale(0.5);transition:all 1s cubic-bezier(0.19,1,0.22,1);";
          container.appendChild(span);
          setTimeout(() => span.style.cssText += "opacity:1;transform:translate(0,0) scale(1);", 100 + index * 30);
        }
      });
      setTimeout(() => { document.getElementById('preloader').style.opacity = '0'; setTimeout(() => document.getElementById('preloader').remove(), 800); sessionStorage.setItem('preloaderShown', 'true'); }, 3000);
    } else { document.getElementById('preloader').remove(); }

    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let width, height, mouse = { x: -1000, y: -1000 }, cubes = [];
    const spacing = 70, cubeSize = 18;
    function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; initCubes(); }
    function initCubes() { cubes = []; for (let x = spacing/2; x < width; x += spacing) { for (let y = spacing/2; y < height; y += spacing) { cubes.push({ x, y, baseX: x, baseY: y, vx: 0, vy: 0, phase: Math.random() * Math.PI * 2, speed: 0.001 + Math.random() * 0.002 }); } } }
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('touchmove', (e) => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; });
    function animate(time) {
      ctx.clearRect(0, 0, width, height);
      cubes.forEach(cube => {
        let targetX = cube.baseX + Math.sin(time * cube.speed + cube.phase) * 6;
        let targetY = cube.baseY + Math.cos(time * cube.speed + cube.phase) * 6;
        let dx = mouse.x - cube.x, dy = mouse.y - cube.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) { let force = (150 - dist) / 150; targetX -= (dx / dist) * force * 30; targetY -= (dy / dist) * force * 30; }
        cube.vx += (targetX - cube.x) * 0.05; cube.vy += (targetY - cube.y) * 0.05; cube.vx *= 0.8; cube.vy *= 0.8; cube.x += cube.vx; cube.y += cube.vy;
        ctx.fillStyle = document.body.getAttribute('data-theme') === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)'; 
        ctx.strokeStyle = document.body.getAttribute('data-theme') === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'; 
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
  const { rows: tasks } = await pool.query(`
    SELECT * FROM tasks 
    WHERE role = $1 AND status != 'Удалено' AND (completed_at IS NULL OR completed_at > NOW() - INTERVAL '24 hours')
    ORDER BY created_at DESC
  `, [user.role]);
  
  const { rows: ann } = await pool.query(`SELECT * FROM announcements ORDER BY created_at DESC LIMIT 1`);
  const announcement = ann.length > 0 ? `<div class="announcement animate-in"><h3>📢 ${ann[0].title}</h3><p>${ann[0].content}</p></div>` : '';

  let html = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container wide-container glass animate-in">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
      <h2 style="margin:0;">Кабинет: ${user.name}</h2>
      <div style="display:flex; gap:10px; align-items:center;">
        <div style="background:var(--warning); color:#000; padding:5px 15px; border-radius:20px; font-weight:800;">🏆 ${user.points} Очков</div>
        <button onclick="document.getElementById('settings-modal').style.display='flex'" style="width:auto; padding:8px 15px; background:var(--card); border:1px solid var(--border); color:var(--text); border-radius:8px; font-size:14px;">⚙️</button>
      </div>
    </div>
    
    ${message ? `<div class="alert" style="background:rgba(16,185,129,0.1); color:var(--success); border-color:rgba(16,185,129,0.2);">${message}</div>` : ''}
    ${announcement}

    <div class="link" style="text-align:right; margin-bottom:20px;"><a href="/">Выйти</a></div><div class="grid">`;
  
  if (tasks.length === 0) html += `<p style="text-align:center; color:var(--muted); grid-column: 1/-1;">Для вашего отдела пока нет активных задач.</p>`;
  else {
    tasks.forEach((task, i) => {
      let badgeClass = 'pending', badgeText = 'Свободна';
      let actionHtml = '';
      let deadlineHtml = '';
      
      if (task.deadline) {
        const d = new Date(task.deadline).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        deadlineHtml = `<p style="font-size:12px; color:var(--danger); margin-bottom:10px;"><b>⏰ Дедлайн:</b> ${d}</p>`;
      }

      if (task.status === 'Свободна') {
        actionHtml = `<form action="/task/take" method="POST"><input type="hidden" name="task_id" value="${task.id}"><input type="hidden" name="username" value="${user.username}"><input type="hidden" name="password" value="${user.password}"><button type="submit" class="btn-purple" style="width:100%;">Взять задачу</button></form>`;
      } else if (task.status === 'В работе') {
        if (task.taken_by === user.username) {
          badgeClass = 'taken'; badgeText = 'В работе (у вас)';
          actionHtml = `<form action="/task/done" method="POST" enctype="multipart/form-data" style="margin-top:15px;"><input type="hidden" name="task_id" value="${task.id}"><input type="hidden" name="username" value="${user.username}"><input type="hidden" name="password" value="${user.password}"><p style="font-size:13px; color:var(--muted); margin-bottom:10px;">Прикрепите файл или скриншот:</p><input type="file" name="proof" required style="padding:10px; font-size:13px; margin-bottom:10px; background:var(--bg); border:1px dashed var(--border); color:var(--text);"><button type="submit" class="btn-ok" style="width:100%;">Я выполнил задачу</button></form>`;
        } else {
          badgeClass = 'taken'; badgeText = 'В работе';
          actionHtml = `<p style="color:var(--purple); font-size:13px; font-weight:500; text-align:center; padding:12px; background:rgba(108,92,231,0.1); border-radius:8px;">Взял(а): ${task.taken_by}</p>`;
        }
      } else if (task.status === 'Выполнено') {
        badgeClass = 'approved'; badgeText = 'Выполнено (На проверке)';
        actionHtml = `<p style="color:var(--success); font-size:13px; font-weight:500; text-align:center; padding:12px; background:rgba(16,185,129,0.1); border-radius:8px;">Сдал(а): ${task.taken_by}</p>`;
      }

      html += `<div class="card ${badgeClass} animate-in delay-${Math.min(i+1, 3)}"><span class="badge ${badgeClass}">${badgeText}</span><h3 style="margin-top:0; text-align:left; font-size:18px;">${task.title}</h3>${deadlineHtml}<p style="color:var(--muted); font-size:14px; margin-bottom:15px;">${task.description}</p>${actionHtml}`;
      
      if (task.comments) {
        html += `<div class="comments-box"><b>Обсуждение:</b><br>${task.comments.replace(/\n/g, '<br>')}</div>`;
      }
      html += `</div>`;
    });
  }
  
  // Модальное окно настроек (Смена пароля)
  html += `</div>
  <div id="settings-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:10000; justify-content:center; align-items:center;">
    <div class="glass" style="padding:40px; width:100%; max-width:400px; position:relative;">
      <h3>Настройки профиля</h3>
      <form action="/change-password" method="POST">
        <input type="hidden" name="username" value="${user.username}">
        <input type="password" name="old_password" placeholder="Старый пароль" required>
        <input type="password" name="new_password" placeholder="Новый пароль" required>
        <button type="submit" class="btn-purple" style="width:100%;">Сменить пароль</button>
      </form>
      <button onclick="document.getElementById('settings-modal').style.display='none'" style="margin-top:15px; background:transparent; border:1px solid var(--border); color:var(--text);">Закрыть</button>
    </div>
  </div>
  </div></body></html>`;
  res.send(html);
};

// --- РОУТЫ ---

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Survival in Antarctica</title><style>${css}</style></head><body>${scripts}<div class="main-menu"><a href="/login" class="menu-panel animate-in delay-1"><h2>Сотрудникам</h2><p>Вход в личный кабинет<br>для получения и сдачи задач</p><div class="menu-btn-style">Войти</div></a><a href="/apply" class="menu-panel animate-in delay-2"><h2>Соискателям</h2><p>Подать заявку в команду<br>на одну из должностей</p><div class="menu-btn-style">Подать заявку</div></a></div></body></html>`);
});

app.get('/apply', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Подать заявку</title><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2>Заявка в команду</h2>${req.query.error ? '<div class="alert">Заполните все обязательные поля!</div>' : ''}<form action="/apply" method="POST"><input name="name" placeholder="1. Ваше имя" required><input name="location" placeholder="2. Страна / Город" required><input name="roblox" placeholder="3. Ник в Roblox" required><input name="discord" placeholder="4. Discord (обязательно)" required><input name="telegram" placeholder="Telegram (необязательно)"><select name="role" required><option value="" disabled selected hidden>Кем вы хотите быть?</option><option>Билдер</option><option>Скриптер</option><option>GUI-дизайнер</option><option>Аниматор</option><option>Тестер</option></select><input name="username" placeholder="Придумайте Логин" required><input name="password" type="password" placeholder="Придумайте Пароль" required><button type="submit">Отправить заявку</button></form><div class="link"><a href="/">← На главную</a></div></div></body></html>`);
});

app.post('/apply', async (req, res) => {
  const { name, location, roblox, discord, telegram, role, username, password } = req.body;
  if (!name || !location || !roblox || !discord || !role || !username || !password) return res.redirect('/apply?error=1');
  try {
    await pool.query(`INSERT INTO applications (name, location, roblox_nick, discord, telegram, role, username, password, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'На рассмотрении')`, [name, location, roblox, discord, telegram || null, role, username.trim(), password.trim()]);
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2 style="color:var(--success)">✅ Успешно!</h2><p style="text-align:center; color:var(--muted);">Заявка отправлена. Ожидайте ответа.</p><div class="link"><a href="/">← На главную</a></div></div></body></html>`);
  } catch (err) { res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2 style="color:var(--danger)">Ошибка</h2><div class="alert">Логин уже занят.</div><div class="link"><a href="/apply">← Назад</a></div></div></body></html>`); }
});

app.get('/login', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Вход</title><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2>Вход для сотрудников</h2><form action="/dashboard" method="POST"><input name="username" placeholder="Ваш логин" required><input name="password" type="password" placeholder="Ваш пароль" required><button type="submit">Войти в кабинет</button></form><div class="link"><a href="/">← На главную</a></div></div></body></html>`);
});

app.post('/dashboard', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2 AND is_deleted = false', [username, password]);
    if (rows.length === 0) return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2>Ошибка</h2><div class="alert">Неверный логин или пароль.</div><div class="link"><a href="/login">Назад</a></div></div></body></html>`);
    const user = rows[0];
    if (user.status !== 'Одобрено') return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2>Доступ закрыт</h2><div class="alert">Ваша заявка еще не одобрена или была отклонена.</div><div class="link"><a href="/">На главную</a></div></div></body></html>`);
    await renderDashboard(user, res);
  } catch (err) { res.status(500).send('Ошибка сервера'); }
});

// Смена пароля
app.post('/change-password', async (req, res) => {
  const { username, old_password, new_password } = req.body;
  const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2', [username, old_password]);
  if (rows.length === 0) return res.send('<script>alert("Старый пароль неверный"); history.back();</script>');
  await pool.query('UPDATE applications SET password = $1 WHERE username = $2', [new_password.trim(), username]);
  const { rows: updated } = await pool.query('SELECT * FROM applications WHERE username = $1', [username]);
  await renderDashboard(updated[0], res, '✅ Пароль успешно изменен!');
});

app.post('/task/take', async (req, res) => {
  const { task_id, username, password } = req.body;
  await pool.query("UPDATE tasks SET status = 'В работе', taken_by = $1 WHERE id = $2", [username, task_id]);
  const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2', [username, password]);
  await renderDashboard(rows[0], res);
});

// Универсальная загрузка файлов
app.post('/task/done', (req, res) => {
  let chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    const buffer = Buffer.concat(chunks);
    const boundary = req.headers['content-type'].split('boundary=')[1];
    const parts = buffer.toString('binary').split('--' + boundary);
    
    let task_id, username, password, proofBase64 = '', filename = 'file';
    for (let part of parts) {
      if (part.includes('name="task_id"')) task_id = part.split('\r\n\r\n')[1].split('\r\n')[0];
      if (part.includes('name="username"')) username = part.split('\r\n\r\n')[1].split('\r\n')[0];
      if (part.includes('name="password"')) password = part.split('\r\n\r\n')[1].split('\r\n')[0];
      if (part.includes('name="proof"')) {
        const nameMatch = part.match(/filename="(.*)"/);
        if (nameMatch) filename = nameMatch[1];
        const matches = part.match(/Content-Type: (.*)\r\n\r\n([\s\S]*)\r\n$/);
        if (matches) {
          const base64 = Buffer.from(matches[2], 'binary').toString('base64');
          proofBase64 = `data:${matches[1]};base64,${base64}`;
        }
      }
    }
    if (task_id && username) {
      await pool.query("UPDATE tasks SET status = 'Выполнено', completed_at = NOW(), proof_file = $1, proof_filename = $2 WHERE id = $3 AND taken_by = $4", [proofBase64, filename, task_id, username]);
      const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2', [username, password]);
      await renderDashboard(rows[0], res);
    } else { res.redirect('/login'); }
  });
});

// --- АДМИНКА ---
app.get('/admin', async (req, res) => {
  const pass = req.query.pass;
  const tab = req.query.tab || 'dash';
  const search = req.query.search || '';

  if (pass !== ADMIN_PASSWORD) return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in" style="max-width:380px; margin-top:120px;"><h2>Вход для админа</h2><form><input name="pass" type="password" placeholder="Пароль" required><button type="submit">Войти</button></form></div></body></html>`);
  
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM applications WHERE status = 'Одобрено' AND is_deleted = false) as workers,
        (SELECT COUNT(*) FROM applications WHERE status = 'На рассмотрении' AND is_deleted = false) as new_apps,
        (SELECT COUNT(*) FROM tasks WHERE status = 'В работе') as in_work,
        (SELECT COUNT(*) FROM tasks WHERE status = 'Выполнено') as on_review
    `);
    const s = stats.rows[0];

    let html = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container wide-container glass animate-in"><h2>Админ-панель</h2>
    <div class="tabs">
      <a href="/admin?pass=${pass}&tab=dash" class="tab-btn ${tab === 'dash' ? 'active' : ''}">📊 Дашборд</a>
      <a href="/admin?pass=${pass}&tab=announcements" class="tab-btn ${tab === 'announcements' ? 'active' : ''}">📢 Объявления</a>
      <a href="/admin?pass=${pass}&tab=tasks" class="tab-btn ${tab === 'tasks' ? 'active' : ''}">Задачи</a>
      <a href="/admin?pass=${pass}&tab=applications" class="tab-btn ${tab === 'applications' ? 'active' : ''}">Заявки</a>
      <a href="/admin?pass=${pass}&tab=workers" class="tab-btn ${tab === 'workers' ? 'active' : ''}">Сотрудники</a>
      <a href="/admin?pass=${pass}&tab=trash" class="tab-btn ${tab === 'trash' ? 'active' : ''}">🗑️ Корзина</a>
    </div>`;

    // ДАШБОРД
    if (tab === 'dash') {
      html += `<div class="stats-grid animate-in delay-1">
        <div class="stat-card"><div class="stat-val">${s.workers}</div><div class="stat-lbl">Сотрудников</div></div>
        <div class="stat-card"><div class="stat-val" style="color:var(--warning)">${s.new_apps}</div><div class="stat-lbl">Новых заявок</div></div>
        <div class="stat-card"><div class="stat-val" style="color:var(--accent)">${s.in_work}</div><div class="stat-lbl">Задач в работе</div></div>
        <div class="stat-card"><div class="stat-val" style="color:var(--success)">${s.on_review}</div><div class="stat-lbl">На проверке</div></div>
      </div>`;
      
      // Полоса прогресса по задачам
      const totalTasks = parseInt(s.in_work) + parseInt(s.on_review);
      const progress = totalTasks === 0 ? 0 : Math.round((s.on_review / totalTasks) * 100);
      html += `<div class="card animate-in delay-2" style="padding:20px;"><h3 style="text-align:left; margin-bottom:10px; font-size:16px;">Прогресс выполнения задач</h3><div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div><p style="text-align:right; font-size:12px; color:var(--muted); margin-top:5px;">${progress}% задач сдано на проверку</p></div>`;
      
      const { rows: topWorkers } = await pool.query("SELECT * FROM applications WHERE status = 'Одобрено' AND is_deleted = false ORDER BY points DESC LIMIT 5");
      html += `<div class="admin-col animate-in delay-3" style="margin-top:20px;"><h3>🏆 Топ сотрудников</h3>`;
      topWorkers.forEach((w, i) => {
        html += `<div class="worker-row" style="border-left: 3px solid ${i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : 'transparent'};"><div style="display:flex; align-items:center; gap:15px;"><span style="font-size:20px; font-weight:800; color:var(--muted);">#${i+1}</span><div><p style="margin:0; font-size:15px;"><b>${w.name}</b> <span style="color:var(--accent); font-size:13px;">(${w.role})</span></p></div></div><div style="font-size:18px; font-weight:800; color:var(--warning);">${w.points} 🏅</div></div>`;
      });
      html += `</div>`;
    }

    // ОБЪЯВЛЕНИЯ
    if (tab === 'announcements') {
      html += `<div class="card animate-in"><h3 style="text-align:left;">➕ Новое объявление</h3><form action="/admin/announcement" method="POST" style="margin-top:15px;"><input type="hidden" name="pass" value="${pass}"><input name="title" placeholder="Заголовок (напр. Важные новости)" required><textarea name="content" placeholder="Текст объявления..." rows="3" required></textarea><button type="submit" class="btn-purple" style="width:100%;">Опубликовать</button></form></div>`;
      
      const { rows: anns } = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
      html += `<div class="grid">`;
      anns.forEach(ann => {
        html += `<div class="card"><div style="display:flex; justify-content:space-between;"><p style="font-size:12px; color:var(--muted);">${new Date(ann.created_at).toLocaleString('ru-RU')}</p><form action="/admin/delete-announcement" method="POST" onsubmit="return confirm('Удалить объявление?');"><input type="hidden" name="id" value="${ann.id}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-del">🗑️</button></form></div><h3 style="text-align:left; font-size:16px;">${ann.title}</h3><p style="font-size:14px; color:var(--muted);">${ann.content}</p></div>`;
      });
      html += `</div>`;
    }

    // ЗАЯВКИ
    if (tab === 'applications') {
      const { rows: apps } = await pool.query('SELECT * FROM applications WHERE is_deleted = false ORDER BY created_at DESC');
      const current = apps.filter(a => a.status === 'На рассмотрении');
      const archive = apps.filter(a => a.status !== 'На рассмотрении');

      const renderApp = (app, isArchive) => {
        let badge = 'pending', text = 'На рассмотрении';
        if (app.status === 'Одобрено') { badge = 'approved'; text = 'Одобрено'; }
        if (app.status === 'Отклонено') { badge = 'rejected'; text = 'Отклонено'; }
        let h = `<div class="card ${badge} animate-in"><div style="display:flex; justify-content:space-between; align-items:start;"><div><span class="badge ${badge}">${text}</span><p style="font-size:15px; margin:5px 0;"><b>${app.name}</b> (${app.role})</p><p style="font-size:12px; color:var(--muted);">Логин: ${app.username}<br>Discord: ${app.discord}</p></div>`;
        if (isArchive) h += `<form action="/admin/delete-app" method="POST" onsubmit="return confirm('Отправить эту заявку в корзину?');"><input type="hidden" name="id" value="${app.id}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-del">🗑️</button></form>`;
        h += `</div>`;
        if (!isArchive) {
          h += `<form action="/admin/status" method="POST" style="display:flex; gap:8px; margin-top:15px;" onsubmit="const msg = prompt('Комментарий:'); if (msg !== null) { this.comment.value = msg; } else { event.preventDefault(); }"><input type="hidden" name="id" value="${app.id}"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="comment" value=""><button name="status" value="Одобрено" class="btn-ok">Одобрить</button><button name="status" value="Отклонено" class="btn-bad">Отклонить</button></form>`;
        }
        return h + `</div>`;
      };

      html += `<div class="admin-grid animate-in delay-1"><div class="admin-col"><h3>⏳ Текущие заявки</h3>`;
      if (current.length === 0) html += `<p style="text-align:center; color:var(--muted);">Пусто</p>`;
      current.forEach(a => html += renderApp(a, false));
      
      html += `</div><div class="admin-col"><h3>📁 Архив</h3>`;
      if (archive.length === 0) html += `<p style="text-align:center; color:var(--muted);">Пусто</p>`;
      archive.forEach(a => html += renderApp(a, true));
      html += `</div></div>`;
    }

    // ЗАДАЧИ (С ПОИСКОМ И ФАЙЛАМИ)
    if (tab === 'tasks') {
      const { rows: tasks } = await pool.query('SELECT * FROM tasks WHERE title ILIKE $1 AND status != \'Удалено\' ORDER BY created_at DESC', [`%${search}%`]);
      html += `<div class="card animate-in" style="margin-bottom:30px;"><h3 style="text-align:left;">➕ Выдать новую задачу</h3><form action="/admin/task" method="POST" style="margin-top:15px;"><input type="hidden" name="pass" value="${pass}"><select name="role" required><option value="" disabled selected hidden>Выберите отдел</option><option>Билдер</option><option>Скриптер</option><option>GUI-дизайнер</option><option>Аниматор</option><option>Тестер</option></select><input name="title" placeholder="Название задачи" required><textarea name="description" placeholder="Описание задачи" rows="2" required></textarea><input type="datetime-local" name="deadline" title="Дедлайн (необязательно)"><button type="submit" class="btn-purple" style="width:100%;">Создать задачу</button></form></div>`;
      
      html += `<form action="/admin" method="GET" style="margin-bottom:20px; display:flex; gap:10px;"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="tab" value="tasks"><input name="search" placeholder="Поиск по задачам..." value="${search}" style="margin-bottom:0;"><button type="submit" class="btn-purple" style="width:auto; padding:0 20px;">Найти</button></form>`;
      
      html += `<div class="grid">`;
      tasks.forEach((task, i) => {
        let badge = 'pending', text = 'Свободна';
        let extra = '';
        let deadlineStr = '';
        if (task.deadline) deadlineStr = `<p style="font-size:12px; color:var(--danger); margin-top:5px;">⏰ Дедлайн: ${new Date(task.deadline).toLocaleString('ru-RU')}</p>`;
        if (task.status === 'В работе') { badge = 'taken'; text = 'В работе'; extra = `<p style="font-size:12px; color:var(--purple); margin-top:5px;">Взял: ${task.taken_by}</p>`; }
        if (task.status === 'Выполнено') { badge = 'approved'; text = 'Выполнено'; extra = `<p style="font-size:12px; color:var(--success); margin-top:5px;">Сдал: ${task.taken_by}</p>`; }

        html += `<div class="card ${badge} animate-in delay-${Math.min(i+1, 3)}"><div style="display:flex; justify-content:space-between; align-items:start;"><div style="display:flex; gap:8px;"><span class="badge ${badge}">${task.role}</span><span class="badge ${badge}">${text}</span></div><div style="display:flex; gap:5px;"><form action="/admin/delete-task" method="POST" onsubmit="return confirm('Отправить задачу в корзину?');"><input type="hidden" name="id" value="${task.id}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-del">🗑️</button></form></div></div><h3 style="margin-top:10px; text-align:left; font-size:18px;">${task.title}</h3><p style="color:var(--muted); font-size:14px;">${task.description}</p>${deadlineStr}${extra}`;
        
        if (task.proof_file) {
          html += `<p style="font-size:12px; color:var(--muted); margin-top:10px;">Доказательство (${task.proof_filename}):</p>`;
          if (task.proof_file.startsWith('data:image')) html += `<img src="${task.proof_file}" class="proof-img">`;
          else html += `<a href="${task.proof_file}" download="${task.proof_filename}" style="display:inline-block; margin-top:5px; color:var(--accent); font-size:14px;">📥 Скачать файл</a>`;
        }
        
        html += `<div class="comments-box" style="margin-top:15px;"><b>Обсуждение:</b><br>${(task.comments || 'Пока нет сообщений').replace(/\n/g, '<br>')}<form action="/admin/comment" method="POST" style="margin-top:10px; display:flex; gap:5px;"><input type="hidden" name="id" value="${task.id}"><input type="hidden" name="pass" value="${pass}"><input name="text" placeholder="Написать..." style="margin-bottom:0; padding:8px;"><button type="submit" class="btn-purple" style="padding:8px 15px;">→</button></form></div>`;
        
        if (task.status === 'Выполнено') {
          html += `<form action="/admin/approve-task" method="POST" style="margin-top:10px;"><input type="hidden" name="id" value="${task.id}"><input type="hidden" name="username" value="${task.taken_by}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-ok" style="width:100%;">✅ Одобрить и начислить 10 очков</button></form>`;
        }
        html += `</div>`;
      });
      html += `</div>`;
    }

    // СОТРУДНИКИ (С ПОИСКОМ)
    if (tab === 'workers') {
      const { rows: workers } = await pool.query("SELECT * FROM applications WHERE status = 'Одобрено' AND is_deleted = false AND name ILIKE $1 ORDER BY role ASC", [`%${search}%`]);
      html += `<div class="admin-col animate-in" style="max-width:800px; margin:0 auto;"><h3>👥 Список сотрудников</h3><p style="text-align:center; color:var(--muted); margin-bottom:20px;">Найдено: ${workers.length}</p>`;
      
      html += `<form action="/admin" method="GET" style="margin-bottom:20px; display:flex; gap:10px;"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="tab" value="workers"><input name="search" placeholder="Поиск по имени..." value="${search}" style="margin-bottom:0;"><button type="submit" class="btn-purple" style="width:auto; padding:0 20px;">Найти</button></form>`;
      
      if (workers.length === 0) html += `<p style="text-align:center; color:var(--muted);">Пока никого нет</p>`;
      else {
        workers.forEach((w, i) => {
          html += `<div class="worker-row animate-in delay-${Math.min(i+1, 3)}"><div><p style="margin:0; font-size:15px;"><b>${w.name}</b> <span style="color:var(--accent); font-size:13px;">(${w.role})</span> — 🏆 ${w.points} очков</p><p style="margin:5px 0 0 0; font-size:12px; color:var(--muted);">Логин: ${w.username} | Discord: ${w.discord}</p><p style="margin:2px 0 0 0; font-size:12px; color:var(--muted);">Roblox: ${w.roblox_nick} | TG: ${w.telegram || '-'}</p></div><form action="/admin/kick-worker" method="POST" onsubmit="return confirm('Отправить сотрудника ${w.name} в корзину?');"><input type="hidden" name="id" value="${w.id}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-del">🗑️ В корзину</button></form></div>`;
        });
      }
      html += `</div>`;
    }

    // КОРЗИНА
    if (tab === 'trash') {
      const { rows: delApps } = await pool.query('SELECT * FROM applications WHERE is_deleted = true ORDER BY created_at DESC');
      const { rows: delTasks } = await pool.query('SELECT * FROM tasks WHERE status = \'Удалено\' ORDER BY created_at DESC');
      
      html += `<div class="admin-grid animate-in"><div class="admin-col"><h3>🗑️ Удаленные заявки</h3>`;
      if (delApps.length === 0) html += `<p style="text-align:center; color:var(--muted);">Пусто</p>`;
      delApps.forEach(app => {
        html += `<div class="card" style="opacity:0.6;"><p style="font-size:15px; margin:5px 0;"><b>${app.name}</b> (${app.role})</p><p style="font-size:12px; color:var(--muted);">Логин: ${app.username}</p><form action="/admin/restore-app" method="POST" style="margin-top:10px;"><input type="hidden" name="id" value="${app.id}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-purple" style="width:100%; padding:8px;">Восстановить</button></form></div>`;
      });
      html += `</div><div class="admin-col"><h3>🗑️ Удаленные задачи</h3>`;
      if (delTasks.length === 0) html += `<p style="text-align:center; color:var(--muted);">Пусто</p>`;
      delTasks.forEach(task => {
        html += `<div class="card" style="opacity:0.6;"><p style="font-size:15px; margin:5px 0;"><b>${task.title}</b> (${task.role})</p><p style="font-size:12px; color:var(--muted);">Статус: ${task.status}</p><form action="/admin/restore-task" method="POST" style="margin-top:10px;"><input type="hidden" name="id" value="${task.id}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-purple" style="width:100%; padding:8px;">Восстановить</button></form></div>`;
      });
      html += `</div></div>`;
    }

    html += `<div class="link" style="margin-top:30px;"><a href="/admin?pass=${pass}&tab=${tab}">🔄 Обновить</a></div></div></body></html>`;
    res.send(html);
  } catch (err) { res.send(`<h2 style="color:var(--danger);">Ошибка: ${err.message}</h2>`); }
});

app.post('/admin/status', async (req, res) => {
  const { id, status, pass, comment } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query('UPDATE applications SET status = $1, admin_comment = $2 WHERE id = $3', [status, comment || null, id]);
  res.redirect('/admin?pass=' + pass + '&tab=applications'); 
});

// Создание объявления
app.post('/admin/announcement', async (req, res) => {
  const { title, content, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query('INSERT INTO announcements (title, content) VALUES ($1, $2)', [title, content]);
  res.redirect('/admin?pass=' + pass + '&tab=announcements'); 
});

app.post('/admin/delete-announcement', async (req, res) => {
  const { id, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
  res.redirect('/admin?pass=' + pass + '&tab=announcements'); 
});

app.post('/admin/task', async (req, res) => {
  const { role, title, description, deadline, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query('INSERT INTO tasks (role, title, description, deadline) VALUES ($1, $2, $3, $4)', [role, title, description, deadline || null]);
  res.redirect('/admin?pass=' + pass + '&tab=tasks'); 
});

app.post('/admin/comment', async (req, res) => {
  const { id, text, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  const { rows } = await pool.query('SELECT comments FROM tasks WHERE id = $1', [id]);
  const newComment = (rows[0].comments || '') + `\nАдмин: ${text}`;
  await pool.query('UPDATE tasks SET comments = $1 WHERE id = $2', [newComment.trim(), id]);
  res.redirect('/admin?pass=' + pass + '&tab=tasks');
});

app.post('/admin/approve-task', async (req, res) => {
  const { id, username, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query('UPDATE tasks SET status = \'Одобрено\' WHERE id = $1', [id]);
  await pool.query('UPDATE applications SET points = points + 10 WHERE username = $1', [username]);
  res.redirect('/admin?pass=' + pass + '&tab=tasks');
});

app.post('/admin/delete-app', async (req, res) => {
  const { id, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query('UPDATE applications SET is_deleted = true WHERE id = $1', [id]);
  res.redirect('/admin?pass=' + pass + '&tab=applications');
});

app.post('/admin/delete-task', async (req, res) => {
  const { id, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query("UPDATE tasks SET status = 'Удалено' WHERE id = $1", [id]);
  res.redirect('/admin?pass=' + pass + '&tab=tasks');
});

app.post('/admin/kick-worker', async (req, res) => {
  const { id, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query('UPDATE applications SET is_deleted = true WHERE id = $1', [id]);
  res.redirect('/admin?pass=' + pass + '&tab=workers');
});

app.post('/admin/restore-app', async (req, res) => {
  const { id, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query('UPDATE applications SET is_deleted = false WHERE id = $1', [id]);
  res.redirect('/admin?pass=' + pass + '&tab=trash');
});

app.post('/admin/restore-task', async (req, res) => {
  const { id, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query("UPDATE tasks SET status = 'Свободна' WHERE id = $1", [id]);
  res.redirect('/admin?pass=' + pass + '&tab=trash');
});

app.listen(PORT, () => console.log('Сервер запущен на порту ' + PORT));
