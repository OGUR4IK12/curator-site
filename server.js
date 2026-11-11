const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2024';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- НОВЫЙ ТЕМНЫЙ ДИЗАЙН ---
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap');
  
  * { box-sizing: border-box; font-family: 'Montserrat', sans-serif; }
  body { 
    margin: 0; 
    background: #0f1115; 
    color: #e2e8f0; 
    display: flex; 
    justify-content: center; 
    padding: 20px; 
    min-height: 100vh;
    background-image: radial-gradient(circle at top right, rgba(108,92,231,0.15) 0%, transparent 40%), radial-gradient(circle at bottom left, rgba(0,184,148,0.1) 0%, transparent 40%);
  }
  
  .container { 
    background: #1a1d24; 
    padding: 40px; 
    border-radius: 16px; 
    box-shadow: 0 10px 40px rgba(0,0,0,0.5); 
    width: 100%; 
    max-width: 520px; 
    margin-top: 40px;
    border: 1px solid #2d313a;
  }
  .wide-container { max-width: 1000px; }
  
  h1, h2 { text-align: center; color: #fff; margin-bottom: 25px; font-weight: 800; letter-spacing: -0.5px; }
  
  input, select, textarea { 
    width: 100%; 
    padding: 14px; 
    margin-bottom: 16px; 
    background: #0f1115; 
    border: 1px solid #2d313a; 
    border-radius: 10px; 
    font-size: 14px; 
    color: #fff; 
    transition: all 0.3s;
  }
  input:focus, select:focus { 
    border-color: #6c5ce7; 
    outline: none; 
    box-shadow: 0 0 0 3px rgba(108,92,231,0.2);
  }
  
  button { 
    width: 100%; 
    padding: 14px; 
    background: linear-gradient(135deg, #6c5ce7, #a29bfe); 
    color: #fff; 
    border: none; 
    border-radius: 10px; 
    font-size: 16px; 
    font-weight: 600; 
    cursor: pointer; 
    transition: transform 0.2s, box-shadow 0.2s;
  }
  button:hover { 
    transform: translateY(-2px); 
    box-shadow: 0 6px 20px rgba(108,92,231,0.4);
  }
  
  .link { text-align: center; margin-top: 20px; font-size: 14px; }
  .link a { color: #a29bfe; text-decoration: none; transition: color 0.2s; }
  .link a:hover { color: #fff; }
  
  .alert { 
    padding: 14px; 
    border-radius: 10px; 
    margin-bottom: 20px; 
    text-align: center; 
    font-size: 14px; 
    background: rgba(214, 48, 49, 0.15); 
    color: #ff7675; 
    border: 1px solid rgba(214, 48, 49, 0.3);
  }
  
  .card { 
    border: 1px solid #2d313a; 
    padding: 20px; 
    border-radius: 12px; 
    margin-bottom: 16px; 
    background: #1e222b; 
    border-left: 4px solid #6c5ce7; 
    transition: transform 0.2s;
  }
  .card:hover { transform: scale(1.01); }
  .card.approved { border-left-color: #00b894; }
  .card.rejected { border-left-color: #d63031; }
  
  .badge { 
    display: inline-block; 
    padding: 6px 12px; 
    border-radius: 6px; 
    font-size: 12px; 
    font-weight: 800; 
    margin-bottom: 12px; 
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .badge.pending { background: rgba(253, 203, 110, 0.2); color: #fdcb6e; }
  .badge.approved { background: rgba(0, 184, 148, 0.2); color: #55efc4; }
  .badge.rejected { background: rgba(214, 48, 49, 0.2); color: #ff7675; }
  
  .btn-ok { background: #00b894; width: auto; padding: 8px 18px; font-size: 13px; margin-right: 8px; }
  .btn-ok:hover { box-shadow: 0 4px 15px rgba(0,184,148,0.4); }
  .btn-bad { background: #d63031; width: auto; padding: 8px 18px; font-size: 13px; }
  .btn-bad:hover { box-shadow: 0 4px 15px rgba(214,48,49,0.4); }
  
  .tabs { display: flex; justify-content: center; gap: 12px; margin-bottom: 30px; }
  .tab-btn { 
    background: #1e222b; 
    color: #888; 
    width: auto; 
    padding: 10px 24px; 
    text-decoration: none; 
    border-radius: 8px; 
    font-weight: 600; 
    border: 1px solid #2d313a;
    transition: all 0.2s;
  }
  .tab-btn.active { background: #6c5ce7; color: #fff; border-color: #6c5ce7; }
  .tab-btn:hover:not(.active) { background: #2d313a; color: #fff; }
  
  .comment-box { 
    background: #0f1115; 
    border: 1px dashed #6c5ce7; 
    padding: 12px; 
    border-radius: 8px; 
    margin-top: 12px; 
    font-size: 13px; 
    color: #a29bfe; 
  }
  
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; } 
  @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
`;

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Подать заявку</title><style>${css}</style></head><body><div class="container"><h2>Заявка в команду</h2>${req.query.error ? '<div class="alert">Заполните все обязательные поля!</div>' : ''}<form action="/apply" method="POST"><input name="name" placeholder="1. Ваше имя" required><input name="location" placeholder="2. Страна / Город" required><input name="roblox" placeholder="3. Ник в Roblox" required><input name="discord" placeholder="4. Discord (обязательно)" required><input name="telegram" placeholder="Telegram (необязательно)"><select name="role" required><option value="">Кем вы хотите быть?</option><option>Билдер</option><option>Скриптер</option><option>GUI-дизайнер</option><option>Аниматор</option><option>Тестер</option></select><input name="username" placeholder="Придумайте Логин" required><input name="password" type="password" placeholder="Придумайте Пароль" required><button type="submit">Отправить заявку</button></form><div class="link"><a href="/status">Проверить статус</a></div></div></body></html>`);
});

app.post('/apply', async (req, res) => {
  const { name, location, roblox, discord, telegram, role, username, password } = req.body;
  if (!name || !location || !roblox || !discord || !role || !username || !password) return res.redirect('/?error=1');

  try {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    const query = `INSERT INTO applications (name, location, roblox_nick, discord, telegram, role, username, password, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'На рассмотрении')`;
    await pool.query(query, [name, location, roblox, discord, telegram || null, role, cleanUsername, cleanPassword]);
    
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body><div class="container"><h2 style="color:#00b894">✅ Успешно!</h2><p style="text-align:center">Заявка отправлена.</p><div class="link"><a href="/status">Проверить статус</a></div></div></body></html>`);
  } catch (err) {
    console.error("Ошибка БД:", err);
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body><div class="container"><h2 style="color:#ff7675">Ошибка базы данных</h2><div class="alert"><b>Текст:</b> ${err.message}</div><div class="link"><a href="/">← Назад</a></div></div></body></html>`);
  }
});

app.get('/status', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Статус</title><style>${css}</style></head><body><div class="container"><h2>Проверка статуса</h2><form action="/status-check" method="POST"><input name="username" placeholder="Ваш логин" required><input name="password" type="password" placeholder="Ваш пароль" required><button type="submit">Проверить</button></form><div class="link"><a href="/">← Назад</a></div></div></body></html>`);
});

app.post('/status-check', async (req, res) => {
  const username = (req.body.username || '').trim();
  const password = (req.body.password || '').trim();
  
  try {
    const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2', [username, password]);
    
    if (rows.length === 0) {
      return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body><div class="container"><h2>Ошибка</h2><div class="alert">Неверный логин или пароль.<br><br><b>Мы искали в базе:</b><br>Логин: "${username}"<br>Пароль: "${password}"</div><div class="link"><a href="/status">Назад</a></div></div></body></html>`);
    }
    
    const data = rows[0];
    let statusText = '⏳ На рассмотрении', cardClass = 'pending', extraText = '';
    
    if (data.status === 'Одобрено') { statusText = '✅ Одобрено! Вам поступит сообщение в Discord.'; cardClass = 'approved'; }
    if (data.status === 'Отклонено') { statusText = '❌ Отклонено.'; cardClass = 'rejected'; }

    if (data.admin_comment) {
      extraText = `<div class="comment-box"><b>Сообщение от куратора:</b><br>${data.admin_comment}</div>`;
    }

    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body><div class="container"><h2>Ваша заявка</h2><div class="card ${cardClass}"><p><b>Имя:</b> ${data.name}</p><p><b>Роль:</b> ${data.role}</p><p><b>Статус:</b> <span class="badge ${cardClass}">${statusText}</span></p>${extraText}</div><div class="link"><a href="/status">Назад</a></div></div></body></html>`);
  } catch (err) {
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body><div class="container"><h2>Ошибка сервера</h2><div class="alert">${err.message}</div><div class="link"><a href="/status">Назад</a></div></div></body></html>`);
  }
});

app.get('/admin', async (req, res) => {
  const pass = req.query.pass;
  const tab = req.query.tab || 'new';

  if (pass !== ADMIN_PASSWORD) return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body><div class="container" style="max-width:380px; margin-top:120px;"><h2>Вход для админа</h2><form><input name="pass" type="password" placeholder="Пароль" required><button type="submit">Войти</button></form></div></body></html>`);
  
  try {
    let query = 'SELECT * FROM applications ORDER BY created_at DESC';
    if (tab === 'new') {
      query = `SELECT * FROM applications WHERE status = 'На рассмотрении' ORDER BY created_at DESC`;
    } else {
      query = `SELECT * FROM applications WHERE status != 'На рассмотрении' ORDER BY created_at DESC`;
    }

    const { rows: apps } = await pool.query(query);
    
    let html = `<!DOCTYPE html><html><head><style>${css}</style></head><body><div class="container wide-container">
    <h2>База данных заявок</h2>
    
    <div class="tabs">
      <a href="/admin?pass=${pass}&tab=new" class="tab-btn ${tab === 'new' ? 'active' : ''}">Новые заявки</a>
      <a href="/admin?pass=${pass}&tab=processed" class="tab-btn ${tab === 'processed' ? 'active' : ''}">Рассмотренные (Архив)</a>
    </div>

    <div class="grid">`;
    
    (apps || []).forEach(app => {
      let badge = 'pending', text = 'На рассмотрении';
      if (app.status === 'Одобрено') { badge = 'approved'; text = 'Одобрено'; }
      if (app.status === 'Отклонено') { badge = 'rejected'; text = 'Отклонено'; }
      
      html += `<div class="card ${badge}"><span class="badge ${badge}">${text}</span><p><b>${app.name}</b> (${app.role})</p><p style="font-size:13px; color:#a0aec0">Город: ${app.location}<br>Roblox: ${app.roblox_nick}<br>Discord: ${app.discord}<br>TG: ${app.telegram || '-'}</p>`;
      
      if (app.admin_comment) {
        html += `<div style="font-size:13px; color:#ff7675; margin-bottom:10px;"><b>Ваш комментарий:</b> ${app.admin_comment}</div>`;
      }

      if (tab === 'new') {
        html += `<form action="/admin/status" method="POST" style="display:flex; gap:8px; margin-top:15px;" onsubmit="const msg = prompt('Введите комментарий для кандидата (необязательно):'); if (msg !== null) { this.comment.value = msg; } else { event.preventDefault(); }">
          <input type="hidden" name="id" value="${app.id}">
          <input type="hidden" name="pass" value="${pass}">
          <input type="hidden" name="comment" value="">
          <button name="status" value="Одобрено" class="btn-ok">Одобрить</button>
          <button name="status" value="Отклонено" class="btn-bad">Отклонить</button>
        </form>`;
      }
      html += `</div>`;
    });
    
    if (!apps || apps.length === 0) {
      html += `<p style="text-align:center; width:100%; color:#888;">Здесь пока пусто</p>`;
    }
    
    html += `</div><div class="link" style="margin-top:30px;"><a href="/admin?pass=${pass}&tab=${tab}">🔄 Обновить</a></div></div></body></html>`;
    res.send(html);
  } catch (err) {
    res.send(`<h2 style="color:#ff7675;text-align:center;">Ошибка: ${err.message}</h2>`);
  }
});

app.post('/admin/status', async (req, res) => {
  const { id, status, pass, comment } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  try {
    await pool.query('UPDATE applications SET status = $1, admin_comment = $2 WHERE id = $3', [status, comment || null, id]);
    res.redirect('/admin?pass=' + pass); 
  } catch (err) {
    res.status(500).send('Ошибка обновления');
  }
});

app.listen(PORT, () => console.log('Сервер запущен на порту ' + PORT));
