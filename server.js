const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2024';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap');
  
  /* --- ПРЕЛОАДЕР --- */
  #preloader { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #09090b; z-index: 9999; display: flex; flex-direction: column; justify-content: center; align-items: center; transition: opacity 0.8s ease, visibility 0.8s ease; overflow: hidden; }
  #preloader.hidden { opacity: 0; visibility: hidden; }
  .title-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); transition: transform 1s cubic-bezier(0.19, 1, 0.22, 1); display: flex; gap: 2px; z-index: 2; }
  .title-container.move-up { transform: translate(-50%, -120%); }
  .letter { color: #fff; font-size: clamp(24px, 4vw, 48px); font-weight: 800; display: inline-block; opacity: 0; transform: translate(var(--startX), var(--startY)) scale(0.5); transition: transform 1s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.8s ease; }
  .letter.assembled { opacity: 1; transform: translate(0, 0) scale(1); }
  .glow-line { position: absolute; top: 56%; left: 50%; transform: translateX(-50%) scaleX(0); width: 40%; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent); opacity: 0; transition: all 1s ease; z-index: 1; }
  .glow-line.show { opacity: 1; transform: translateX(-50%) scaleX(1); }
  .subtitle { position: absolute; top: 62%; left: 50%; transform: translate(-50%, 10px); color: rgba(255, 255, 255, 0.4); font-size: 11px; font-weight: 500; letter-spacing: 8px; text-transform: uppercase; opacity: 0; transition: all 0.8s ease; z-index: 2; }
  .subtitle.show { opacity: 1; transform: translate(-50%, 0); }

  /* --- ОСНОВНОЙ САЙТ --- */
  * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
  body { 
    margin: 0; background: #09090b; color: #fafafa; display: flex; justify-content: center; align-items: center; padding: 20px; min-height: 100vh; position: relative; overflow-x: hidden;
  }

  #bg-canvas { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; pointer-events: none; }

  .glass { background: rgba(20, 20, 22, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.4); }
  
  .container { padding: 40px; width: 100%; max-width: 500px; margin: 40px auto; position: relative; z-index: 1; }
  .wide-container { max-width: 1200px; width: 100%; }
  h1, h2, h3 { text-align: center; color: #fff; margin-bottom: 25px; font-weight: 600; letter-spacing: -0.5px; }
  
  /* Анимация выезда элементов */
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .animate-in { animation: slideUp 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards; opacity: 0; }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.2s; }
  .delay-3 { animation-delay: 0.3s; }

  input, select, textarea { 
    width: 100%; padding: 14px 16px; margin-bottom: 16px; 
    background: #000; border: 1px solid #27272a; border-radius: 8px; 
    font-size: 14px; color: #fff; transition: all 0.3s ease; 
  }
  input:focus, select:focus { border-color: #6c5ce7; outline: none; box-shadow: 0 0 0 3px rgba(108,92,231,0.15); }
  
  button { 
    width: 100%; padding: 14px; background: #fff; color: #000; border: none; border-radius: 8px; 
    font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; 
  }
  button:hover { background: #e4e4e7; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(255,255,255,0.1); }
  button:active { transform: translateY(0); }
  
  .link { text-align: center; margin-top: 24px; font-size: 13px; }
  .link a { color: #a1a1aa; text-decoration: none; transition: color 0.2s; }
  .link a:hover { color: #fff; }
  
  .alert { padding: 14px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-size: 13px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
  
  .card { 
    padding: 24px; border-radius: 12px; margin-bottom: 16px; 
    background: #18181b; border: 1px solid #27272a; 
    transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1); position: relative; 
  }
  .card:hover { transform: translateY(-4px); border-color: #3f3f46; box-shadow: 0 12px 30px rgba(0,0,0,0.5); }
  
  /* Цветные маркеры слева со свечением */
  .card::before { content: ''; position: absolute; left: 0; top: 20px; bottom: 20px; width: 3px; border-radius: 0 4px 4px 0; background: #52525b; transition: all 0.3s; }
  .card:hover::before { box-shadow: 0 0 10px currentColor; }
  .card.approved::before { background: #10b981; color: #10b981; }
  .card.rejected::before { background: #ef4444; color: #ef4444; }
  .card.pending::before { background: #f59e0b; color: #f59e0b; }
  .card.taken::before { background: #6c5ce7; color: #6c5ce7; }
  
  .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
  .badge.approved { background: rgba(16, 185, 129, 0.1); color: #10b981; }
  .badge.rejected { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
  .badge.taken { background: rgba(108, 92, 231, 0.1); color: #a29bfe; }
  
  .btn-ok { background: #10b981; color: #fff; width: auto; padding: 8px 16px; font-size: 12px; margin-right: 8px; border-radius: 6px; font-weight: 500; }
  .btn-ok:hover { background: #059669; box-shadow: 0 4px 15px rgba(16,185,129,0.3); }
  .btn-bad { background: #ef4444; color: #fff; width: auto; padding: 8px 16px; font-size: 12px; border-radius: 6px; font-weight: 500; }
  .btn-bad:hover { background: #dc2626; box-shadow: 0 4px 15px rgba(239,68,68,0.3); }
  .btn-purple { background: #6c5ce7; color: #fff; width: auto; padding: 10px 20px; font-size: 13px; border-radius: 6px; font-weight: 500; }
  .btn-purple:hover { background: #5a4bd1; box-shadow: 0 4px 15px rgba(108,92,231,0.3); }
  
  .btn-del { background: transparent; color: #52525b; border: 1px solid #27272a; width: auto; padding: 6px 10px; font-size: 12px; border-radius: 6px; transition: all 0.2s; cursor: pointer; }
  .btn-del:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.2); }
  
  .tabs { display: flex; justify-content: center; gap: 4px; margin-bottom: 40px; background: #18181b; padding: 4px; border-radius: 8px; border: 1px solid #27272a; width: fit-content; margin-left: auto; margin-right: auto; }
  .tab-btn { background: transparent; color: #a1a1aa; width: auto; padding: 8px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; transition: all 0.2s; }
  .tab-btn.active { background: #27272a; color: #fff; }
  .tab-btn:hover:not(.active) { color: #fff; }

  .main-menu { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; max-width: 800px; }
  @media (max-width: 768px) { .main-menu { grid-template-columns: 1fr; } }
  
  .menu-panel { padding: 60px 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; text-decoration: none; color: #fff; transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1); cursor: pointer; border-radius: 12px; background: #18181b; border: 1px solid #27272a; position: relative; overflow: hidden; }
  .menu-panel::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 70%); opacity: 0; transition: opacity 0.4s; }
  .menu-panel:hover { transform: translateY(-5px); border-color: #3f3f46; box-shadow: 0 15px 40px rgba(0,0,0,0.4); }
  .menu-panel:hover::after { opacity: 1; }
  .menu-panel h2 { font-size: 24px; margin-bottom: 8px; font-weight: 600; position: relative; z-index: 1; }
  .menu-panel p { color: #a1a1aa; font-size: 14px; margin-bottom: 30px; line-height: 1.5; position: relative; z-index: 1; }
  .menu-btn-style { padding: 10px 24px; border: 1px solid #3f3f46; border-radius: 6px; background: #27272a; font-size: 14px; font-weight: 500; transition: all 0.3s; position: relative; z-index: 1; }
  .menu-panel:hover .menu-btn-style { background: #fff; color: #000; border-color: #fff; }
  
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; } 
  @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  .admin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
  @media (max-width: 900px) { .admin-grid { grid-template-columns: 1fr; } }
  .admin-col { background: #09090b; padding: 24px; border-radius: 12px; border: 1px solid #27272a; }
  
  .proof-img { max-width: 100%; border-radius: 8px; margin-top: 10px; border: 1px solid #27272a; }
  
  .worker-row { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #18181b; border-radius: 8px; margin-bottom: 8px; border: 1px solid #27272a; transition: all 0.2s; }
  .worker-row:hover { border-color: #3f3f46; transform: translateX(4px); }
`;

const scripts = `
  <div id="preloader"><div class="glow-line" id="glow-line"></div><div class="title-container" id="title-container"></div><div class="subtitle" id="subtitle">SURVIVAL IN ANTARCTICA</div></div>
  <canvas id="bg-canvas"></canvas>
  <script>
    // ПРЕЛОАДЕР
    if (!sessionStorage.getItem('preloaderShown')) {
      const titleText = "SURVIVAL IN ANTARCTICA";
      const container = document.getElementById('title-container');
      titleText.split('').forEach((char, index) => {
        if (char === ' ') { const space = document.createElement('span'); space.innerHTML = '&nbsp;'; container.appendChild(space); } 
        else {
          const span = document.createElement('span'); span.textContent = char; span.className = 'letter';
          span.style.setProperty('--startX', (Math.random() - 0.5) * window.innerWidth * 1.5 + 'px');
          span.style.setProperty('--startY', (Math.random() - 0.5) * window.innerHeight * 1.5 + 'px');
          container.appendChild(span);
        }
      });
      setTimeout(() => { document.querySelectorAll('.letter').forEach((l, i) => setTimeout(() => l.classList.add('assembled'), i * 25)); }, 100);
      setTimeout(() => { document.getElementById('title-container').classList.add('move-up'); document.getElementById('glow-line').classList.add('show'); }, 1500);
      setTimeout(() => { document.getElementById('subtitle').classList.add('show'); }, 1800);
      setTimeout(() => { document.getElementById('preloader').classList.add('hidden'); sessionStorage.setItem('preloaderShown', 'true'); setTimeout(() => document.getElementById('preloader').remove(), 800); }, 3500);
    } else { document.getElementById('preloader').remove(); }

    // БЕЛЫЕ КУБИКИ (ЖЕЛЕ)
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let width, height, mouse = { x: -1000, y: -1000 }, cubes = [];
    const spacing = 70, cubeSize = 18; // Размер и расстояние

    function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; initCubes(); }
    function initCubes() { 
      cubes = []; 
      for (let x = spacing/2; x < width; x += spacing) { 
        for (let y = spacing/2; y < height; y += spacing) { 
          cubes.push({ x, y, baseX: x, baseY: y, vx: 0, vy: 0, phase: Math.random() * Math.PI * 2, speed: 0.001 + Math.random() * 0.002 }); 
        } 
      } 
    }
    
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('touchmove', (e) => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; });
    
    function animate(time) {
      ctx.clearRect(0, 0, width, height);
      cubes.forEach(cube => {
        // Плавное покачивание
        let targetX = cube.baseX + Math.sin(time * cube.speed + cube.phase) * 6;
        let targetY = cube.baseY + Math.cos(time * cube.speed + cube.phase) * 6;
        
        // Отталкивание от мыши
        let dx = mouse.x - cube.x, dy = mouse.y - cube.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) { 
          let force = (150 - dist) / 150; 
          targetX -= (dx / dist) * force * 30; 
          targetY -= (dy / dist) * force * 30; 
        }
        
        // Физика пружины
        cube.vx += (targetX - cube.x) * 0.05; 
        cube.vy += (targetY - cube.y) * 0.05; 
        cube.vx *= 0.8; 
        cube.vy *= 0.8; 
        cube.x += cube.vx; 
        cube.y += cube.vy;
        
        // Рисуем белые полупрозрачные кубики
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; 
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; 
        ctx.lineWidth = 1;
        
        ctx.beginPath(); 
        if (ctx.roundRect) ctx.roundRect(cube.x - cubeSize/2, cube.y - cubeSize/2, cubeSize, cubeSize, 4); 
        else ctx.rect(cube.x - cubeSize/2, cube.y - cubeSize/2, cubeSize, cubeSize);
        ctx.fill(); 
        ctx.stroke();
      });
      requestAnimationFrame(animate);
    }
    window.addEventListener('resize', resize); resize(); requestAnimationFrame(animate);
  </script>
`;

const renderDashboard = async (user, res) => {
  const { rows: tasks } = await pool.query(`
    SELECT * FROM tasks 
    WHERE role = $1 AND (completed_at IS NULL OR completed_at > NOW() - INTERVAL '24 hours')
    ORDER BY created_at DESC
  `, [user.role]);
  
  let html = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container wide-container glass animate-in"><h2>Кабинет: ${user.name} (${user.role})</h2><div class="link" style="text-align:right; margin-bottom:20px;"><a href="/">Выйти</a></div><div class="grid">`;
  
  if (tasks.length === 0) html += `<p style="text-align:center; color:#a1a1aa; grid-column: 1/-1;">Для вашего отдела пока нет активных задач.</p>`;
  else {
    tasks.forEach((task, i) => {
      let badgeClass = 'pending', badgeText = 'Свободна';
      let actionHtml = '';

      if (task.status === 'Свободна') {
        actionHtml = `<form action="/task/take" method="POST"><input type="hidden" name="task_id" value="${task.id}"><input type="hidden" name="username" value="${user.username}"><input type="hidden" name="password" value="${user.password}"><button type="submit" class="btn-purple" style="width:100%;">Взять задачу</button></form>`;
      } else if (task.status === 'В работе') {
        if (task.taken_by === user.username) {
          badgeClass = 'taken'; badgeText = 'В работе (у вас)';
          actionHtml = `<form action="/task/done" method="POST" enctype="multipart/form-data" style="margin-top:15px;"><input type="hidden" name="task_id" value="${task.id}"><input type="hidden" name="username" value="${user.username}"><input type="hidden" name="password" value="${user.password}"><p style="font-size:13px; color:#a1a1aa; margin-bottom:10px;">Прикрепите скриншот:</p><input type="file" name="proof" accept="image/*" required style="padding:10px; font-size:13px; margin-bottom:10px; background:#000; border:1px dashed #3f3f46; color:#fff;"><button type="submit" class="btn-ok" style="width:100%;">Я выполнил задачу</button></form>`;
        } else {
          badgeClass = 'taken'; badgeText = 'В работе';
          actionHtml = `<p style="color:#a29bfe; font-size:13px; font-weight:500; text-align:center; padding:12px; background:rgba(108,92,231,0.1); border-radius:8px;">Взял(а): ${task.taken_by}</p>`;
        }
      } else if (task.status === 'Выполнено') {
        badgeClass = 'approved'; badgeText = 'Выполнено (На проверке)';
        actionHtml = `<p style="color:#10b981; font-size:13px; font-weight:500; text-align:center; padding:12px; background:rgba(16,185,129,0.1); border-radius:8px;">Сдал(а): ${task.taken_by}</p>`;
      }

      html += `<div class="card ${badgeClass} animate-in delay-${Math.min(i+1, 3)}"><span class="badge ${badgeClass}">${badgeText}</span><h3 style="margin-top:0; text-align:left; font-size:18px;">${task.title}</h3><p style="color:#a1a1aa; font-size:14px; margin-bottom:15px;">${task.description}</p>${actionHtml}</div>`;
    });
  }
  html += `</div></div></body></html>`;
  res.send(html);
};

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
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2 style="color:#fff">✅ Успешно!</h2><p style="text-align:center; color:#a1a1aa;">Заявка отправлена. Ожидайте ответа.</p><div class="link"><a href="/">← На главную</a></div></div></body></html>`);
  } catch (err) { res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2 style="color:#ef4444">Ошибка</h2><div class="alert">Логин уже занят.</div><div class="link"><a href="/apply">← Назад</a></div></div></body></html>`); }
});

app.get('/login', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Вход</title><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2>Вход для сотрудников</h2><form action="/dashboard" method="POST"><input name="username" placeholder="Ваш логин" required><input name="password" type="password" placeholder="Ваш пароль" required><button type="submit">Войти в кабинет</button></form><div class="link"><a href="/">← На главную</a></div></div></body></html>`);
});

app.post('/dashboard', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2', [username, password]);
    if (rows.length === 0) return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2>Ошибка</h2><div class="alert">Неверный логин или пароль.</div><div class="link"><a href="/login">Назад</a></div></div></body></html>`);
    const user = rows[0];
    if (user.status !== 'Одобрено') return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2>Доступ закрыт</h2><div class="alert">Ваша заявка еще не одобрена или была отклонена.</div><div class="link"><a href="/">На главную</a></div></div></body></html>`);
    await renderDashboard(user, res);
  } catch (err) { res.status(500).send('Ошибка сервера'); }
});

app.post('/task/take', async (req, res) => {
  const { task_id, username, password } = req.body;
  await pool.query("UPDATE tasks SET status = 'В работе', taken_by = $1 WHERE id = $2", [username, task_id]);
  const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2', [username, password]);
  await renderDashboard(rows[0], res);
});

app.post('/task/done', (req, res) => {
  let chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    const buffer = Buffer.concat(chunks);
    const boundary = req.headers['content-type'].split('boundary=')[1];
    const parts = buffer.toString('binary').split('--' + boundary);
    
    let task_id, username, password, proofBase64 = '';
    for (let part of parts) {
      if (part.includes('name="task_id"')) task_id = part.split('\r\n\r\n')[1].split('\r\n')[0];
      if (part.includes('name="username"')) username = part.split('\r\n\r\n')[1].split('\r\n')[0];
      if (part.includes('name="password"')) password = part.split('\r\n\r\n')[1].split('\r\n')[0];
      if (part.includes('name="proof"')) {
        const matches = part.match(/Content-Type: (image\/.*)\r\n\r\n([\s\S]*)\r\n$/);
        if (matches) {
          const base64 = Buffer.from(matches[2], 'binary').toString('base64');
          proofBase64 = `data:${matches[1]};base64,${base64}`;
        }
      }
    }
    if (task_id && username) {
      await pool.query("UPDATE tasks SET status = 'Выполнено', completed_at = NOW(), proof_image = $1 WHERE id = $2 AND taken_by = $3", [proofBase64, task_id, username]);
      const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2', [username, password]);
      await renderDashboard(rows[0], res);
    } else { res.redirect('/login'); }
  });
});

app.get('/admin', async (req, res) => {
  const pass = req.query.pass;
  const tab = req.query.tab || 'tasks';

  if (pass !== ADMIN_PASSWORD) return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in" style="max-width:380px; margin-top:120px;"><h2>Вход для админа</h2><form><input name="pass" type="password" placeholder="Пароль" required><button type="submit">Войти</button></form></div></body></html>`);
  
  try {
    let html = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container wide-container glass animate-in"><h2>Админ-панель</h2><div class="tabs"><a href="/admin?pass=${pass}&tab=tasks" class="tab-btn ${tab === 'tasks' ? 'active' : ''}">Задачи</a><a href="/admin?pass=${pass}&tab=applications" class="tab-btn ${tab === 'applications' ? 'active' : ''}">Заявки</a><a href="/admin?pass=${pass}&tab=workers" class="tab-btn ${tab === 'workers' ? 'active' : ''}">Сотрудники</a></div>`;

    if (tab === 'applications') {
      const { rows: apps } = await pool.query('SELECT * FROM applications ORDER BY created_at DESC');
      const current = apps.filter(a => a.status === 'На рассмотрении');
      const archive = apps.filter(a => a.status !== 'На рассмотрении');

      const renderApp = (app, isArchive) => {
        let badge = 'pending', text = 'На рассмотрении';
        if (app.status === 'Одобрено') { badge = 'approved'; text = 'Одобрено'; }
        if (app.status === 'Отклонено') { badge = 'rejected'; text = 'Отклонено'; }
        let h = `<div class="card ${badge} animate-in"><div style="display:flex; justify-content:space-between; align-items:start;"><div><span class="badge ${badge}">${text}</span><p style="font-size:15px; margin:5px 0;"><b>${app.name}</b> (${app.role})</p><p style="font-size:12px; color:#a1a1aa;">Логин: ${app.username}<br>Discord: ${app.discord}</p></div>`;
        if (isArchive) h += `<form action="/admin/delete-app" method="POST" onsubmit="return confirm('Удалить эту заявку из архива навсегда?');"><input type="hidden" name="id" value="${app.id}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-del">🗑️</button></form>`;
        h += `</div>`;
        if (!isArchive) {
          h += `<form action="/admin/status" method="POST" style="display:flex; gap:8px; margin-top:15px;" onsubmit="const msg = prompt('Комментарий:'); if (msg !== null) { this.comment.value = msg; } else { event.preventDefault(); }"><input type="hidden" name="id" value="${app.id}"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="comment" value=""><button name="status" value="Одобрено" class="btn-ok">Одобрить</button><button name="status" value="Отклонено" class="btn-bad">Отклонить</button></form>`;
        }
        return h + `</div>`;
      };

      html += `<div class="admin-grid"><div class="admin-col"><h3>⏳ Текущие заявки</h3>`;
      if (current.length === 0) html += `<p style="text-align:center; color:#a1a1aa;">Пусто</p>`;
      current.forEach(a => html += renderApp(a, false));
      
      html += `</div><div class="admin-col"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;"><h3 style="margin:0;">📁 Архив</h3><form action="/admin/clear-archive" method="POST" onsubmit="return confirm('ВНИМАНИЕ! Это удалит ВСЕ заявки из архива! Вы уверены?');"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-bad" style="padding:6px 12px; font-size:12px;">Очистить всё</button></form></div>`;
      if (archive.length === 0) html += `<p style="text-align:center; color:#a1a1aa;">Пусто</p>`;
      archive.forEach(a => html += renderApp(a, true));
      html += `</div></div>`;
    }

    if (tab === 'tasks') {
      const { rows: tasks } = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
      html += `<div class="card animate-in" style="margin-bottom:30px;"><h3 style="text-align:left;">➕ Выдать новую задачу</h3><form action="/admin/task" method="POST" style="margin-top:15px;"><input type="hidden" name="pass" value="${pass}"><select name="role" required><option value="" disabled selected hidden>Выберите отдел</option><option>Билдер</option><option>Скриптер</option><option>GUI-дизайнер</option><option>Аниматор</option><option>Тестер</option></select><input name="title" placeholder="Название задачи" required><textarea name="description" placeholder="Описание задачи" rows="2" required></textarea><button type="submit" class="btn-purple" style="width:100%;">Создать задачу</button></form></div><div class="grid">`;
      
      tasks.forEach((task, i) => {
        let badge = 'pending', text = 'Свободна';
        let extra = '';
        if (task.status === 'В работе') { badge = 'taken'; text = 'В работе'; extra = `<p style="font-size:12px; color:#a29bfe; margin-top:5px;">Взял: ${task.taken_by}</p>`; }
        if (task.status === 'Выполнено') { badge = 'approved'; text = 'Выполнено'; extra = `<p style="font-size:12px; color:#10b981; margin-top:5px;">Сдал: ${task.taken_by}</p>`; }

        html += `<div class="card ${badge} animate-in delay-${Math.min(i+1, 3)}"><div style="display:flex; justify-content:space-between; align-items:start;"><div style="display:flex; gap:8px;"><span class="badge ${badge}">${task.role}</span><span class="badge ${badge}">${text}</span></div><form action="/admin/delete-task" method="POST" onsubmit="return confirm('Удалить эту задачу?');"><input type="hidden" name="id" value="${task.id}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-del">🗑️</button></form></div><h3 style="margin-top:10px; text-align:left; font-size:18px;">${task.title}</h3><p style="color:#a1a1aa; font-size:14px;">${task.description}</p>${extra}`;
        if (task.proof_image) html += `<p style="font-size:12px; color:#71717a; margin-top:10px; margin-bottom:5px;">Доказательство:</p><img src="${task.proof_image}" class="proof-img">`;
        html += `</div>`;
      });
      html += `</div>`;
    }

    if (tab === 'workers') {
      const { rows: workers } = await pool.query("SELECT * FROM applications WHERE status = 'Одобрено' ORDER BY role ASC");
      html += `<div class="admin-col animate-in" style="max-width:800px; margin:0 auto;"><h3>👥 Список сотрудников</h3><p style="text-align:center; color:#a1a1aa; margin-bottom:20px;">Всего в команде: ${workers.length}</p>`;
      
      if (workers.length === 0) html += `<p style="text-align:center; color:#a1a1aa;">Пока никого нет</p>`;
      else {
        workers.forEach((w, i) => {
          html += `<div class="worker-row animate-in delay-${Math.min(i+1, 3)}">
            <div>
              <p style="margin:0; font-size:15px;"><b>${w.name}</b> <span style="color:#6c5ce7; font-size:13px;">(${w.role})</span></p>
              <p style="margin:5px 0 0 0; font-size:12px; color:#a1a1aa;">Логин: ${w.username} | Discord: ${w.discord}</p>
              <p style="margin:2px 0 0 0; font-size:12px; color:#a1a1aa;">Roblox: ${w.roblox_nick} | TG: ${w.telegram || '-'}</p>
            </div>
            <form action="/admin/kick-worker" method="POST" onsubmit="return confirm('Вы уверены, что хотите кикнуть сотрудника ${w.name}? Его заявка будет удалена.');">
              <input type="hidden" name="id" value="${w.id}">
              <input type="hidden" name="pass" value="${pass}">
              <button type="submit" class="btn-bad" style="padding:8px 15px; font-size:12px;">Кикнуть</button>
            </form>
          </div>`;
        });
      }
      html += `</div>`;
    }

    html += `<div class="link" style="margin-top:30px;"><a href="/admin?pass=${pass}&tab=${tab}">🔄 Обновить</a></div></div></body></html>`;
    res.send(html);
  } catch (err) { res.send(`<h2 style="color:#ef4444;">Ошибка: ${err.message}</h2>`); }
});

app.post('/admin/status', async (req, res) => {
  const { id, status, pass, comment } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query('UPDATE applications SET status = $1, admin_comment = $2 WHERE id = $3', [status, comment || null, id]);
  res.redirect('/admin?pass=' + pass + '&tab=applications'); 
});

app.post('/admin/task', async (req, res) => {
  const { role, title, description, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query('INSERT INTO tasks (role, title, description) VALUES ($1, $2, $3)', [role, title, description]);
  res.redirect('/admin?pass=' + pass + '&tab=tasks'); 
});

app.post('/admin/clear-archive', async (req, res) => {
  const { pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query("DELETE FROM applications WHERE status != 'На рассмотрении'");
  res.redirect('/admin?pass=' + pass + '&tab=applications');
});

app.post('/admin/delete-app', async (req, res) => {
  const { id, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query("DELETE FROM applications WHERE id = $1", [id]);
  res.redirect('/admin?pass=' + pass + '&tab=applications');
});

app.post('/admin/delete-task', async (req, res) => {
  const { id, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
  res.redirect('/admin?pass=' + pass + '&tab=tasks');
});

app.post('/admin/kick-worker', async (req, res) => {
  const { id, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query("DELETE FROM applications WHERE id = $1", [id]);
  res.redirect('/admin?pass=' + pass + '&tab=workers');
});

app.listen(PORT, () => console.log('Сервер запущен на порту ' + PORT));
