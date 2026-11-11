const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2024';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Увеличиваем лимит для загрузки фото (Base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap');
  
  /* --- ПРЕЛОАДЕР --- */
  #preloader { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #000; z-index: 9999; display: flex; flex-direction: column; justify-content: center; align-items: center; transition: opacity 1s cubic-bezier(0.19, 1, 0.22, 1), visibility 1s ease; overflow: hidden; }
  #preloader.hidden { opacity: 0; visibility: hidden; }
  .title-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); transition: transform 1.2s cubic-bezier(0.19, 1, 0.22, 1); display: flex; gap: 2px; z-index: 2; }
  .title-container.move-up { transform: translate(-50%, -120%); }
  .letter { color: rgba(255, 255, 255, 0.95); font-size: clamp(24px, 4vw, 56px); font-weight: 800; display: inline-block; opacity: 0; text-shadow: 0 0 20px rgba(255,255,255,0.3); transform: translate(var(--startX), var(--startY)) scale(0.3) rotate(var(--startRot)); transition: transform 1.2s cubic-bezier(0.19, 1, 0.22, 1), opacity 1s ease; }
  .letter.assembled { opacity: 1; transform: translate(0, 0) scale(1) rotate(0deg); }
  .glow-line { position: absolute; top: 58%; left: 50%; transform: translateX(-50%) scaleX(0); width: 60%; height: 2px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent); box-shadow: 0 0 20px 3px rgba(255,255,255,0.4); opacity: 0; transition: all 1.2s ease; z-index: 1; }
  .glow-line.show { opacity: 1; transform: translateX(-50%) scaleX(1); }
  .subtitle { position: absolute; top: 65%; left: 50%; transform: translate(-50%, 20px); color: rgba(255, 255, 255, 0.6); font-size: 12px; font-weight: 600; letter-spacing: 6px; text-transform: uppercase; opacity: 0; transition: all 1s ease; z-index: 2; }
  .subtitle.show { opacity: 1; transform: translate(-50%, 0); }

  /* --- ОСНОВНОЙ САЙТ --- */
  * { box-sizing: border-box; font-family: 'Montserrat', sans-serif; }
  body { 
    margin: 0; background: #030305; color: #fff; display: flex; justify-content: center; align-items: center; padding: 20px; min-height: 100vh; position: relative; overflow-x: hidden;
    background-image: radial-gradient(circle at 15% 50%, rgba(108,92,231,0.08) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(0,184,148,0.08) 0%, transparent 50%);
  }

  #bg-canvas { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; pointer-events: none; }
  
  .glass { 
    background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(30px) saturate(200%); -webkit-backdrop-filter: blur(30px) saturate(200%); 
    border: 1px solid rgba(255, 255, 255, 0.06); box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1); 
    border-radius: 28px; 
  }

  .container { padding: 40px; width: 100%; max-width: 520px; margin: 40px auto; position: relative; z-index: 1; }
  .wide-container { max-width: 1100px; width: 100%; }
  h1, h2, h3 { text-align: center; color: #fff; margin-bottom: 25px; font-weight: 800; letter-spacing: -0.5px; }
  
  input, select, textarea { width: 100%; padding: 16px; margin-bottom: 16px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; font-size: 15px; color: #fff; transition: all 0.3s; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); }
  input:focus, select:focus { border-color: rgba(108,92,231,0.5); outline: none; background: rgba(0,0,0,0.5); box-shadow: inset 0 2px 4px rgba(0,0,0,0.2), 0 0 0 4px rgba(108,92,231,0.1); }
  button { width: 100%; padding: 16px; background: #fff; color: #000; border: none; border-radius: 16px; font-size: 16px; font-weight: 800; cursor: pointer; transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1); }
  button:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(255,255,255,0.2); }
  button:active { transform: translateY(0) scale(0.98); }
  
  .link { text-align: center; margin-top: 24px; font-size: 14px; }
  .link a { color: rgba(255,255,255,0.5); text-decoration: none; transition: color 0.2s; }
  .link a:hover { color: #fff; }
  .alert { padding: 16px; border-radius: 16px; margin-bottom: 20px; text-align: center; font-size: 14px; background: rgba(214, 48, 49, 0.1); color: #ff7675; border: 1px solid rgba(214, 48, 49, 0.2); }
  
  .card { padding: 24px; border-radius: 20px; margin-bottom: 16px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255,255,255,0.05); border-left: 4px solid rgba(255,255,255,0.2); transition: all 0.3s; }
  .card:hover { background: rgba(255, 255, 255, 0.04); }
  .card.approved { border-left-color: #00b894; box-shadow: inset 20px 0 30px -20px rgba(0,184,148,0.1); }
  .card.rejected { border-left-color: #d63031; }
  .card.pending { border-left-color: #fdcb6e; }
  .card.taken { border-left-color: #6c5ce7; box-shadow: inset 20px 0 30px -20px rgba(108,92,231,0.1); }
  
  .badge { display: inline-block; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge.pending { background: rgba(253, 203, 110, 0.15); color: #fdcb6e; }
  .badge.approved { background: rgba(0, 184, 148, 0.15); color: #55efc4; }
  .badge.rejected { background: rgba(214, 48, 49, 0.15); color: #ff7675; }
  .badge.taken { background: rgba(108, 92, 231, 0.2); color: #a29bfe; }
  
  .btn-ok { background: rgba(0, 184, 148, 0.9); color: #fff; width: auto; padding: 10px 24px; font-size: 14px; margin-right: 8px; border-radius: 10px; }
  .btn-bad { background: rgba(214, 48, 49, 0.9); color: #fff; width: auto; padding: 10px 24px; font-size: 14px; border-radius: 10px; }
  .btn-purple { background: #6c5ce7; color: #fff; width: auto; padding: 10px 24px; font-size: 14px; border-radius: 10px; }
  
  .tabs { display: flex; justify-content: center; gap: 8px; margin-bottom: 30px; background: rgba(255,255,255,0.02); padding: 6px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
  .tab-btn { background: transparent; color: rgba(255,255,255,0.5); width: auto; padding: 10px 30px; text-decoration: none; border-radius: 12px; font-weight: 600; transition: all 0.3s; }
  .tab-btn.active { background: rgba(255,255,255,0.08); color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
  .tab-btn:hover:not(.active) { color: #fff; }

  .main-menu { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; width: 100%; max-width: 900px; }
  @media (max-width: 768px) { .main-menu { grid-template-columns: 1fr; } }
  
  .menu-panel { padding: 50px 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; text-decoration: none; color: #fff; transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1); cursor: pointer; min-height: 350px; }
  .menu-panel:hover { transform: translateY(-8px) scale(1.02); background: rgba(255, 255, 255, 0.05); }
  .menu-panel h2 { font-size: 28px; margin-bottom: 10px; }
  .menu-panel p { color: rgba(255,255,255,0.5); font-size: 15px; margin-bottom: 30px; line-height: 1.6; }
  .menu-btn-style { padding: 12px 30px; border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; background: rgba(255,255,255,0.05); font-weight: 600; }
  
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; } 
  @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  .admin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: start; }
  @media (max-width: 900px) { .admin-grid { grid-template-columns: 1fr; } }
  .admin-col { background: rgba(0,0,0,0.2); padding: 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
  
  .proof-img { max-width: 100%; border-radius: 12px; margin-top: 10px; border: 1px solid rgba(255,255,255,0.1); }
`;

const scripts = `
  <div id="preloader"><div class="glow-line" id="glow-line"></div><div class="title-container" id="title-container"></div><div class="subtitle" id="subtitle">SURVIVAL IN ANTARCTICA</div></div>
  <canvas id="bg-canvas"></canvas>
  <script>
    if (!sessionStorage.getItem('preloaderShown')) {
      const titleText = "SURVIVAL IN ANTARCTICA";
      const container = document.getElementById('title-container');
      titleText.split('').forEach((char, index) => {
        if (char === ' ') { const space = document.createElement('span'); space.innerHTML = '&nbsp;'; container.appendChild(space); } 
        else {
          const span = document.createElement('span'); span.textContent = char; span.className = 'letter';
          span.style.setProperty('--startX', (Math.random() - 0.5) * window.innerWidth * 1.5 + 'px');
          span.style.setProperty('--startY', (Math.random() - 0.5) * window.innerHeight * 1.5 + 'px');
          span.style.setProperty('--startRot', (Math.random() - 0.5) * 180 + 'deg');
          container.appendChild(span);
        }
      });
      setTimeout(() => { document.querySelectorAll('.letter').forEach((l, i) => setTimeout(() => l.classList.add('assembled'), i * 25)); }, 100);
      setTimeout(() => { document.getElementById('title-container').classList.add('move-up'); document.getElementById('glow-line').classList.add('show'); }, 1800);
      setTimeout(() => { document.getElementById('subtitle').classList.add('show'); }, 2200);
      setTimeout(() => { document.getElementById('preloader').classList.add('hidden'); sessionStorage.setItem('preloaderShown', 'true'); setTimeout(() => document.getElementById('preloader').remove(), 1200); }, 4500);
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
        if (dist < 120) { let force = (120 - dist) / 120; targetX -= (dx / dist) * force * 30; targetY -= (dy / dist) * force * 30; }
        cube.vx += (targetX - cube.x) * 0.05; cube.vy += (targetY - cube.y) * 0.05; cube.vx *= 0.8; cube.vy *= 0.8; cube.x += cube.vx; cube.y += cube.vy;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'; ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 1;
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(cube.x - cubeSize/2, cube.y - cubeSize/2, cubeSize, cubeSize, 4); else ctx.rect(cube.x - cubeSize/2, cube.y - cubeSize/2, cubeSize, cubeSize);
        ctx.fill(); ctx.stroke();
      });
      requestAnimationFrame(animate);
    }
    window.addEventListener('resize', resize); resize(); requestAnimationFrame(animate);
  </script>
`;

// --- ГЛАВНАЯ ---
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Survival in Antarctica</title><style>${css}</style></head><body>${scripts}
  <div class="main-menu">
    <a href="/login" class="menu-panel glass">
      <h2>Сотрудникам</h2>
      <p>Вход в личный кабинет<br>для получения и сдачи задач</p>
      <div class="menu-btn-style">Войти</div>
    </a>
    <a href="/apply" class="menu-panel glass">
      <h2>Соискателям</h2>
      <p>Подать заявку в команду<br>на одну из должностей</p>
      <div class="menu-btn-style">Подать заявку</div>
    </a>
  </div>
  </body></html>`);
});

// --- ЗАЯВКА ---
app.get('/apply', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Подать заявку</title><style>${css}</style></head><body>${scripts}<div class="container glass"><h2>Заявка в команду</h2>${req.query.error ? '<div class="alert">Заполните все обязательные поля!</div>' : ''}<form action="/apply" method="POST"><input name="name" placeholder="1. Ваше имя" required><input name="location" placeholder="2. Страна / Город" required><input name="roblox" placeholder="3. Ник в Roblox" required><input name="discord" placeholder="4. Discord (обязательно)" required><input name="telegram" placeholder="Telegram (необязательно)"><select name="role" required><option value="" disabled selected hidden>Кем вы хотите быть?</option><option>Билдер</option><option>Скриптер</option><option>GUI-дизайнер</option><option>Аниматор</option><option>Тестер</option></select><input name="username" placeholder="Придумайте Логин" required><input name="password" type="password" placeholder="Придумайте Пароль" required><button type="submit">Отправить заявку</button></form><div class="link"><a href="/">← На главную</a></div></div></body></html>`);
});

app.post('/apply', async (req, res) => {
  const { name, location, roblox, discord, telegram, role, username, password } = req.body;
  if (!name || !location || !roblox || !discord || !role || !username || !password) return res.redirect('/apply?error=1');
  try {
    await pool.query(`INSERT INTO applications (name, location, roblox_nick, discord, telegram, role, username, password, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'На рассмотрении')`, [name, location, roblox, discord, telegram || null, role, username.trim(), password.trim()]);
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass"><h2 style="color:#fff">✅ Успешно!</h2><p style="text-align:center; color:rgba(255,255,255,0.7);">Заявка отправлена. Ожидайте ответа.</p><div class="link"><a href="/">← На главную</a></div></div></body></html>`);
  } catch (err) {
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass"><h2 style="color:#ff7675">Ошибка</h2><div class="alert">Логин уже занят.</div><div class="link"><a href="/apply">← Назад</a></div></div></body></html>`);
  }
});

// --- ЛОГИН ---
app.get('/login', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Вход</title><style>${css}</style></head><body>${scripts}<div class="container glass"><h2>Вход для сотрудников</h2><form action="/dashboard" method="POST"><input name="username" placeholder="Ваш логин" required><input name="password" type="password" placeholder="Ваш пароль" required><button type="submit">Войти в кабинет</button></form><div class="link"><a href="/">← На главную</a></div></div></body></html>`);
});

// --- КАБИНЕТ СОТРУДНИКА ---
app.post('/dashboard', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2', [username, password]);
    if (rows.length === 0) return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass"><h2>Ошибка</h2><div class="alert">Неверный логин или пароль.</div><div class="link"><a href="/login">Назад</a></div></div></body></html>`);
    
    const user = rows[0];
    if (user.status !== 'Одобрено') return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass"><h2>Доступ закрыт</h2><div class="alert">Ваша заявка еще не одобрена или была отклонена.</div><div class="link"><a href="/">На главную</a></div></div></body></html>`);

    // Берем задачи для отдела, исключая те, что выполнены более 24 часов назад
    const { rows: tasks } = await pool.query(`
      SELECT * FROM tasks 
      WHERE role = $1 AND (completed_at IS NULL OR completed_at > NOW() - INTERVAL '24 hours')
      ORDER BY created_at DESC
    `, [user.role]);
    
    let html = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container wide-container glass"><h2>Кабинет: ${user.name} (${user.role})</h2><div class="link" style="text-align:right; margin-bottom:20px;"><a href="/">Выйти</a></div><div class="grid">`;
    
    if (tasks.length === 0) html += `<p style="text-align:center; color:#888; grid-column: 1/-1;">Для вашего отдела пока нет активных задач.</p>`;
    else {
      tasks.forEach(task => {
        let badgeClass = 'pending', badgeText = 'Свободна';
        let actionHtml = '';

        if (task.status === 'Свободна') {
          actionHtml = `<form action="/task/take" method="POST"><input type="hidden" name="task_id" value="${task.id}"><input type="hidden" name="username" value="${user.username}"><button type="submit" class="btn-purple" style="width:100%;">Взять задачу</button></form>`;
        } else if (task.status === 'В работе') {
          if (task.taken_by === user.username) {
            badgeClass = 'taken'; badgeText = 'В работе (у вас)';
            actionHtml = `
              <form action="/task/done" method="POST" enctype="multipart/form-data" style="margin-top:15px;">
                <input type="hidden" name="task_id" value="${task.id}">
                <input type="hidden" name="username" value="${user.username}">
                <p style="font-size:13px; color:#ccc; margin-bottom:10px;">Прикрепите скриншот/доказательство:</p>
                <input type="file" name="proof" accept="image/*" required style="padding:10px; font-size:13px; margin-bottom:10px; background:rgba(0,0,0,0.3); border:1px dashed rgba(255,255,255,0.2);">
                <button type="submit" class="btn-ok" style="width:100%;">Я выполнил задачу</button>
              </form>`;
          } else {
            badgeClass = 'taken'; badgeText = 'В работе';
            actionHtml = `<p style="color:#a29bfe; font-size:14px; font-weight:600; text-align:center; padding:10px; background:rgba(108,92,231,0.1); border-radius:10px;">Взял(а): ${task.taken_by}</p>`;
          }
        } else if (task.status === 'Выполнено') {
          badgeClass = 'approved'; badgeText = 'Выполнено (Ожидает проверки)';
          actionHtml = `<p style="color:#00b894; font-size:14px; font-weight:600; text-align:center; padding:10px; background:rgba(0,184,148,0.1); border-radius:10px;">Сдал(а): ${task.taken_by}</p>`;
        }

        html += `<div class="card ${badgeClass}">
          <span class="badge ${badgeClass}">${badgeText}</span>
          <h3 style="margin-top:0; text-align:left;">${task.title}</h3>
          <p style="color:#ccc; font-size:14px; margin-bottom:15px;">${task.description}</p>
          ${actionHtml}
        </div>`;
      });
    }
    html += `</div></div></body></html>`;
    res.send(html);
  } catch (err) { res.status(500).send('Ошибка сервера'); }
});

// Обработка кнопки "Взять задачу"
app.post('/task/take', async (req, res) => {
  const { task_id, username } = req.body;
  await pool.query("UPDATE tasks SET status = 'В работе', taken_by = $1 WHERE id = $2", [username, task_id]);
  res.redirect('back');
});

// Обработка сдачи задачи с фото
app.post('/task/done', (req, res) => {
  let chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    // Простейший парсер multipart для одного файла
    const buffer = Buffer.concat(chunks);
    const boundary = req.headers['content-type'].split('boundary=')[1];
    const parts = buffer.toString('binary').split('--' + boundary);
    
    let task_id, username, proofBase64 = '';
    for (let part of parts) {
      if (part.includes('name="task_id"')) task_id = part.split('\r\n\r\n')[1].split('\r\n')[0];
      if (part.includes('name="username"')) username = part.split('\r\n\r\n')[1].split('\r\n')[0];
      if (part.includes('name="proof"')) {
        const matches = part.match(/Content-Type: (image\/.*)\r\n\r\n([\s\S]*)\r\n$/);
        if (matches) {
          // Сохраняем как Base64 для простоты (в идеале нужно хранилище, но для мелких картинок сработает)
          const base64 = Buffer.from(matches[2], 'binary').toString('base64');
          proofBase64 = `data:${matches[1]};base64,${base64}`;
        }
      }
    }
    
    if (task_id && username) {
      await pool.query("UPDATE tasks SET status = 'Выполнено', completed_at = NOW(), proof_image = $1 WHERE id = $2 AND taken_by = $3", [proofBase64, task_id, username]);
    }
    res.redirect('back');
  });
});

// --- АДМИНКА ---
app.get('/admin', async (req, res) => {
  const pass = req.query.pass;
  const tab = req.query.tab || 'tasks'; // tasks или applications

  if (pass !== ADMIN_PASSWORD) return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass" style="max-width:380px; margin-top:120px;"><h2>Вход для админа</h2><form><input name="pass" type="password" placeholder="Пароль" required><button type="submit">Войти</button></form></div></body></html>`);
  
  try {
    let html = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container wide-container glass">
    <h2>Админ-панель</h2>
    <div class="tabs">
      <a href="/admin?pass=${pass}&tab=tasks" class="tab-btn ${tab === 'tasks' ? 'active' : ''}">Задачи</a>
      <a href="/admin?pass=${pass}&tab=applications" class="tab-btn ${tab === 'applications' ? 'active' : ''}">Заявки</a>
    </div>`;

    if (tab === 'applications') {
      // Заявки (левая колонка - текущие, правая - архив)
      const { rows: apps } = await pool.query('SELECT * FROM applications ORDER BY created_at DESC');
      const current = apps.filter(a => a.status === 'На рассмотрении');
      const archive = apps.filter(a => a.status !== 'На рассмотрении');

      const renderApp = (app) => {
        let badge = 'pending', text = 'На рассмотрении';
        if (app.status === 'Одобрено') { badge = 'approved'; text = 'Одобрено'; }
        if (app.status === 'Отклонено') { badge = 'rejected'; text = 'Отклонено'; }
        let html = `<div class="card ${badge}"><span class="badge ${badge}">${text}</span><p style="font-size:15px; margin-bottom:8px;"><b>${app.name}</b> (${app.role})</p><p style="font-size:12px; color:rgba(255,255,255,0.6);">Логин: ${app.username}<br>Discord: ${app.discord}</p>`;
        if (app.status === 'На рассмотрении') {
          html += `<form action="/admin/status" method="POST" style="display:flex; gap:8px; margin-top:15px;" onsubmit="const msg = prompt('Комментарий:'); if (msg !== null) { this.comment.value = msg; } else { event.preventDefault(); }"><input type="hidden" name="id" value="${app.id}"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="comment" value=""><button name="status" value="Одобрено" class="btn-ok">Одобрить</button><button name="status" value="Отклонено" class="btn-bad">Отклонить</button></form>`;
        }
        return html + `</div>`;
      };

      html += `<div class="admin-grid">
        <div class="admin-col"><h3>⏳ Текущие заявки</h3>`;
      if (current.length === 0) html += `<p style="text-align:center; color:#666;">Пусто</p>`;
      current.forEach(a => html += renderApp(a));
      
      html += `</div><div class="admin-col"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;"><h3 style="margin:0;">📁 Архив заявок</h3>
        <form action="/admin/clear-archive" method="POST" onsubmit="return confirm('ВЫ УВЕРЕНЫ? Это удалит ВСЕ обработанные заявки навсегда!');"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-bad" style="padding:8px 12px; font-size:12px;">Очистить</button></form>
      </div>`;
      if (archive.length === 0) html += `<p style="text-align:center; color:#666;">Пусто</p>`;
      archive.forEach(a => html += renderApp(a));
      html += `</div></div>`;
    }

    if (tab === 'tasks') {
      const { rows: tasks } = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
      
      html += `
      <div class="card" style="margin-bottom:30px; border-left-color:#6c5ce7;">
        <h3>➕ Выдать новую задачу</h3>
        <form action="/admin/task" method="POST" style="margin-top:15px;">
          <input type="hidden" name="pass" value="${pass}">
          <select name="role" required><option value="" disabled selected hidden>Выберите отдел</option><option>Билдер</option><option>Скриптер</option><option>GUI-дизайнер</option><option>Аниматор</option><option>Тестер</option></select>
          <input name="title" placeholder="Название задачи" required>
          <textarea name="description" placeholder="Описание задачи" rows="2" required></textarea>
          <button type="submit" style="background:#6c5ce7; color:#fff;">Создать задачу</button>
        </form>
      </div><div class="grid">`;
      
      tasks.forEach(task => {
        let badge = 'pending', text = 'Свободна';
        let extra = '';
        if (task.status === 'В работе') { badge = 'taken'; text = 'В работе'; extra = `<p style="font-size:12px; color:#a29bfe; margin-top:5px;">Взял: ${task.taken_by}</p>`; }
        if (task.status === 'Выполнено') { badge = 'approved'; text = 'Выполнено'; extra = `<p style="font-size:12px; color:#55efc4; margin-top:5px;">Сдал: ${task.taken_by}</p>`; }

        html += `<div class="card ${badge}"><div style="display:flex; justify-content:space-between;"><span class="badge ${badge}">${task.role}</span><span class="badge ${badge}">${text}</span></div><h3 style="margin-top:5px;">${task.title}</h3><p style="color:#ccc; font-size:14px;">${task.description}</p>${extra}`;
        if (task.proof_image) {
          html += `<p style="font-size:12px; color:#888; margin-top:10px; margin-bottom:5px;">Доказательство:</p><img src="${task.proof_image}" class="proof-img">`;
        }
        html += `</div>`;
      });
      html += `</div>`;
    }

    html += `<div class="link" style="margin-top:30px;"><a href="/admin?pass=${pass}&tab=${tab}">🔄 Обновить</a></div></div></body></html>`;
    res.send(html);
  } catch (err) { res.send(`<h2 style="color:red;">Ошибка: ${err.message}</h2>`); }
});

// Обновление статуса заявки
app.post('/admin/status', async (req, res) => {
  const { id, status, pass, comment } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query('UPDATE applications SET status = $1, admin_comment = $2 WHERE id = $3', [status, comment || null, id]);
  res.redirect('/admin?pass=' + pass + '&tab=applications'); 
});

// Создание задачи
app.post('/admin/task', async (req, res) => {
  const { role, title, description, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query('INSERT INTO tasks (role, title, description) VALUES ($1, $2, $3)', [role, title, description]);
  res.redirect('/admin?pass=' + pass + '&tab=tasks'); 
});

// Очистка архива (с защитой)
app.post('/admin/clear-archive', async (req, res) => {
  const { pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query("DELETE FROM applications WHERE status != 'На рассмотрении'");
  res.redirect('/admin?pass=' + pass + '&tab=applications');
});

app.listen(PORT, () => console.log('Сервер запущен на порту ' + PORT));
