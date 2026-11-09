const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let applications = [];

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head><meta charset="UTF-8"><title>Подать заявку</title>
    <style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:auto;background:#f4f4f9}
    input,textarea{width:100%;padding:10px;margin:5px 0 15px;border:1px solid #ccc;border-radius:5px}
    button{padding:10px 20px;background:#6c5ce7;color:#fff;border:none;border-radius:5px;cursor:pointer}
    </style></head>
    <body>
      <h2>Заявка в проект</h2>
      <form action="/apply" method="POST">
        <label>Имя</label><input name="name" required>
        <label>Email</label><input name="email" type="email" required>
        <label>Telegram</label><input name="telegram">
        <label>О себе</label><textarea name="about" required></textarea>
        <button type="submit">Отправить</button>
      </form>
    </body></html>
  `);
});

app.post('/apply', (req, res) => {
  const { name, email, telegram, about } = req.body;
  applications.push({ id: Date.now(), name, email, telegram, about, status: 'На рассмотрении' });
  res.send('<h2>✅ Заявка отправлена! <a href="/">Вернуться</a></h2>');
});

app.get('/admin', (req, res) => {
  const pass = req.query.pass;
  if (pass !== ADMIN_PASSWORD) {
    return res.send(`
      <h2>Вход в админку</h2>
      <form><input name="pass" type="password" placeholder="Пароль"><button>Войти</button></form>
    `);
  }
  let html = '<h2>Заявки</h2><a href="/admin?pass=' + pass + '">Обновить</a><br><br>';
  applications.forEach(app => {
    html += `<div style="border:1px solid #ccc;padding:10px;margin:10px 0;border-radius:5px">
      <b>${app.name}</b> (${app.email}) | TG: ${app.telegram || '-'}<br>
      <i>${app.about}</i><br>
      Статус: <b>${app.status}</b><br>
      <form action="/admin/status" method="POST" style="display:inline">
        <input type="hidden" name="id" value="${app.id}">
        <input type="hidden" name="pass" value="${pass}">
        <button name="status" value="Одобрено" style="background:green">✅ Одобрить</button>
        <button name="status" value="Отклонено" style="background:red">❌ Отклонить</button>
      </form>
    </div>`;
  });
  res.send(html);
});

app.post('/admin/status', (req, res) => {
  const { id, status, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Неверный пароль');
  const app = applications.find(a => a.id == id);
  if (app) app.status = status;
  res.redirect('/admin?pass=' + pass);
});

app.listen(PORT, () => console.log('Сервер запущен на порту ' + PORT));
