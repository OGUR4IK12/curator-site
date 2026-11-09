const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2024';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- КРАСИВЫЕ СТИЛИ ---
const css = `
  * { box-sizing: border-box; font-family: 'Segoe UI', Roboto, sans-serif; }
  body { margin: 0; background: #f4f7f6; color: #333; display: flex; justify-content: center; padding: 20px; }
  .container { background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); width: 100%; max-width: 500px; margin-top: 20px;}
  .wide-container { max-width: 900px; }
  h1, h2 { text-align: center; color: #111; margin-bottom: 20px; }
  input, select, textarea { width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; transition: border 0.2s; }
  input:focus, select:focus { border-color: #6c5ce7; outline: none; }
  button { width: 100%; padding: 12px; background: #6c5ce7; color: #fff; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
  button:hover { background: #5a4bd1; }
  .link { text-align: center; margin-top: 15px; font-size: 14px; }
  .link a { color: #6c5ce7; text-decoration: none; }
  .link a:hover { text-decoration: underline; }
  .alert { padding: 12px; border-radius: 8px; margin-bottom: 15px; text-align: center; font-size: 14px; background: #ffeaa7; color: #d63031; }
  .success { background: #55efc4; color: #00b894; }
  .card { border: 1px solid #eee; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #6c5ce7; background: #fafafa; }
  .card.approved { border-left-color: #00b894; }
  .card.rejected { border-left-color: #d63031; }
  .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 10px; }
  .badge.pending { background: #ffeaa7; color: #d63031; }
  .badge.approved { background: #55efc4; color: #00b894; }
  .badge.rejected { background: #fab1a0; color: #d63031; }
  .btn-ok { background: #00b894; width: auto; padding: 8px 15px; font-size: 14px; margin-right: 5px; }
  .btn-bad { background: #d63031; width: auto; padding: 8px 15px; font-size: 14px; }
  .error-page { color: #d63031; text-align: center; padding: 20px; background: #ffeaa7; border-radius: 8px; }
`;

// --- ГЛАВНАЯ СТРАНИЦА ---
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Подать заявку</title><style>${css}</style></head>
    <body>
      <div class="container">
        <h2>Заявка в команду</h2>
        ${req.query.error ? '<div class="alert">Заполните все обязательные поля!</div>' : ''}
        <form action="/apply" method="POST">
          <input name="name" placeholder="1. Ваше имя" required>
          <input name="location" placeholder="2. Страна / Город" required>
          <input name="roblox" placeholder="3. Ник в Roblox" required>
          <input name="discord" placeholder="4. Discord (обязательно)" required>
          <input name="telegram" placeholder="Telegram (необязательно)">
          <select name="role" required>
            <option value="">Кем вы хотите быть?</option>
            <option>Билдер</option>
            <option>Скриптер</option>
            <option>GUI-дизайнер</option>
            <option>Аниматор</option>
            <option>Тестер</option>
          </select>
          <input name="username" placeholder="Придумайте Логин (для проверки статуса)" required>
          <input name="password" type="password" placeholder="Придумайте Пароль (для проверки статуса)" required>
          <button type="submit">Отправить заявку</button>
        </form>
        <div class="link"><a href="/status">Уже подали заявку? Проверить статус</a></div>
      </div>
    </body></html>
  `);
});

// --- ОБРАБОТКА ЗАЯВКИ ---
app.post('/apply', async (req, res) => {
  const { name, location, roblox, discord, telegram, role, username, password } = req.body;
  
  if (!name || !location || !roblox || !discord || !role || !username || !password) {
    return res.redirect('/?error=1');
  }

  // Принудительно добавляем статус и дату, чтобы база их не отвергла
  const insertData = {
    name, location, roblox_nick: roblox, discord, 
    telegram: telegram || null, 
    role, username, password, 
    status: 'На рассмотрении'
  };

  const { error } = await supabase.from('applications').insert([insertData]);
  
  if (error) {
    console.error("Ошибка Supabase:", error.message);
    return res.send(`
      <!DOCTYPE html><html><head><style>${css}</style></head><body>
      <div class="container">
        <div class="error-page">
          <h2>Ошибка базы данных</h2>
          <p><b>Текст ошибки:</b> ${error.message}</p>
          <p><b>Код:</b> ${error.code}</p>
        </div>
        <div class="link" style="margin-top:20px;"><a href="/">← Вернуться назад</a></div>
      </div></body></html>
    `);
  }
  
  res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body><div class="container"><h2 class="success">✅ Успешно!</h2><p style="text-align:center">Заявка отправлена. Ожидайте проверки куратором.</p><div class="link"><a href="/status">Проверить статус заявки</a></div></div></body></html>`);
});

// --- ПРОВЕРКА СТАТУСА ---
app.get('/status', (req, res) => {
  res.send(`
    <!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Статус заявки</title><style>${css}</style></head>
    <body><div class="container">
      <h2>Проверка статуса</h2>
      <form action="/status-check" method="POST">
        <input name="username" placeholder="Ваш логин" required>
        <input name="password" type="password" placeholder="Ваш пароль" required>
        <button type="submit">Проверить</button>
      </form>
      <div class="link"><a href="/">← Вернуться к форме</a></div>
    </div></body></html>
  `);
});

app.post('/status-check', async (req, res) => {
  const { username, password } = req.body;
  const { data, error } = await supabase.from('applications').select('*').eq('username', username).eq('password', password).single();
  
  if (error || !data) {
    return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body><div class="container"><h2>Ошибка</h2><div class="alert">Неверный логин или пароль, либо заявки не существует.</div><div class="link"><a href="/status">Назад</a></div></div></body></html>`);
  }

  let statusText = '⏳ На рассмотрении (ожидайте)';
  let cardClass = 'pending';
  if (data.status === 'Одобрено') { statusText = '✅ Одобрено! С вами свяжутся.'; cardClass = 'approved'; }
  if (data.status === 'Отклонено') { statusText = '❌ Отклонено.'; cardClass = 'rejected'; }

  res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body><div class="container">
    <h2>Ваша заявка</h2>
    <div class="card ${cardClass}">
      <p><b>Имя:</b> ${data.name}</p>
      <p><b>Роль:</b> ${data.role}</p>
      <p><b>Статус:</b> <span class="badge ${cardClass}">${statusText}</span></p>
    </div>
    <div class="link"><a href="/status">Назад</a></div>
  </div></body></html>`);
});

// --- АДМИН ПАНЕЛЬ ---
app.get('/admin', async (req, res) => {
  const pass = req.query.pass;
  if (pass !== ADMIN_PASSWORD) {
    return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body><div class="container" style="max-width:350px; margin-top:100px;"><h2>Вход для админа</h2><form><input name="pass" type="password" placeholder="Пароль" required><button type="submit">Войти</button></form></div></body></html>`);
  }

  const { data: apps, error } = await supabase.from('applications').select('*').order('created_at', { ascending: false });
  
  if (error) {
    return res.send(`<h2 style="color:red;text-align:center;">Ошибка загрузки: ${error.message}</h2>`);
  }

  let html = `<!DOCTYPE html><html><head><style>${css} .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; } @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }</style></head><body><div class="container wide-container">
    <h2>База данных заявок</h2>
    <div class="grid">`;
    
  (apps || []).forEach(app => {
    let badge = 'pending', text = 'На рассмотрении';
    if (app.status === 'Одобрено') { badge = 'approved'; text = 'Одобрено'; }
    if (app.status === 'Отклонено') { badge = 'rejected'; text = 'Отклонено'; }

    html += `<div class="card ${badge}">
      <span class="badge ${badge}">${text}</span>
      <p><b>${app.name}</b> (${app.role})</p>
      <p style="font-size:13px; color:#666">Город: ${app.location}<br>Roblox: ${app.roblox_nick}<br>Discord: ${app.discord}<br>TG: ${app.telegram || '-'}</p>
      <form action="/admin/status" method="POST" style="display:flex; gap:5px; margin-top:10px;">
        <input type="hidden" name="id" value="${app.id}"><input type="hidden" name="pass" value="${pass}">
        <button name="status" value="Одобрено" class="btn-ok">Одобрить</button>
        <button name="status" value="Отклонено" class="btn-bad">Отклонить</button>
      </form>
    </div>`;
  });
  
  if (!apps || apps.length === 0) {
    html += `<p style="text-align:center; width:100%;">Пока заявок нет</p>`;
  }

  html += `</div><div class="link" style="margin-top:20px;"><a href="/admin?pass=${pass}">🔄 Обновить список</a></div></div></body></html>`;
  res.send(html);
});

app.post('/admin/status', async (req, res) => {
  const { id, status, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await supabase.from('applications').update({ status }).eq('id', id);
  res.redirect('/admin?pass=' + pass);
});

app.listen(PORT, () => console.log('Сервер запущен на порту ' + PORT));
