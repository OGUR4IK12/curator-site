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

// --- СТИЛИ И КАНВАС ---
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap');
  * { box-sizing: border-box; font-family: 'Montserrat', sans-serif; }
  
  body { 
    margin: 0; 
    background: #0a0a0c; /* Очень темный фон */
    color: #e2e8f0; 
    display: flex; 
    justify-content: center; 
    padding: 20px; 
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }

  #bg-canvas {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    z-index: -1;
    pointer-events: none;
  }
  
  .container { 
    background: rgba(20, 20, 25, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 40px; 
    border-radius: 16px; 
    box-shadow: 0 15px 50px rgba(0,0,0,0.6); 
    width: 100%; 
    max-width: 520px; 
    margin-top: 40px;
    border: 1px solid rgba(255,255,255,0.1);
    position: relative;
    z-index: 1;
  }
  .wide-container { max-width: 1000px; }
  
  h1, h2 { text-align: center; color: #fff; margin-bottom: 25px; font-weight: 800; letter-spacing: -0.5px; }
  
  input, select, textarea { 
    width: 100%; padding: 14px; margin-bottom: 16px; 
    background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; 
    font-size: 14px; color: #fff; transition: all 0.3s;
  }
  input:focus, select:focus { border-color: #fff; outline: none; box-shadow: 0 0 0 3px rgba(255,255,255,0.1); }
  
  button { 
    width: 100%; padding: 14px; 
    background: #fff; 
    color: #000; border: none; border-radius: 10px; 
    font-size: 16px; font-weight: 800; cursor: pointer; 
    transition: transform 0.2s, box-shadow 0.2s;
  }
  button:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(255,255,255,0.2); }
  
  .link { text-align: center; margin-top: 20px; font-size: 14px; }
  .link a { color: #a0a0a0; text-decoration: none; transition: color 0.2s; }
  .link a:hover { color: #fff; }
  
  .alert { padding: 14px; border-radius: 10px; margin-bottom: 20px; text-align: center; font-size: 14px; background: rgba(214, 48, 49, 0.15); color: #ff7675; border: 1px solid rgba(214, 48, 49, 0.3); }
  
  .card { border: 1px solid rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 16px; background: rgba(30, 30, 35, 0.8); border-left: 4px solid #fff; transition: transform 0.2s; }
  .card:hover { transform: scale(1.01); }
  .card.approved { border-left-color: #00b894; }
  .card.rejected { border-left-color: #d63031; }
  
  .badge { display: inline-block; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 800; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge.pending { background: rgba(253, 203, 110, 0.2); color: #fdcb6e; }
  .badge.approved { background: rgba(0, 184, 148, 0.2); color: #55efc4; }
  .badge.rejected { background: rgba(214, 48, 49, 0.2); color: #ff7675; }
  
  .btn-ok { background: #00b894; color: #fff; width: auto; padding: 8px 18px; font-size: 13px; margin-right: 8px; }
  .btn-bad { background: #d63031; color: #fff; width: auto; padding: 8px 18px; font-size: 13px; }
  
  .tabs { display: flex; justify-content: center; gap: 12px; margin-bottom: 30px; }
  .tab-btn { background: rgba(255,255,255,0.05); color: #888; width: auto; padding: 10px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s; }
  .tab-btn.active { background: #fff; color: #000; border-color: #fff; }
  .tab-btn:hover:not(.active) { background: rgba(255,255,255,0.1); color: #fff; }
  
  .comment-box { background: rgba(0,0,0,0.5); border: 1px dashed #fff; padding: 12px; border-radius: 8px; margin-top: 12px; font-size: 13px; color: #ccc; }
  
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; } 
  @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
`;

// Скрипт для плавающих "желейных" кубиков
const bgScript = `
  <canvas id="bg-canvas"></canvas>
  <script>
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let mouse = { x: -1000, y: -1000 };
    let cubes = [];
    const spacing = 70; 
    const cubeSize = 24; // Маленькие кубики

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initCubes();
    }

    function initCubes() {
      cubes = [];
      for (let x = spacing/2; x < width; x += spacing) {
        for (let y = spacing/2; y < height; y += spacing) {
          cubes.push({ 
            x: x, y: y, 
            baseX: x, baseY: y, 
            vx: 0, vy: 0,
            // Случайная фаза для покачивания
            phase: Math.random() * Math.PI * 2,
            speed: 0.002 + Math.random() * 0.002
          });
        }
      }
    }

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    
    window.addEventListener('touchmove', (e) => {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    });

    function animate(time) {
      ctx.clearRect(0, 0, width, height);
      
      cubes.forEach(cube => {
        // 1. Эффект "плавания" (покачивание)
        let floatX = Math.sin(time * cube.speed + cube.phase) * 5;
        let floatY = Math.cos(time * cube.speed + cube.phase) * 5;
        
        let targetX = cube.baseX + floatX;
        let targetY = cube.baseY + floatY;

        // 2. Эффект "желе" при наведении мыши
        let dx = mouse.x - cube.x;
        let dy = mouse.y - cube.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let maxDist = 150;
        
        if (dist < maxDist) {
          let force = (maxDist - dist) / maxDist;
          // Отталкиваем кубик
          targetX -= (dx / dist) * force * 40;
          targetY -= (dy / dist) * force * 40;
        }

        // 3. Физика пружины (железность)
        let spring = 0.08; // Упругость
        let friction = 0.75; // Трение (чтобы не тряслось вечно)
        
        cube.vx += (targetX - cube.x) * spring;
        cube.vy += (targetY - cube.y) * spring;
        
        cube.vx *= friction;
        cube.vy *= friction;
        
        cube.x += cube.vx;
        cube.y += cube.vy;

        // Рисуем белый кубик со скругленными углами
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        ctx.shadowBlur = 10;
        
        // Рисуем квадрат (можно сделать скругление через roundRect)
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(cube.x - cubeSize/2, cube.y - cubeSize/2, cubeSize, cubeSize, 6);
        } else {
            ctx.rect(cube.x - cubeSize/2, cube.y - cubeSize/2, cubeSize, cubeSize);
        }
        ctx.fill();
        
        // Сброс тени, чтобы не было багов
        ctx.shadowBlur = 0;
      });

      requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(animate);
  </script>
`;

// --- РОУТЫ ---

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Подать заявку</title><style>${css}</style></head><body>${bgScript}<div class="container"><h2>Заявка в команду</h2>${req.query.error ? '<div class="alert">Заполните все обязательные поля!</div>' : ''}<form action="/apply" method="POST"><input name="name" placeholder="1. Ваше имя" required><input name="location" placeholder="2. Страна / Город" required><input name="roblox" placeholder="3. Ник в Roblox" required><input name="discord" placeholder="4. Discord (обязательно)" required><input name="telegram" placeholder="Telegram (необязательно)"><select name="role" required><option value="">Кем вы хотите быть?</option><option>Билдер</option><option>Скриптер</option><option>GUI-дизайнер</option><option>Аниматор</option><option>Тестер</option></select><input name="username" placeholder="Придумайте Логин" required><input name="password" type="password" placeholder="Придумайте Пароль" required><button type="submit">Отправить заявку</button></form><div class="link"><a href="/status">Проверить статус</a></div></div></body></html>`);
});

app.post('/apply', async (req, res) => {
  const { name, location, roblox, discord, telegram, role, username, password } = req.body;
  if (!name || !location || !roblox || !discord || !role || !username || !password) return res.redirect('/?error=1');

  try {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    const query = `INSERT INTO applications (name, location, roblox_nick, discord, telegram, role, username, password, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'На рассмотрении')`;
    await pool.query(query, [name, location, roblox, discord, telegram || null, role, cleanUsername, cleanPassword]);
    
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${bgScript}<div class="container"><h2 style="color:#fff">✅ Успешно!</h2><p style="text-align:center; color:#aaa;">Заявка отправлена.</p><div class="link"><a href="/status">Проверить статус</a></div></div></body></html>`);
  } catch (err) {
    console.error("Ошибка БД:", err);
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${bgScript}<div class="container"><h2 style="color:#ff7675">Ошибка базы данных</h2><div class="alert"><b>Текст:</b> ${err.message}</div><div class="link"><a href="/">← Назад</a></div></div></body></html>`);
  }
});

app.get('/status', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Статус</title><style>${css}</style></head><body>${bgScript}<div class="container"><h2>Проверка статуса</h2><form action="/status-check" method="POST"><input name="username" placeholder="Ваш логин" required><input name="password" type="password" placeholder="Ваш пароль" required><button type="submit">Проверить</button></form><div class="link"><a href="/">← Назад</a></div></div></body></html>`);
});

app.post('/status-check', async (req, res) => {
  const username = (req.body.username || '').trim();
  const password = (req.body.password || '').trim();
  
  try {
    const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2', [username, password]);
    
    if (rows.length === 0) {
      return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${bgScript}<div class="container"><h2>Ошибка</h2><div class="alert">Неверный логин или пароль.<br><br><b>Мы искали в базе:</b><br>Логин: "${username}"<br>Пароль: "${password}"</div><div class="link"><a href="/status">Назад</a></div></div></body></html>`);
    }
    
    const data = rows[0];
    let statusText = '⏳ На рассмотрении', cardClass = 'pending', extraText = '';
    
    if (data.status === 'Одобрено') { statusText = '✅ Одобрено! Вам поступит сообщение в Discord.'; cardClass = 'approved'; }
    if (data.status === 'Отклонено') { statusText = '❌ Отклонено.'; cardClass = 'rejected'; }

    if (data.admin_comment) {
      extraText = `<div class="comment-box"><b>Сообщение от куратора:</b><br>${data.admin_comment}</div>`;
    }

    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${bgScript}<div class="container"><h2>Ваша заявка</h2><div class="card ${cardClass}"><p><b>Имя:</b> ${data.name}</p><p><b>Роль:</b> ${data.role}</p><p><b>Статус:</b> <span class="badge ${cardClass}">${statusText}</span></p>${extraText}</div><div class="link"><a href="/status">Назад</a></div></div></body></html>`);
  } catch (err) {
    res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${bgScript}<div class="container"><h2>Ошибка сервера</h2><div class="alert">${err.message}</div><div class="link"><a href="/status">Назад</a></div></div></body></html>`);
  }
});

app.get('/admin', async (req, res) => {
  const pass = req.query.pass;
  const tab = req.query.tab || 'new';

  if (pass !== ADMIN_PASSWORD) return res.send(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${bgScript}<div class="container" style="max-width:380px; margin-top:120px;"><h2>Вход для админа</h2><form><input name="pass" type="password" placeholder="Пароль" required><button type="submit">Войти</button></form></div></body></html>`);
  
  try {
    let query = 'SELECT * FROM applications ORDER BY created_at DESC';
    if (tab === 'new') {
      query = `SELECT * FROM applications WHERE status = 'На рассмотрении' ORDER BY created_at DESC`;
    } else {
      query = `SELECT * FROM applications WHERE status != 'На рассмотрении' ORDER BY created_at DESC`;
    }

    const { rows: apps } = await pool.query(query);
    
    let html = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${bgScript}<div class="container wide-container">
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
