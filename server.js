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

const css = `* { box-sizing: border-box; font-family: 'Segoe UI', Roboto, sans-serif; } body { margin: 0; background: #f4f7f6; color: #333; display: flex; justify-content: center; padding: 20px; } .container { background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); width: 100%; max-width: 500px; margin-top: 20px;} .wide-container { max-width: 900px; } h1, h2 { text-align: center; color: #111; margin-bottom: 20px; } input, select, textarea { width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; } input:focus { border-color: #6c5ce7; outline: none; } button { width: 100%; padding: 12px; background: #6c5ce7; color: #fff; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; } button:hover { background: #5a4bd1; } .link { text-align: center; margin-top: 15px; font-size: 14px; } .link a { color: #6c5ce7; text-decoration: none; } .alert { padding: 12px; border-radius: 8px; margin-bottom: 15px; text-align: center; font-size: 14px; background: #ffeaa7; color: #d63031; } .success { background: #55efc4; color: #00b894; } .card { border: 1px solid #eee; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #6c5ce7; background: #fafafa; } .card.approved { border-left-color: #00b894; } .card.rejected { border-left-color: #d63031; } .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 10px; } .badge.pending { background: #ffeaa7; color: #d63031; } .badge.approved { background: #55efc4; color: #00b894; } .badge.rejected { background: #fab1a0; color: #d63031; } .btn-ok { background: #00b894; width: auto; padding: 8px 15px; font-size: 14px; margin-right: 5px; } .btn-bad { background: #d63031; width: auto; padding: 8px 15px; font-size: 14px; } .error-page { color: #d63031; text-align: center; padding: 20px; background: #ffeaa7; border-radius: 8px; } .tabs { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; } .tab-btn { background: #e0e0e0; color: #333; width: auto; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; } .tab-btn.active { background: #6c5ce7; color: #fff; } .comment-box { background: #fff; border: 1px dashed #6c5ce7; padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 13px; color: #444; }`;

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Подать заявку</title><style>${css}</style></head><body><div class="container"><h2>Заявка в команду</h2>${req.query.error ? '<div class="alert">Заполните все обязательные поля!</div>' : ''}<form action="/apply" method="POST"><input name="name" placeholder="1. Ваше имя" required><input name="location" placeholder="2. Страна / Город" required><input name="roblox" placeholder="3. Ник в Roblox" required><input name="discord" placeholder="4. Discord (обязательно)" required><input name="telegram" placeholder="Telegram (необязательно)"><select name="role" required><option value="">Кем вы хотите быть?</option><option>Билдер</option><option>Скриптер</option><option>GUI-дизайнер</option><option>Аниматор</option><option>Тестер</option></select><input name="username" placeholder="Придумайте Логин" required><input name="password" type="password" placeholder="Придумайте Пароль" required><button type="submit">Отправить заявку</button></form><div class="link"><a href="/status">Проверить статус</a></div></div></body></html>`);
});

app.post('/apply', async (req, res) => {
  const { name, location, roblox, discord, telegram, role, username, password } = req.body;
  if (!name || !location || !roblox || !discord || !role || !username || !password) return res.redirect('/?error=1');

  try {
    const query = `INSERT INTO applications (name, location, roblox_nick, discord, telegram, role, username, password, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'На рассмотрении')`;
    await pool.query(query, [name, location, roblox, discord, telegram || null, role, username, password]);
    
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body><div class="container"><h2 class="success">✅ Успешно!</h2><p style="text-align:center">Заявка отправлена.</p><div class="link"><a href="/status">Проверить статус</a></div></div></body></html>`);
  } catch (err) {
    console.error("Ошибка БД:", err);
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body><div class="container"><div class="error-page"><h2>Ошибка базы данных</h2><p><b>Текст:</b> ${err.message}</p></div><div class="link"><a href="/">← Назад</a></div></div></body></html>`);
  }
});

app.get('/status', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Статус</title><style>${css}</style></head><body><div class="container"><h2>Проверка статуса</h2><form action="/status-check" method="POST"><input name="username" placeholder="Ваш логин" required><input name="password" type="password" placeholder="Ваш пароль" required><button type="submit">Проверить</button></form><div class="link"><a href="/">← Назад</a></div></div></body></html>`);
});

app.post('/status-check', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2', [username, password]);
    if (rows.length === 0) throw new Error('Not found');
    
    const data = rows[0];
    let statusText = '⏳ На рассмотрении', cardClass = 'pending', extraText = '';
    
    if (data.status === 'Одобрено') { 
      statusText = '✅ Одобрено! Вам поступит сообщение в Discord.'; 
      cardClass = 'approved'; 
    }
    if (data.status === 'Отклонено') { 
      statusText = '❌ Отклонено.'; 
      cardClass = 'rejected'; 
    }

    // Если админ оставил комментарий - показываем его
    if (data.admin_comment) {
      extraText = `<div class="comment-box"><b>Сообщение от куратора:</b><br>${data.admin_comment}</div>`;
    }

    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body><div class="container"><h2>Ваша заявка</h2><div class="card ${cardClass}"><p><b>Имя:</b> ${data.name}</p><p><b>Роль:</b> ${data.role}</p><p><b>Статус:</b> <span class="badge ${cardClass}">${statusText}</span></p>${extraText}</div><div class="link"><a href="/status">Назад</a></div></div></body></html>`);
  } catch (err) {
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body><div class="container"><h2>Ошибка</h2><div class="alert">Неверный логин или пароль.</div><div class="link"><a href="/status">Назад</a></div></div></body></html>`);
  }
});

app.get('/admin', async (req, res) => {
  const pass = req.query.pass;
  const tab = req.query.tab || 'new';

  if (pass !== ADMIN_PASSWORD) return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body><div class="container" style="max-width:350px; margin-top:100px;"><h2>Вход для админа</h2><form><input name="pass" type="password" placeholder="Пароль" required><button type="submit">Войти</button></form></div></body></html>`);
  
  try {
    let query = 'SELECT * FROM applications ORDER BY created_at DESC';
    if (tab === 'new') {
      query = `SELECT * FROM applications WHERE status = 'На рассмотрении' ORDER BY created_at DESC`;
    } else {
      query = `SELECT * FROM applications WHERE status != 'На рассмотрении' ORDER BY created_at DESC`;
    }

    const { rows: apps } = await pool.query(query);
    
    let html = `<!DOCTYPE html><html><head><style>${css} .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; } @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }</style></head><body><div class="container wide-container">
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
      
      html += `<div class="card ${badge}"><span class="badge ${badge}">${text}</span><p><b>${app.name}</b> (${app.role})</p><p style="font-size:13px; color:#666">Город: ${app.location}<br>Roblox: ${app.roblox_nick}<br>Discord: ${app.discord}<br>TG: ${app.telegram || '-'}</p>`;
      
      if (app.admin_comment) {
        html += `<div style="font-size:12px; color:#d63031; margin-bottom:10px;"><b>Ваш комментарий:</b> ${app.admin_comment}</div>`;
      }

      if (tab === 'new') {
        // Измененная форма с вызовом prompt для ввода текста
        html += `<form action="/admin/status" method="POST" style="display:flex; gap:5px; margin-top:10px;" onsubmit="const btn = event.submitter.value; if(btn === 'Одобрено' || btn === 'Отклонено') { const msg = prompt('Введите комментарий для кандидата (необязательно):'); if (msg !== null) { this.comment.value = msg; } else { event.preventDefault(); } }">
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
      html += `<p style="text-align:center; width:100%;">Здесь пока пусто</p>`;
    }
    
    html += `</div><div class="link" style="margin-top:20px;"><a href="/admin?pass=${pass}&tab=${tab}">🔄 Обновить</a></div></div></body></html>`;
    res.send(html);
  } catch (err) {
    res.send(`<h2 style="color:red;text-align:center;">Ошибка: ${err.message}</h2>`);
  }
});

app.post('/admin/status', async (req, res) => {
  const { id, status, pass, comment } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  try {
    // Обновляем статус и комментарий
    await pool.query('UPDATE applications SET status = $1, admin_comment = $2 WHERE id = $3', [status, comment || null, id]);
    res.redirect('/admin?pass=' + pass); 
  } catch (err) {
    res.status(500).send('Ошибка обновления');
  }
});

app.listen(PORT, () => console.log('Сервер запущен на порту ' + PORT));
