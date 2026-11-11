const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '526721'; // Пин-код админа

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  
  :root {
    --text: #1f2937; --text-sec: #4b5563; --bg: #f8fafc;
    --glass-bg: rgba(255, 255, 255, 0.85);
    --glass-border: rgba(203, 213, 225, 0.6);
    --glass-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);
    --accent: #0284c7; --danger: #dc2626; --success: #16a34a; --warning: #d97706;
  }

  * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; transition: background-color 0.3s, color 0.3s, border-color 0.3s; }
  
  body { 
    margin: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); color: var(--text); display: flex; justify-content: center; align-items: center; padding: 20px; min-height: 100vh; position: relative; overflow-x: hidden; 
  }

  #bg-canvas { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0; pointer-events: none; opacity: 0.3; }

  .content-wrapper { position: relative; z-index: 10; width: 100%; display: flex; justify-content: center; align-items: center; }

  .glass { 
    background: var(--glass-bg); 
    backdrop-filter: blur(20px); 
    border: 1px solid var(--glass-border); 
    box-shadow: var(--glass-shadow); 
    border-radius: 32px; 
  }

  .dock { display: flex; gap: 8px; padding: 8px; background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid var(--glass-border); border-radius: 20px; box-shadow: var(--glass-shadow); width: fit-content; margin: 0 auto 32px auto; }
  .dock-btn { display: flex; align-items: center; justify-content: center; padding: 0 16px; height: 44px; border-radius: 12px; background: transparent; border: none; cursor: pointer; color: var(--text); transition: all 0.3s; font-size: 14px; font-weight: 500; text-decoration: none; }
  .dock-btn:hover { background: rgba(2,132,199,0.1); transform: scale(1.05); }
  .dock-btn.active { background: rgba(2,132,199,0.2); color: #0284c7; }

  .container { padding: 40px; width: 100%; max-width: 480px; margin: 20px auto; position: relative; z-index: 10; }
  .wide-container { max-width: 1100px; width: 100%; }
  
  h1, h2, h3 { text-align: center; color: var(--text); margin-bottom: 16px; font-weight: 700; letter-spacing: -0.02em; }
  
  @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  .animate-in { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }

  input, select, textarea { 
    width: 100%; padding: 16px; margin-bottom: 16px; 
    background: #ffffff; border: 1px solid #cbd5e1; border-radius: 16px; 
    font-size: 15px; color: var(--text); outline: none; 
  }
  input:focus, select:focus, textarea:focus { border-color: var(--accent); box-shadow: 0 0 15px rgba(2,132,199,0.2); }
  
  button { width: 100%; padding: 16px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #fff; border: none; border-radius: 16px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 20px rgba(2,132,199,0.3); }
  button:hover { transform: translateY(-2px); box-shadow: 0 6px 25px rgba(2,132,199,0.5); }

  .link { text-align: center; margin-top: 24px; font-size: 14px; }
  .link a { color: var(--text-sec); text-decoration: none; transition: color 0.2s; }
  .link a:hover { color: var(--accent); }
  
  .alert { padding: 16px; border-radius: 16px; margin-bottom: 20px; text-align: center; font-size: 14px; background: rgba(220,38,38,0.1); color: var(--danger); border: 1px solid rgba(220,38,38,0.2); }
  
  .card { 
    padding: 24px; border-radius: 24px; margin-bottom: 16px; 
    background: var(--glass-bg); backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow);
  }
  
  .badge { display: inline-block; padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
  .badge.pending { color: var(--warning); background: rgba(217,119,6,0.1); border: 1px solid rgba(217,119,6,0.3); }
  .badge.approved { color: var(--success); background: rgba(22,163,74,0.1); border: 1px solid rgba(22,163,74,0.3); }
  .badge.rejected { color: var(--danger); background: rgba(220,38,38,0.1); border: 1px solid rgba(220,38,38,0.3); }

  .main-menu { display: grid; grid-template-columns: 1fr; gap: 16px; width: 100%; max-width: 600px; margin: 0 auto; }
  .menu-panel { padding: 30px; display: flex; flex-direction: column; align-items: center; text-align: center; text-decoration: none; color: var(--text); border-radius: 28px; background: var(--glass-bg); border: 1px solid var(--glass-border); transition: all 0.3s; box-shadow: var(--glass-shadow); }
  .menu-panel:hover { transform: translateY(-4px); border-color: var(--accent); box-shadow: 0 10px 30px rgba(2,132,199,0.2); }
  .menu-panel h2 { font-size: 22px; margin-bottom: 8px; }
  .menu-panel p { color: var(--text-sec); font-size: 15px; margin: 0; }

  .grid { display: grid; grid-template-columns: 1fr; gap: 16px; } 
  @media (min-width: 768px) { .grid { grid-template-columns: 1fr 1fr; } }
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
  @media (min-width: 768px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
  .stat-card { background: var(--glass-bg); border: 1px solid var(--glass-border); padding: 24px; border-radius: 24px; text-align: center; box-shadow: var(--glass-shadow); }
  .stat-val { font-size: 36px; font-weight: 800; color: var(--text); line-height: 1; margin-bottom: 8px; }
  .stat-lbl { font-size: 13px; color: var(--text-sec); font-weight: 500; }
`;

const scripts = `
  <canvas id="bg-canvas"></canvas>
  <script>
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let width, height, mouse = { x: -1000, y: -1000 }, cubes = [];
    const spacing = 70, cubeSize = 18;

    function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; initCubes(); }
    function initCubes() { cubes = []; for (let x = spacing/2; x < width; x += spacing) { for (let y = spacing/2; y < height; y += spacing) { cubes.push({ x, y, baseX: x, baseY: y, vx: 0, vy: 0, phase: Math.random() * Math.PI * 2, speed: 0.001 + Math.random() * 0.002 }); } } }
    
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

    function animate(time) {
      ctx.clearRect(0, 0, width, height);
      cubes.forEach(cube => {
        let targetX = cube.baseX + Math.sin(time * cube.speed + cube.phase) * 6;
        let targetY = cube.baseY + Math.cos(time * cube.speed + cube.phase) * 6;
        let dx = mouse.x - cube.x, dy = mouse.y - cube.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) { let force = (150 - dist) / 150; targetX -= (dx / dist) * force * 25; targetY -= (dy / dist) * force * 25; }
        cube.vx += (targetX - cube.x) * 0.05; cube.vy += (targetY - cube.y) * 0.05; cube.vx *= 0.8; cube.vy *= 0.8; cube.x += cube.vx; cube.y += cube.vy;
        
        ctx.fillStyle = 'rgba(2, 132, 199, 0.08)'; 
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.2)'; 
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
  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Кабинет сотрудника</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container wide-container animate-in">
    <div class="dock">
      <a href="/" onclick="localStorage.removeItem('saved_username'); localStorage.removeItem('saved_password');" class="dock-btn">Выйти</a>
    </div>
    <div style="text-align:center; margin-bottom:32px;">
      <h2 style="margin:0;">Привет, ${user.name}!</h2>
      <p style="color:var(--text-sec); font-size:15px; margin-top:8px;">Роль: ${user.role} · Статус: <b style="color:var(--success);">В команде</b></p>
    </div>
    ${message ? `<div class="alert" style="background:rgba(22,163,74,0.1); color:var(--success); border-color:rgba(22,163,74,0.2);">${message}</div>` : ''}
    <div class="card animate-in" style="text-align:center; padding:40px;">
      <h3>Добро пожаловать в команду разработки «Выжить в Антарктиде»!</h3>
      <p style="color:var(--text-sec);">Твоя заявка одобрена.</p>
    </div>
  </div></div></body></html>`;
  res.send(html);
};

app.get('/', (req, res) => { 
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Выжить в Антарктиде</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="main-menu"><a href="/apply" class="menu-panel animate-in"><h2>Подать заявку</h2><p>Стать частью команды разработчиков игры</p></a><a href="/login" class="menu-panel animate-in" style="margin-top:16px;"><h2>Вход для сотрудников</h2><p>Войти в личный кабинет</p></a><a href="/check-status" class="menu-panel animate-in" style="margin-top:16px;"><h2>Проверка статуса</h2><p>Узнать результаты рассмотрения анкеты</p></a></div></div></body></html>`); 
});

app.get('/apply', (req, res) => { 
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Подать заявку</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="margin-bottom:24px;">Заявка в команду</h2>${req.query.error ? '<div class="alert">Заполните все обязательные поля!</div>' : ''}<form action="/apply" method="POST">
    <input name="name" placeholder="Ваше Имя" required>
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
    <input name="username" placeholder="Придумайте логин" required>
    <input name="password" type="password" placeholder="Придумайте пароль" required>
    <button type="submit">Отправить заявку</button>
  </form><div class="link"><a href="/">← На главную</a></div></div></div></body></html>`); 
});

app.post('/apply', async (req, res) => { 
  const { name, location, roblox, discord, tiktok, role, username, password } = req.body; 
  if (!name || !location || !roblox || !discord || !role || !username || !password) return res.redirect('/apply?error=1'); 
  try { 
    await pool.query(`INSERT INTO applications (name, location, roblox_nick, discord, tiktok, role, username, password, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'На рассмотрении')`, [name, location, roblox, discord, tiktok || 'Не указан', role, username.trim(), password.trim()]); 
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="color:var(--success);">Успешно!</h2><p style="color:var(--text-sec); text-align:center; margin-bottom:24px;">Ваша анкета отправлена разработчику.</p><div class="link"><a href="/">← На главную</a></div></div></div></body></html>`); 
  } catch (err) { 
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="color:var(--danger);">Ошибка</h2><div class="alert">Этот логин уже занят другим пользователем.</div><div class="link"><a href="/apply">← Назад</a></div></div></div></body></html>`); 
  } 
});

app.get('/login', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Вход</title><style>${css}</style></head><body>${scripts}
  <script>
    const savedUser = localStorage.getItem('saved_username');
    const savedPass = localStorage.getItem('saved_password');
    if (savedUser && savedPass) {
      document.write('<div style="text-align:center; color:var(--text); padding:50px;"><h2>Автоматический вход...</h2></div>');
      const form = document.createElement('form');
      form.method = 'POST'; form.action = '/dashboard';
      const uInput = document.createElement('input'); uInput.type = 'hidden'; uInput.name = 'username'; uInput.value = savedUser;
      const pInput = document.createElement('input'); pInput.type = 'hidden'; pInput.name = 'password'; pInput.value = savedPass;
      form.appendChild(uInput); form.appendChild(pInput);
      document.body.appendChild(form); form.submit();
    }
  </script>
  <div class="content-wrapper"><div class="container glass animate-in"><h2 style="text-align:center; margin-bottom:24px;">Вход для сотрудников</h2><form action="/dashboard" method="POST" onsubmit="saveCredentials()"><input id="u_name" name="username" placeholder="Логин" required><input id="u_pass" name="password" type="password" placeholder="Пароль" required><button type="submit">Войти в кабинет</button></form><div class="link"><a href="/">← На главную</a></div></div></div>
  <script>
    function saveCredentials() {
      localStorage.setItem('saved_username', document.getElementById('u_name').value);
      localStorage.setItem('saved_password', document.getElementById('u_pass').value);
    }
  </script>
  </body></html>`);
});

app.post('/dashboard', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2', [username, password]);
    if (rows.length === 0) {
      return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2>Ошибка</h2><div class="alert">Неверный логин или пароль.<br><br><a href="/" onclick="localStorage.clear();" style="color:var(--accent);">Сбросить авто-вход и на главную</a></div><div class="link"><a href="/login">← Назад</a></div></div></div></body></html>`);
    }
    const user = rows[0];
    if (user.status !== 'Одобрено') {
      return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2>Доступ ограничен</h2><div class="alert">Ваша заявка еще не одобрена или отклонена.</div><div class="link"><a href="/" onclick="localStorage.clear();">← На главную</a></div></div></div></body></html>`);
    }
    await renderDashboard(user, res);
  } catch (err) {
    res.status(500).send('Ошибка сервера: ' + err.message);
  }
});

app.get('/check-status', (req, res) => { 
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Статус заявки</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="margin-bottom:24px;">Проверка статуса</h2><form action="/check-status" method="POST"><input name="username" placeholder="Ваш логин" required><input name="password" type="password" placeholder="Ваш пароль" required><button type="submit">Проверить</button></form><div class="link"><a href="/">← На главную</a></div></div></div></body></html>`); 
});

app.post('/check-status', async (req, res) => { 
  const username = (req.body.username || '').trim(); 
  const password = (req.body.password || '').trim(); 
  try { 
    const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2', [username, password]); 
    if (rows.length === 0) { 
      return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2>Ошибка</h2><div class="alert">Неверный логин или пароль.</div><div class="link"><a href="/check-status">← Назад</a></div></div></div></body></html>`); 
    } 
    const data = rows[0]; 
    let statusText = 'На рассмотрении ⏳', cardClass = 'pending'; 
    if (data.status === 'Одобрено') { statusText = 'Одобрено ✅ Добро пожаловать в команду!'; cardClass = 'approved'; } 
    if (data.status === 'Отклонено') { statusText = 'Отклонено ❌'; cardClass = 'rejected'; } 
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2>Ваша заявка</h2><div class="card ${cardClass}" style="margin-top:24px;"><span class="badge ${cardClass}">${statusText}</span><p style="margin:12px 0 8px;"><b>Имя:</b> ${data.name}</p><p style="margin:0 0 16px;"><b>Роль:</b> ${data.role}</p></div><div class="link"><a href="/check-status">← Назад</a></div></div></div></body></html>`); 
  } catch (err) { 
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2>Ошибка</h2><div class="alert">${err.message}</div><div class="link"><a href="/check-status">← Назад</a></div></div></div></body></html>`); 
  } 
});

app.get('/admin', async (req, res) => { 
  const pass = req.query.pass; 
  if (pass !== ADMIN_PASSWORD) {
    return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in" style="max-width:380px; margin-top:120px;"><h2 style="text-align:center;">Админ-панель</h2><p style="text-align:center; font-size:12px; color:var(--text-sec); margin-bottom:16px;">Пин-код: 526721</p><form><input name="pass" type="password" placeholder="Введите пин-код" required><button type="submit">Войти</button></form><div class="link" style="margin-top:16px;"><a href="/">← На главную</a></div></div></div></body></html>`); 
  }
  try { 
    const stats = await pool.query(`SELECT (SELECT COUNT(*) FROM applications WHERE status = 'Одобрено') as workers, (SELECT COUNT(*) FROM applications WHERE status = 'На рассмотрении') as new_apps`); 
    const s = stats.rows[0]; 
    const { rows: apps } = await pool.query('SELECT * FROM applications ORDER BY id DESC');
    
    let html = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container wide-container animate-in"><div class="dock"><a href="/" class="dock-btn">На главную</a></div><h2 style="text-align:center; margin-bottom:32px;">Панель Администратора</h2>`;
    html += `<div class="stats-grid animate-in"><div class="stat-card"><div class="stat-val">${s.workers}</div><div class="stat-lbl">В команде</div></div><div class="stat-card"><div class="stat-val">${s.new_apps}</div><div class="stat-lbl">Новых заявок</div></div></div>`;
    html += `<h3 style="text-align:left; margin-top:32px;">Все заявки кандидатов</h3>`;
    
    apps.forEach(app => {
      let bClass = 'pending';
      if (app.status === 'Одобрено') bClass = 'approved';
      if (app.status === 'Отклонено') bClass = 'rejected';
      
      html += `<div class="card animate-in"><div style="display:flex; justify-content:space-between; align-items:center;"><span class="badge ${bClass}">${app.status}</span><span style="font-size:13px; color:var(--text-sec);">${app.role}</span></div><h3 style="text-align:left; margin:8px 0;">${app.name}</h3><p style="margin:4px 0; color:var(--text-sec); font-size:14px;">📍 ${app.location} | Roblox: <b>${app.roblox_nick}</b> | Discord: <b>${app.discord}</b> | TikTok: <b>${app.tiktok || 'Не указан'}</b></p><div style="display:flex; gap:8px; margin-top:16px;"><form action="/admin/status" method="POST" style="flex:1;"><input type="hidden" name="id" value="${app.id}"><input type="hidden" name="status" value="Одобрено"><input type="hidden" name="pass" value="${pass}"><button type="submit" style="background:var(--success); padding:10px;">Принять ✅</button></form><form action="/admin/status" method="POST" style="flex:1;"><input type="hidden" name="id" value="${app.id}"><input type="hidden" name="status" value="Отклонено"><input type="hidden" name="pass" value="${pass}"><button type="submit" style="background:var(--danger); padding:10px;">Отклонить ❌</button></form></div></div>`;
    });

    html += `</div></div></body></html>`;
    res.send(html);
  } catch (err) { 
    res.status(500).send('Ошибка сервера: ' + err.message); 
  } 
});

app.post('/admin/status', async (req, res) => {
  const { id, status, pass } = req.body;
  try {
    await pool.query('UPDATE applications SET status = $1 WHERE id = $2', [status, id]);
    res.redirect(`/admin?pass=${pass}`);
  } catch (err) {
    res.status(500).send('Ошибка обновления');
  }
});

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
