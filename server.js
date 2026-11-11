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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  :root {
    --bg: #000000; --text: #ededed; --muted: #888888; --border: #222222; 
    --card: #0a0a0a; --accent: #ffffff; --success: #10b981; --danger: #ef4444; --warning: #f59e0b;
  }
  [data-theme="light"] {
    --bg: #ffffff; --text: #000000; --muted: #666666; --border: #e5e5e5; 
    --card: #fafafa; --accent: #000000; --success: #059669; --danger: #dc2626; --warning: #d97706;
  }

  * { box-sizing: border-box; font-family: 'Inter', sans-serif; transition: background-color 0.2s, color 0.2s, border-color 0.2s; -webkit-font-smoothing: antialiased; }
  
  body { 
    margin: 0; background: var(--bg); color: var(--text); display: flex; justify-content: center; align-items: center; padding: 20px; min-height: 100vh; 
    position: relative; overflow-x: hidden; 
    /* Точечная сетка на фоне */
    background-image: radial-gradient(var(--border) 1px, transparent 1px);
    background-size: 32px 32px;
  }
  
  /* Мягкое свечение за курсором */
  #cursor-glow { position: fixed; width: 600px; height: 600px; background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 60%); border-radius: 50%; pointer-events: none; z-index: -1; transform: translate(-50%, -50%); }
  [data-theme="light"] #cursor-glow { background: radial-gradient(circle, rgba(0,0,0,0.03) 0%, transparent 60%); }

  .theme-toggle { position: fixed; top: 24px; right: 24px; background: var(--card); border: 1px solid var(--border); color: var(--text); width: 44px; height: 44px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 100; font-size: 18px; transition: all 0.2s; }
  .theme-toggle:hover { border-color: var(--muted); }

  .glass { background: var(--card); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
  .container { padding: 48px; width: 100%; max-width: 480px; margin: 40px auto; position: relative; z-index: 1; }
  .wide-container { max-width: 1100px; width: 100%; }
  
  h1, h2, h3 { text-align: left; color: var(--text); margin-bottom: 24px; font-weight: 600; letter-spacing: -0.04em; }
  h1 { font-size: 32px; } h2 { font-size: 24px; } h3 { font-size: 18px; }
  
  /* Плавные анимации появления */
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
  .delay-1 { animation-delay: 0.1s; } .delay-2 { animation-delay: 0.2s; } .delay-3 { animation-delay: 0.3s; }

  input, select, textarea { width: 100%; padding: 16px; margin-bottom: 16px; background: transparent; border: 1px solid var(--border); border-radius: 12px; font-size: 14px; color: var(--text); outline: none; }
  input:focus, select:focus { border-color: var(--muted); }
  
  button { width: 100%; padding: 16px; background: var(--text); color: var(--bg); border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  button:hover { opacity: 0.8; transform: scale(0.99); }
  
  .link { text-align: center; margin-top: 24px; font-size: 13px; }
  .link a { color: var(--muted); text-decoration: none; transition: color 0.2s; }
  .link a:hover { color: var(--text); }
  
  .alert { padding: 16px; border-radius: 12px; margin-bottom: 24px; text-align: center; font-size: 13px; background: transparent; color: var(--danger); border: 1px solid var(--danger); }
  
  .card { padding: 24px; border-radius: 16px; margin-bottom: 16px; background: var(--card); border: 1px solid var(--border); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); position: relative; }
  .card:hover { border-color: var(--muted); transform: translateY(-2px); }
  
  /* Строгие индикаторы */
  .card::before { content: ''; position: absolute; left: 0; top: 24px; bottom: 24px; width: 2px; border-radius: 0 4px 4px 0; background: var(--border); }
  .card.approved::before { background: var(--success); } .card.rejected::before { background: var(--danger); }
  .card.pending::before { background: var(--warning); } .card.taken::before { background: var(--text); }
  
  .badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; background: transparent; border: 1px solid var(--border); color: var(--muted); }
  .badge.approved { border-color: var(--success); color: var(--success); }
  .badge.rejected { border-color: var(--danger); color: var(--danger); }
  .badge.pending { border-color: var(--warning); color: var(--warning); }
  
  .btn-ok { background: var(--text); color: var(--bg); width: auto; padding: 8px 16px; font-size: 12px; margin-right: 8px; border-radius: 8px; border: 1px solid var(--text); }
  .btn-bad { background: transparent; color: var(--danger); border: 1px solid var(--danger); width: auto; padding: 8px 16px; font-size: 12px; border-radius: 8px; }
  .btn-purple { background: var(--text); color: var(--bg); width: auto; padding: 10px 20px; font-size: 13px; border-radius: 8px; }
  .btn-del { background: transparent; color: var(--muted); border: 1px solid var(--border); width: auto; padding: 6px 10px; font-size: 12px; border-radius: 8px; cursor: pointer; }
  .btn-del:hover { border-color: var(--danger); color: var(--danger); }
  
  .tabs { display: flex; justify-content: center; gap: 4px; margin-bottom: 32px; background: transparent; padding: 4px; border-radius: 12px; border: 1px solid var(--border); width: fit-content; margin-left: auto; margin-right: auto; overflow-x: auto; max-width: 100%; }
  .tab-btn { background: transparent; color: var(--muted); width: auto; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 13px; white-space: nowrap; border: 1px solid transparent; }
  .tab-btn.active { background: var(--card); color: var(--text); border-color: var(--border); }
  .tab-btn:hover:not(.active) { color: var(--text); }

  .main-menu { display: grid; grid-template-columns: 1fr; gap: 16px; width: 100%; max-width: 600px; margin: 0 auto; }
  .menu-panel { padding: 40px; display: flex; flex-direction: column; align-items: flex-start; text-align: left; text-decoration: none; color: var(--text); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; border-radius: 16px; background: var(--card); border: 1px solid var(--border); }
  .menu-panel:hover { transform: translateY(-4px); border-color: var(--muted); }
  .menu-panel h2 { font-size: 20px; margin-bottom: 8px; }
  .menu-panel p { color: var(--muted); font-size: 14px; margin-bottom: 0; }
  .menu-btn-style { display: none; } /* Убрали кнопки внутри, теперь вся карточка кликабельна */

  .grid { display: grid; grid-template-columns: 1fr; gap: 16px; } 
  @media (min-width: 768px) { .grid { grid-template-columns: 1fr 1fr; } }
  .admin-grid { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start; }
  @media (min-width: 900px) { .admin-grid { grid-template-columns: 1fr 1fr; } }
  .admin-col { background: transparent; padding: 0; border-radius: 0; border: none; }
  
  .proof-img { max-width: 100%; border-radius: 12px; margin-top: 12px; border: 1px solid var(--border); }
  .worker-row { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: var(--card); border-radius: 12px; margin-bottom: 12px; border: 1px solid var(--border); }
  
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
  @media (min-width: 768px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
  .stat-card { background: var(--card); border: 1px solid var(--border); padding: 24px; border-radius: 16px; text-align: left; }
  .stat-val { font-size: 36px; font-weight: 700; color: var(--text); line-height: 1; margin-bottom: 8px; letter-spacing: -0.05em; }
  .stat-lbl { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; }

  .comments-box { margin-top: 16px; padding: 16px; background: transparent; border: 1px solid var(--border); border-radius: 12px; font-size: 13px; }
  .announcement { background: var(--card); border: 1px solid var(--border); padding: 24px; border-radius: 16px; margin-bottom: 24px; }
  .announcement h3 { margin: 0 0 8px 0; text-align: left; font-size: 16px; color: var(--text); }
  .announcement p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.5; }
  
  .progress-bar { width: 100%; height: 4px; background: var(--border); border-radius: 2px; margin-top: 16px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--text); border-radius: 2px; transition: width 0.5s; }

  .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 10000; justify-content: center; align-items: center; padding: 20px; }
  .modal-content { background: var(--card); border: 1px solid var(--border); border-radius: 20px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; position: relative; padding: 32px; box-shadow: 0 24px 64px rgba(0,0,0,0.4); animation: fadeIn 0.3s ease; }
  .modal-close { position: absolute; top: 24px; right: 24px; background: transparent; border: 1px solid var(--border); color: var(--muted); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
  .modal-close:hover { border-color: var(--text); color: var(--text); }
  .modal-row { margin-bottom: 16px; font-size: 14px; display: flex; flex-direction: column; }
  .modal-label { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; font-weight: 600; }
  .modal-value { font-weight: 500; color: var(--text); font-size: 15px; }
`;

const scripts = `
  <div id="preloader" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;z-index:9999;display:flex;flex-direction:column;justify-content:center;align-items:center;"><div class="title-container" id="title-container" style="display:flex;gap:2px;"></div></div>
  <div id="cursor-glow"></div>
  <button class="theme-toggle" onclick="toggleTheme()" id="theme-btn">🌙</button>

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

    // Свечение за курсором
    const glow = document.getElementById('cursor-glow');
    window.addEventListener('mousemove', (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    });

    // Прелоадер
    if (!sessionStorage.getItem('preloaderShown')) {
      const titleText = "SURVIVAL IN ANTARCTICA";
      const container = document.getElementById('title-container');
      titleText.split('').forEach((char, index) => {
        if (char === ' ') { const space = document.createElement('span'); space.innerHTML = '&nbsp;'; container.appendChild(space); } 
        else {
          const span = document.createElement('span'); span.textContent = char; 
          span.style.cssText = "color:#fff;font-size:clamp(20px,4vw,36px);font-weight:600;display:inline-block;opacity:0;transform:translateY(20px);transition:all 0.8s cubic-bezier(0.16,1,0.3,1);";
          container.appendChild(span);
          setTimeout(() => span.style.cssText += "opacity:1;transform:translateY(0);", 100 + index * 40);
        }
      });
      setTimeout(() => { document.getElementById('preloader').style.opacity = '0'; setTimeout(() => document.getElementById('preloader').remove(), 800); sessionStorage.setItem('preloaderShown', 'true'); }, 2500);
    } else { document.getElementById('preloader').remove(); }

    function openModal(id) { document.getElementById('modal-' + id).style.display = 'flex'; }
    function closeModal(id) { document.getElementById('modal-' + id).style.display = 'none'; }
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

  let html = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container wide-container animate-in">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px;">
      <div>
        <h2 style="margin:0; font-size:28px;">${user.name}</h2>
        <p style="color:var(--muted); font-size:14px; margin-top:4px;">${user.role} · Очков: <b style="color:var(--warning);">${user.points}</b></p>
      </div>
      <div style="display:flex; gap:12px;">
        <button onclick="document.getElementById('settings-modal').style.display='flex'" style="width:auto; padding:10px 16px; background:transparent; border:1px solid var(--border); color:var(--text);">Настройки</button>
        <a href="/" style="text-decoration:none;"><button style="width:auto; padding:10px 16px; background:var(--text); color:var(--bg);">Выйти</button></a>
      </div>
    </div>
    
    ${message ? `<div class="alert" style="background:transparent; color:var(--success); border-color:var(--success);">${message}</div>` : ''}
    ${announcement}

    <div class="grid">`;
  
  if (tasks.length === 0) html += `<p style="text-align:center; color:var(--muted); grid-column: 1/-1; padding:40px;">Для вашего отдела пока нет активных задач.</p>`;
  else {
    tasks.forEach((task, i) => {
      let badgeClass = 'pending', badgeText = 'Свободна';
      let actionHtml = '';
      let deadlineHtml = '';
      
      if (task.deadline) {
        const d = new Date(task.deadline).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        deadlineHtml = `<p style="font-size:12px; color:var(--danger); margin-bottom:16px; font-weight:500;">⏰ ${d}</p>`;
      }

      if (task.status === 'Свободна') {
        actionHtml = `<form action="/task/take" method="POST"><input type="hidden" name="task_id" value="${task.id}"><input type="hidden" name="username" value="${user.username}"><input type="hidden" name="password" value="${user.password}"><button type="submit" class="btn-purple" style="width:100%;">Взять задачу</button></form>`;
      } else if (task.status === 'В работе') {
        if (task.taken_by === user.username) {
          badgeClass = 'taken'; badgeText = 'В работе';
          actionHtml = `<form action="/task/done" method="POST" enctype="multipart/form-data" style="margin-top:16px;"><input type="hidden" name="task_id" value="${task.id}"><input type="hidden" name="username" value="${user.username}"><input type="hidden" name="password" value="${user.password}"><input type="file" name="proof" required style="padding:12px; font-size:13px; margin-bottom:12px; background:transparent; border:1px dashed var(--border); color:var(--text);"><button type="submit" class="btn-ok" style="width:100%;">Отправить на проверку</button></form>`;
        } else {
          badgeClass = 'taken'; badgeText = 'В работе';
          actionHtml = `<p style="color:var(--muted); font-size:13px; font-weight:500; padding-top:12px; border-top:1px solid var(--border); margin-top:12px;">Взял: ${task.taken_by}</p>`;
        }
      } else if (task.status === 'Выполнено') {
        badgeClass = 'approved'; badgeText = 'На проверке';
        actionHtml = `<p style="color:var(--success); font-size:13px; font-weight:500; padding-top:12px; border-top:1px solid var(--border); margin-top:12px;">Сдал: ${task.taken_by}</p>`;
      }

      html += `<div class="card ${badgeClass} animate-in delay-${Math.min(i+1, 3)}"><span class="badge ${badgeClass}">${badgeText}</span><h3 style="margin-top:0; text-align:left;">${task.title}</h3>${deadlineHtml}<p style="color:var(--muted); font-size:14px; margin-bottom:20px;">${task.description}</p>${actionHtml}`;
      
      if (task.comments) {
        html += `<div class="comments-box"><b>Чат:</b><br><span style="color:var(--muted)">${task.comments.replace(/\n/g, '<br>')}</span></div>`;
      }
      html += `</div>`;
    });
  }
  
  html += `</div>
  <div id="settings-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); z-index:10000; justify-content:center; align-items:center;">
    <div class="modal-content">
      <button class="modal-close" onclick="document.getElementById('settings-modal').style.display='none'">✕</button>
      <h3 style="text-align:left; margin-bottom:24px;">Сменить пароль</h3>
      <form action="/change-password" method="POST">
        <input type="hidden" name="username" value="${user.username}">
        <input type="password" name="old_password" placeholder="Старый пароль" required>
        <input type="password" name="new_password" placeholder="Новый пароль" required>
        <button type="submit" class="btn-purple" style="width:100%;">Обновить</button>
      </form>
    </div>
  </div>
  </div></body></html>`;
  res.send(html);
};

// --- РОУТЫ ---

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Survival in Antarctica</title><style>${css}</style></head><body>${scripts}
  <div class="main-menu">
    <a href="/login" class="menu-panel animate-in delay-1"><h2>Сотрудникам →</h2><p>Вход в кабинет для получения задач и сдачи проектов.</p></a>
    <a href="/apply" class="menu-panel animate-in delay-2"><h2>Соискателям →</h2><p>Подать заявку в команду на одну из открытых должностей.</p></a>
    <a href="/check-status" class="menu-panel animate-in delay-3"><h2>Проверка статуса →</h2><p>Узнать, рассмотрели ли вашу заявку и приняли ли в команду.</p></a>
  </div></body></html>`);
});

app.get('/apply', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Подать заявку</title><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2 style="text-align:left; margin-bottom:24px;">Заявка в команду</h2>${req.query.error ? '<div class="alert">Заполните все обязательные поля!</div>' : ''}<form action="/apply" method="POST"><input name="name" placeholder="Ваше имя" required><input name="location" placeholder="Страна / Город" required><input name="roblox" placeholder="Ник в Roblox" required><input name="discord" placeholder="Discord" required><input name="telegram" placeholder="Telegram (необязательно)"><select name="role" required><option value="" disabled selected hidden>Кем вы хотите быть?</option><option>Билдер</option><option>Скриптер</option><option>GUI-дизайнер</option><option>Аниматор</option><option>Тестер</option></select><input name="username" placeholder="Логин для входа" required><input name="password" type="password" placeholder="Пароль для входа" required><button type="submit">Отправить заявку</button></form><div class="link"><a href="/">← На главную</a></div></div></body></html>`);
});

app.post('/apply', async (req, res) => {
  const { name, location, roblox, discord, telegram, role, username, password } = req.body;
  if (!name || !location || !roblox || !discord || !role || !username || !password) return res.redirect('/apply?error=1');
  try {
    await pool.query(`INSERT INTO applications (name, location, roblox_nick, discord, telegram, role, username, password, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'На рассмотрении')`, [name, location, roblox, discord, telegram || null, role, username.trim(), password.trim()]);
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2 style="color:var(--success); text-align:left;">✅ Успешно!</h2><p style="color:var(--muted); margin-bottom:24px;">Заявка отправлена. Мы свяжемся с вами после рассмотрения.</p><div class="link" style="text-align:left;"><a href="/">← На главную</a></div></div></body></html>`);
  } catch (err) { res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2 style="color:var(--danger); text-align:left;">Ошибка</h2><div class="alert">Этот логин уже занят.</div><div class="link" style="text-align:left;"><a href="/apply">← Назад</a></div></div></body></html>`); }
});

app.get('/check-status', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Статус заявки</title><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2 style="text-align:left; margin-bottom:24px;">Статус заявки</h2><form action="/check-status" method="POST"><input name="username" placeholder="Логин" required><input name="password" type="password" placeholder="Пароль" required><button type="submit">Проверить</button></form><div class="link"><a href="/">← На главную</a></div></div></body></html>`);
});

app.post('/check-status', async (req, res) => {
  const username = (req.body.username || '').trim();
  const password = (req.body.password || '').trim();
  
  try {
    const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2 AND is_deleted = false', [username, password]);
    
    if (rows.length === 0) {
      return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2 style="text-align:left;">Ошибка</h2><div class="alert">Неверный логин или пароль.</div><div class="link" style="text-align:left;"><a href="/check-status">← Назад</a></div></div></body></html>`);
    }
    
    const data = rows[0];
    let statusText = 'На рассмотрении', cardClass = 'pending', extraText = '';
    
    if (data.status === 'Одобрено') { 
      statusText = 'Одобрено. Добро пожаловать в команду.'; 
      cardClass = 'approved'; 
    }
    if (data.status === 'Отклонено') { 
      statusText = 'Отклонено.'; 
      cardClass = 'rejected'; 
    }

    if (data.admin_comment) {
      extraText = `<div class="comments-box" style="color:var(--danger); margin-top:16px;"><b>Комментарий куратора:</b><br>${data.admin_comment}</div>`;
    }

    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2 style="text-align:left;">Ваша заявка</h2><div class="card ${cardClass}" style="margin-top:24px;"><span class="badge ${cardClass}">${statusText}</span><p style="margin:12px 0 8px;"><b>Имя:</b> ${data.name}</p><p style="margin:0 0 16px;"><b>Роль:</b> ${data.role}</p>${extraText}</div><div class="link" style="text-align:left;"><a href="/check-status">← Назад</a></div></div></body></html>`);
  } catch (err) {
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2 style="text-align:left;">Ошибка</h2><div class="alert">${err.message}</div><div class="link" style="text-align:left;"><a href="/check-status">← Назад</a></div></div></body></html>`);
  }
});

app.get('/login', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Вход</title><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2 style="text-align:left; margin-bottom:24px;">Вход для сотрудников</h2><form action="/dashboard" method="POST"><input name="username" placeholder="Логин" required><input name="password" type="password" placeholder="Пароль" required><button type="submit">Войти в кабинет</button></form><div class="link"><a href="/">← На главную</a></div></div></body></html>`);
});

app.post('/dashboard', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2 AND is_deleted = false', [username, password]);
    if (rows.length === 0) return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2 style="text-align:left;">Ошибка</h2><div class="alert">Неверный логин или пароль.</div><div class="link" style="text-align:left;"><a href="/login">← Назад</a></div></div></body></html>`);
    const user = rows[0];
    if (user.status !== 'Одобрено') return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in"><h2 style="text-align:left;">Доступ закрыт</h2><div class="alert">Ваша заявка еще не одобрена.</div><div class="link" style="text-align:left;"><a href="/">← На главную</a></div></div></body></html>`);
    await renderDashboard(user, res);
  } catch (err) { res.status(500).send('Ошибка сервера'); }
});

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

app.post('/task/done', (req, res) => {
  let chunks = []; req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    const buffer = Buffer.concat(chunks); const boundary = req.headers['content-type'].split('boundary=')[1]; const parts = buffer.toString('binary').split('--' + boundary);
    let task_id, username, password, proofBase64 = '', filename = 'file';
    for (let part of parts) {
      if (part.includes('name="task_id"')) task_id = part.split('\r\n\r\n')[1].split('\r\n')[0];
      if (part.includes('name="username"')) username = part.split('\r\n\r\n')[1].split('\r\n')[0];
      if (part.includes('name="password"')) password = part.split('\r\n\r\n')[1].split('\r\n')[0];
      if (part.includes('name="proof"')) {
        const nameMatch = part.match(/filename="(.*)"/); if (nameMatch) filename = nameMatch[1];
        const matches = part.match(/Content-Type: (.*)\r\n\r\n([\s\S]*)\r\n$/);
        if (matches) { proofBase64 = `data:${matches[1]};base64,${Buffer.from(matches[2], 'binary').toString('base64')}`; }
      }
    }
    if (task_id && username) {
      await pool.query("UPDATE tasks SET status = 'Выполнено', completed_at = NOW(), proof_file = $1, proof_filename = $2 WHERE id = $3 AND taken_by = $4", [proofBase64, filename, task_id, username]);
      const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2', [username, password]);
      await renderDashboard(rows[0], res);
    } else { res.redirect('/login'); }
  });
});

app.get('/admin', async (req, res) => {
  const pass = req.query.pass; const tab = req.query.tab || 'dash'; const search = req.query.search || '';
  if (pass !== ADMIN_PASSWORD) return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container glass animate-in" style="max-width:380px; margin-top:120px;"><h2 style="text-align:left;">Вход для админа</h2><form><input name="pass" type="password" placeholder="Пароль" required><button type="submit">Войти</button></form></div></body></html>`);
  try {
    const stats = await pool.query(`SELECT (SELECT COUNT(*) FROM applications WHERE status = 'Одобрено' AND is_deleted = false) as workers, (SELECT COUNT(*) FROM applications WHERE status = 'На рассмотрении' AND is_deleted = false) as new_apps, (SELECT COUNT(*) FROM tasks WHERE status = 'В работе') as in_work, (SELECT COUNT(*) FROM tasks WHERE status = 'Выполнено') as on_review`);
    const s = stats.rows[0];
    let html = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${scripts}<div class="container wide-container animate-in"><h2 style="text-align:left; margin-bottom:32px;">Админ-панель</h2><div class="tabs"><a href="/admin?pass=${pass}&tab=dash" class="tab-btn ${tab === 'dash' ? 'active' : ''}">Обзор</a><a href="/admin?pass=${pass}&tab=announcements" class="tab-btn ${tab === 'announcements' ? 'active' : ''}">Объявления</a><a href="/admin?pass=${pass}&tab=tasks" class="tab-btn ${tab === 'tasks' ? 'active' : ''}">Задачи</a><a href="/admin?pass=${pass}&tab=applications" class="tab-btn ${tab === 'applications' ? 'active' : ''}">Заявки</a><a href="/admin?pass=${pass}&tab=workers" class="tab-btn ${tab === 'workers' ? 'active' : ''}">Сотрудники</a><a href="/admin?pass=${pass}&tab=trash" class="tab-btn ${tab === 'trash' ? 'active' : ''}">Корзина</a></div>`;
    
    if (tab === 'dash') {
      html += `<div class="stats-grid animate-in delay-1"><div class="stat-card"><div class="stat-val">${s.workers}</div><div class="stat-lbl">Сотрудников</div></div><div class="stat-card"><div class="stat-val">${s.new_apps}</div><div class="stat-lbl">Новых заявок</div></div><div class="stat-card"><div class="stat-val">${s.in_work}</div><div class="stat-lbl">В работе</div></div><div class="stat-card"><div class="stat-val">${s.on_review}</div><div class="stat-lbl">На проверке</div></div></div>`;
      const totalTasks = parseInt(s.in_work) + parseInt(s.on_review); const progress = totalTasks === 0 ? 0 : Math.round((s.on_review / totalTasks) * 100);
      html += `<div class="card animate-in delay-2"><div style="display:flex; justify-content:space-between; align-items:center;"><h3 style="margin:0; font-size:16px;">Прогресс</h3><span style="font-size:14px; color:var(--muted);">${progress}%</span></div><div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div></div>`;
      const { rows: topWorkers } = await pool.query("SELECT * FROM applications WHERE status = 'Одобрено' AND is_deleted = false ORDER BY points DESC LIMIT 5");
      html += `<div class="admin-col animate-in delay-3" style="margin-top:32px;"><h3>Топ сотрудников</h3>`;
      topWorkers.forEach((w, i) => { html += `<div class="worker-row"><div><p style="margin:0; font-size:15px;"><b>${w.name}</b> <span style="color:var(--muted); font-size:13px;">(${w.role})</span></p></div><div style="font-size:16px; font-weight:600;">${w.points} очков</div></div>`; });
      html += `</div>`;
    }

    if (tab === 'announcements') {
      html += `<div class="card animate-in"><h3>Новое объявление</h3><form action="/admin/announcement" method="POST" style="margin-top:20px;"><input type="hidden" name="pass" value="${pass}"><input name="title" placeholder="Заголовок" required><textarea name="content" placeholder="Текст..." rows="3" required></textarea><button type="submit" class="btn-purple" style="width:100%;">Опубликовать</button></form></div>`;
      const { rows: anns } = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
      html += `<div class="grid">`;
      anns.forEach(ann => { html += `<div class="card"><div style="display:flex; justify-content:space-between; align-items:start;"><div><h3 style="margin-top:0;">${ann.title}</h3><p style="font-size:14px; color:var(--muted);">${ann.content}</p></div><form action="/admin/delete-announcement" method="POST" onsubmit="return confirm('Удалить?');"><input type="hidden" name="id" value="${ann.id}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-del">✕</button></form></div></div>`; });
      html += `</div>`;
    }

    if (tab === 'applications') {
      const { rows: apps } = await pool.query('SELECT * FROM applications WHERE is_deleted = false ORDER BY created_at DESC');
      const current = apps.filter(a => a.status === 'На рассмотрении');
      const archive = apps.filter(a => a.status !== 'На рассмотрении');

      const renderApp = (app, isArchive) => {
        let badge = 'pending', text = 'В ожидании';
        if (app.status === 'Одобрено') { badge = 'approved'; text = 'Одобрено'; }
        if (app.status === 'Отклонено') { badge = 'rejected'; text = 'Отклонено'; }
        
        let h = `<div class="card ${badge} animate-in">
          <div style="display:flex; justify-content:space-between; align-items:start;">
            <div>
              <span class="badge ${badge}">${text}</span>
              <h3 style="margin: 8px 0 4px 0;">${app.name}</h3>
              <p style="color:var(--muted); font-size:13px; margin:0;">${app.role}</p>
              
              <div style="font-size:13px; color:var(--muted); margin-top:16px; line-height:1.8;">
                <span style="color:var(--text);">Город:</span> ${app.location}<br>
                <span style="color:var(--text);">Логин:</span> ${app.username}<br>
                <span style="color:var(--text);">Discord:</span> ${app.discord}<br>
                <span style="color:var(--text);">TG:</span> ${app.telegram || 'Нет'}<br>
                <span style="color:var(--text);">Roblox:</span> ${app.roblox_nick}
              </div>
            </div>`;
        if (isArchive) h += `<form action="/admin/delete-app" method="POST" onsubmit="return confirm('В корзину?');"><input type="hidden" name="id" value="${app.id}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-del">✕</button></form>`;
        h += `</div>`;
        
        if (!isArchive) {
          h += `<form action="/admin/status" method="POST" style="display:flex; gap:8px; margin-top:20px;" onsubmit="const msg = prompt('Комментарий:'); if (msg !== null) { this.comment.value = msg; } else { event.preventDefault(); }"><input type="hidden" name="id" value="${app.id}"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="comment" value=""><button name="status" value="Одобрено" class="btn-ok">Принять</button><button name="status" value="Отклонено" class="btn-bad">Отклонить</button></form>`;
        }
        return h + `</div>`;
      };

      html += `<div class="admin-grid animate-in delay-1"><div class="admin-col"><h3>Текущие заявки</h3>`;
      if (current.length === 0) html += `<p style="color:var(--muted);">Нет новых заявок</p>`;
      current.forEach(a => html += renderApp(a, false));
      html += `</div><div class="admin-col"><h3>Архив</h3>`;
      if (archive.length === 0) html += `<p style="color:var(--muted);">Архив пуст</p>`;
      archive.forEach(a => html += renderApp(a, true));
      html += `</div></div>`;
    }

    if (tab === 'tasks') {
      const { rows: tasks } = await pool.query('SELECT * FROM tasks WHERE title ILIKE $1 AND status != \'Удалено\' ORDER BY created_at DESC', [`%${search}%`]);
      html += `<div class="card animate-in" style="margin-bottom:32px;"><h3>Выдать новую задачу</h3><form action="/admin/task" method="POST" style="margin-top:20px;"><input type="hidden" name="pass" value="${pass}"><select name="role" required><option value="" disabled selected hidden>Выберите отдел</option><option>Билдер</option><option>Скриптер</option><option>GUI-дизайнер</option><option>Аниматор</option><option>Тестер</option></select><input name="title" placeholder="Название задачи" required><textarea name="description" placeholder="Описание задачи" rows="2" required></textarea><input type="datetime-local" name="deadline" title="Дедлайн"><button type="submit" class="btn-purple" style="width:100%;">Создать задачу</button></form></div>`;
      html += `<form action="/admin" method="GET" style="margin-bottom:32px; display:flex; gap:12px;"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="tab" value="tasks"><input name="search" placeholder="Поиск по задачам..." value="${search}" style="margin-bottom:0;"><button type="submit" class="btn-purple" style="width:auto; padding:0 24px;">Найти</button></form>`;
      html += `<div class="grid">`;
      tasks.forEach((task, i) => {
        let badge = 'pending', text = 'Открыта';
        let extra = '';
        let deadlineStr = '';
        if (task.deadline) deadlineStr = `<p style="font-size:12px; color:var(--danger); margin-top:12px; font-weight:500;">Дедлайн: ${new Date(task.deadline).toLocaleString('ru-RU')}</p>`;
        if (task.status === 'В работе') { badge = 'taken'; text = 'В работе'; extra = `<p style="font-size:13px; color:var(--muted); margin-top:8px;">Исполнитель: ${task.taken_by}</p>`; }
        if (task.status === 'Выполнено') { badge = 'approved'; text = 'На проверке'; extra = `<p style="font-size:13px; color:var(--muted); margin-top:8px;">Сдал: ${task.taken_by}</p>`; }
        
        html += `<div class="card ${badge} animate-in delay-${Math.min(i+1, 3)}">
          <div style="display:flex; justify-content:space-between; align-items:start;">
            <div style="display:flex; gap:8px; align-items:center;"><span class="badge ${badge}">${task.role}</span><span style="font-size:12px; color:var(--muted);">${text}</span></div>
            <form action="/admin/delete-task" method="POST" onsubmit="return confirm('В корзину?');"><input type="hidden" name="id" value="${task.id}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-del">✕</button></form>
          </div>
          <h3 style="margin-top:16px;">${task.title}</h3>
          <p style="color:var(--muted); font-size:14px;">${task.description}</p>${deadlineStr}${extra}`;
        
        if (task.proof_file) {
          html += `<p style="font-size:12px; color:var(--muted); margin-top:16px;">Файл: <a href="${task.proof_file}" download="${task.proof_filename}" style="color:var(--text); text-decoration:underline;">${task.proof_filename}</a></p>`;
          if (task.proof_file.startsWith('data:image')) html += `<img src="${task.proof_file}" class="proof-img">`;
        }
        
        html += `<div class="comments-box" style="margin-top:20px;"><b>Обсуждение</b><div style="margin-top:8px; color:var(--muted);">${(task.comments || 'Пусто').replace(/\n/g, '<br>')}</div><form action="/admin/comment" method="POST" style="margin-top:12px; display:flex; gap:8px;"><input type="hidden" name="id" value="${task.id}"><input type="hidden" name="pass" value="${pass}"><input name="text" placeholder="Ответить..." style="margin-bottom:0; padding:10px; font-size:13px;"><button type="submit" class="btn-purple" style="padding:10px 16px;">→</button></form></div>`;
        
        if (task.status === 'Выполнено') { html += `<form action="/admin/approve-task" method="POST" style="margin-top:16px;"><input type="hidden" name="id" value="${task.id}"><input type="hidden" name="username" value="${task.taken_by}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-ok" style="width:100%;">Принять работу</button></form>`; }
        html += `</div>`;
      });
      html += `</div>`;
    }

    if (tab === 'workers') {
      const { rows: workers } = await pool.query("SELECT * FROM applications WHERE status = 'Одобрено' AND is_deleted = false AND name ILIKE $1 ORDER BY role ASC", [`%${search}%`]);
      html += `<div class="admin-col animate-in" style="max-width:800px; margin:0 auto;"><h3>Команда</h3><p style="color:var(--muted); margin-bottom:24px;">Всего: ${workers.length}</p>`;
      html += `<form action="/admin" method="GET" style="margin-bottom:24px; display:flex; gap:12px;"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="tab" value="workers"><input name="search" placeholder="Поиск по имени..." value="${search}" style="margin-bottom:0;"><button type="submit" class="btn-purple" style="width:auto; padding:0 24px;">Найти</button></form>`;
      if (workers.length === 0) html += `<p style="color:var(--muted);">Никого не найдено</p>`;
      else {
        workers.forEach((w, i) => {
          html += `<div class="worker-row animate-in delay-${Math.min(i+1, 3)}"><div><h3 style="margin:0; font-size:16px;">${w.name} <span style="color:var(--muted); font-size:13px; font-weight:400;">(${w.role})</span></h3><p style="margin:8px 0 0 0; font-size:13px; color:var(--muted);">Очки: ${w.points} | Discord: ${w.discord} | Логин: ${w.username}</p></div><form action="/admin/kick-worker" method="POST" onsubmit="return confirm('В корзину?');"><input type="hidden" name="id" value="${w.id}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-del">Удалить</button></form></div>`;
        });
      }
      html += `</div>`;
    }

    if (tab === 'trash') {
      const { rows: delApps } = await pool.query('SELECT * FROM applications WHERE is_deleted = true ORDER BY created_at DESC');
      const { rows: delTasks } = await pool.query('SELECT * FROM tasks WHERE status = \'Удалено\' ORDER BY created_at DESC');
      html += `<div class="admin-grid animate-in"><div class="admin-col"><h3>Удаленные заявки</h3>`;
      if (delApps.length === 0) html += `<p style="color:var(--muted);">Пусто</p>`;
      delApps.forEach(app => { html += `<div class="card" style="opacity:0.6;"><h3 style="margin:0; font-size:16px;">${app.name}</h3><p style="font-size:13px; color:var(--muted); margin:8px 0;">${app.role}</p><form action="/admin/restore-app" method="POST"><input type="hidden" name="id" value="${app.id}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-purple" style="width:100%; padding:8px;">Восстановить</button></form></div>`; });
      html += `</div><div class="admin-col"><h3>Удаленные задачи</h3>`;
      if (delTasks.length === 0) html += `<p style="color:var(--muted);">Пусто</p>`;
      delTasks.forEach(task => { html += `<div class="card" style="opacity:0.6;"><h3 style="margin:0; font-size:16px;">${task.title}</h3><p style="font-size:13px; color:var(--muted); margin:8px 0;">${task.role}</p><form action="/admin/restore-task" method="POST"><input type="hidden" name="id" value="${task.id}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="btn-purple" style="width:100%; padding:8px;">Восстановить</button></form></div>`; });
      html += `</div></div>`;
    }

    html += `</div></body></html>`;
    res.send(html);
  } catch (err) { res.send(`<h2 style="color:var(--danger);">Ошибка: ${err.message}</h2>`); }
});

app.post('/admin/status', async (req, res) => {
  const { id, status, pass, comment } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query('UPDATE applications SET status = $1, admin_comment = $2 WHERE id = $3', [status, comment || null, id]);
  res.redirect('/admin?pass=' + pass + '&tab=applications'); 
});

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
