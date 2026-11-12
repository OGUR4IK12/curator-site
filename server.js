const express = require('express');
const { Pool } = require('pg');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2566';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'user_sessions',
    createTableIfNotExists: true
  }),
  secret: process.env.SESSION_SECRET || 'antarctica_secret_key_2566',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
}));

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  :root {
    --text: #ffffff; --text-sec: #8e8e93; --bg: #09090b;
    --card-bg: rgba(24, 24, 27, 0.85); --border: #27272a;
    --accent: #ffffff; --danger: #ff453a; --success: #32d74b; --warning: #ff9f0a; --blue: #0a84ff;
  }
  
  [data-theme="light"] {
    --text: #09090b; --text-sec: #52525b; --bg: #f4f4f5;
    --card-bg: rgba(255, 255, 255, 0.85); --border: #e4e4e7;
    --accent: #000000; --danger: #ef4444; --success: #10b981; --warning: #f59e0b; --blue: #007aff;
  }

  * { box-sizing: border-box; font-family: 'Inter', -apple-system, sans-serif; transition: background-color 0.2s, color 0.2s, border-color 0.2s; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  
  body { 
    background: var(--bg); color: var(--text); min-height: 100vh; display: flex; justify-content: center; align-items: center;
    background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 50px 50px;
    background-position: center center;
    overflow-x: hidden;
  }

  #cursor-glow { position: fixed; width: 800px; height: 800px; background: radial-gradient(circle, rgba(10, 132, 255, 0.08) 0%, transparent 60%); border-radius: 50%; pointer-events: none; z-index: 0; transform: translate(-50%, -50%); display: none; }
  @media (min-width: 768px) { #cursor-glow { display: block; } }
  [data-theme="light"] #cursor-glow { background: radial-gradient(circle, rgba(0, 0, 0, 0.03) 0%, transparent 60%); }

  /* Мобильная адаптация сообщений (скрываем на телефонах, чтобы не мешали) */
  .chat-side { position: fixed; top: 0; height: 100vh; width: 260px; z-index: 2; pointer-events: none; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; gap: 10px; padding: 20px; padding-bottom: 40px; }
  .chat-side.left { left: 0; align-items: flex-start; }
  .chat-side.right { right: 0; align-items: flex-end; }

  .tg-bubble { 
    background: rgba(135, 116, 225, 0.95); color: #ffffff; padding: 8px 12px; border-radius: 14px; 
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; font-size: 13px; 
    box-shadow: 0 4px 15px rgba(0,0,0,0.3); display: flex; flex-direction: column; gap: 4px;
    width: fit-content; max-width: 220px; opacity: 0;
  }

  .chat-side.left .tg-bubble { border-bottom-left-radius: 4px; }
  .chat-side.right .tg-bubble { border-bottom-right-radius: 4px; background: rgba(10, 132, 255, 0.9); }

  .tg-header { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
  .tg-avatar { width: 18px; height: 18px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; justify-content: center; align-items: center; font-size: 9px; font-weight: bold; }
  .tg-name { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.9); }
  .tg-text { font-size: 13px; line-height: 1.3; font-weight: 500; }
  .tg-meta { display: flex; justify-content: flex-end; align-items: center; gap: 4px; font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 2px; }
  .tg-checks { color: #ffffff; font-weight: bold; letter-spacing: -1px; }

  @media (max-width: 900px) { .chat-side { display: none; } }

  #bg-canvas { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 1; pointer-events: none; }

  .content-wrapper { position: relative; z-index: 10; width: 100%; display: flex; justify-content: center; align-items: center; padding: 16px; }

  .glass { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); backdrop-filter: blur(12px); }
  
  .container { padding: 24px; width: 100%; max-width: 480px; margin: 20px auto; position: relative; z-index: 10; }
  .wide-container { max-width: 1100px; width: 100%; }
  
  h1, h2, h3 { text-align: center; color: var(--text); margin-bottom: 24px; font-weight: 700; letter-spacing: -0.03em; }
  h1 { font-size: 28px; } h2 { font-size: 24px; } h3 { font-size: 18px; }

  @media (min-width: 768px) { h1 { font-size: 32px; } .container { padding: 40px; } }

  /* Плавные анимации появления (с помощью CSS, если Motion не загрузится) */
  .animate-in { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease; }
  .animate-in.visible { opacity: 1; transform: translateY(0); }

  input, select, textarea { 
    width: 100%; padding: 16px; margin-bottom: 16px; 
    background: var(--bg); border: 1px solid var(--border); border-radius: 12px; 
    font-size: 16px; /* 16px предотвращает зум на iPhone */
    color: var(--text); outline: none; transition: all 0.2s;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--text); }
  
  button { width: 100%; padding: 16px; background: var(--accent); color: var(--bg); border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
  button:hover { opacity: 0.8; }
  button:active { transform: scale(0.98); }

  .link { text-align: center; margin-top: 24px; font-size: 14px; }
  .link a { color: var(--text-sec); text-decoration: none; transition: color 0.2s; }
  .link a:hover { color: var(--text); }
  
  .alert { padding: 14px; border-radius: 10px; margin-bottom: 20px; text-align: center; font-size: 14px; background: rgba(255,69,58,0.1); color: var(--danger); border: 1px solid rgba(255,69,58,0.2); }
  
  .card { 
    padding: 20px; border-radius: 12px; margin-bottom: 16px; 
    background: var(--card-bg); border: 1px solid var(--border); 
    transition: border-color 0.2s, transform 0.2s; position: relative; backdrop-filter: blur(10px);
  }
  .card:hover { border-color: var(--text-sec); transform: translateY(-2px); }
  
  .badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; background: var(--bg); border: 1px solid var(--border); color: var(--text-sec); }
  .badge.pending { color: var(--warning); border-color: rgba(255,159,10,0.3); }
  .badge.approved { color: var(--success); border-color: rgba(50,215,75,0.3); }
  .badge.rejected { color: var(--danger); border-color: rgba(255,69,58,0.3); }
  .badge.taken { color: var(--blue); border-color: rgba(10,132,255,0.3); }
  
  .action-bar { display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap; }
  .action-btn { display: flex; align-items: center; justify-content: center; padding: 12px 16px; border-radius: 8px; background: var(--bg); border: 1px solid var(--border); cursor: pointer; transition: all 0.2s; text-decoration: none; font-size: 14px; font-weight: 500; color: var(--text); }
  .action-btn:hover { border-color: var(--text); }
  
  .main-menu { display: grid; grid-template-columns: 1fr; gap: 16px; width: 100%; max-width: 600px; margin: 0 auto; }
  .menu-panel { padding: 24px; display: flex; flex-direction: column; align-items: flex-start; text-decoration: none; color: var(--text); transition: all 0.2s; cursor: pointer; border-radius: 16px; background: var(--card-bg); border: 1px solid var(--border); backdrop-filter: blur(10px); }
  .menu-panel:hover { border-color: var(--text-sec); transform: translateY(-2px); }
  .menu-panel h2 { font-size: 20px; margin-bottom: 8px; text-align: left; }
  .menu-panel p { color: var(--text-sec); font-size: 14px; margin-bottom: 0; }

  .grid { display: grid; grid-template-columns: 1fr; gap: 16px; } 
  @media (min-width: 768px) { .grid { grid-template-columns: 1fr 1fr; } }
  .admin-grid { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start; }
  @media (min-width: 900px) { .admin-grid { grid-template-columns: 1fr 1fr; } }
  
  .worker-row { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-radius: 12px; margin-bottom: 12px; background: var(--card-bg); border: 1px solid var(--border); backdrop-filter: blur(10px); flex-wrap: wrap; gap: 12px; }
  
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
  @media (min-width: 768px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
  .stat-card { background: var(--card-bg); border: 1px solid var(--border); padding: 20px; border-radius: 12px; text-align: center; backdrop-filter: blur(10px); }
  .stat-val { font-size: 28px; font-weight: 700; color: var(--text); line-height: 1; margin-bottom: 8px; }
  .stat-lbl { font-size: 12px; color: var(--text-sec); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }

  .comments-box { margin-top: 16px; padding: 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; font-size: 13px; }
  .announcement { background: var(--card-bg); border: 1px solid var(--border); padding: 20px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid var(--blue); backdrop-filter: blur(10px); }
  
  .progress-bar { width: 100%; height: 6px; background: var(--bg); border-radius: 3px; margin-top: 16px; overflow: hidden; border: 1px solid var(--border); }
  .progress-fill { height: 100%; background: var(--text); border-radius: 3px; transition: width 0.5s; }
  
  .btn-danger { background: var(--danger); color: #fff; }
  .btn-success { background: var(--success); color: #fff; }

  .theme-toggle { position: fixed; top: 16px; right: 16px; width: 44px; height: 44px; border-radius: 50%; background: var(--card-bg); border: 1px solid var(--border); color: var(--text); display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 1000; font-size: 20px; backdrop-filter: blur(10px); }

  /* Адаптация админки под мобилки */
  .admin-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; justify-content: center; }
  @media (max-width: 600px) {
    .admin-tabs { flex-direction: column; }
    .admin-tabs .action-btn { width: 100%; padding: 14px; }
  }
`;

const scripts = `
  <div id="cursor-glow"></div>
  <div id="chat-left" class="chat-side left"></div>
  <div id="chat-right" class="chat-side right"></div>
  <canvas id="bg-canvas"></canvas>
  <button class="theme-toggle" onclick="toggleTheme()" id="theme-btn">🌓</button>

  <!-- Подключаем Motion (Framer Motion) для JS -->
  <script src="https://cdn.jsdelivr.net/npm/motion@11.11.13/dist/motion.js"></script>

  <script>
    const { animate, stagger, spring } = window.Motion || {};

    function toggleTheme() {
      const body = document.body;
      const isLight = body.getAttribute('data-theme') === 'light';
      body.setAttribute('data-theme', isLight ? '' : 'light');
      localStorage.setItem('theme', isLight ? '' : 'light');
    }
    if (localStorage.getItem('theme') === 'light') document.body.setAttribute('data-theme', 'light');

    const glow = document.getElementById('cursor-glow');
    window.addEventListener('mousemove', (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }, { passive: true });

    // --- АНИМАЦИИ (Framer Motion, если загрузился) ---
    document.addEventListener('DOMContentLoaded', () => {
      if (animate) {
        // Плавное появление карточек
        const elements = document.querySelectorAll('.menu-panel, .card, .glass.animate-in');
        if (elements.length > 0) {
          animate(
            elements,
            { opacity: [0, 1], y: [20, 0], scale: [0.95, 1] },
            { delay: stagger(0.1), duration: 0.6, ease: [0.16, 1, 0.3, 1] }
          );
        }
      } else {
        // Фоллбек, если Motion не загрузился
        document.querySelectorAll('.animate-in').forEach(el => el.classList.add('visible'));
      }

      // Пружинные кнопки
      if (animate && spring) {
        document.querySelectorAll('button, .action-btn').forEach(btn => {
          btn.addEventListener('mouseenter', () => animate(btn, { scale: 1.02 }, { type: spring, stiffness: 400, damping: 20 }));
          btn.addEventListener('mouseleave', () => animate(btn, { scale: 1 }, { type: spring, stiffness: 400, damping: 20 }));
          btn.addEventListener('mousedown', () => animate(btn, { scale: 0.96 }, { type: spring, stiffness: 400, damping: 20 }));
          btn.addEventListener('mouseup', () => animate(btn, { scale: 1.02 }, { type: spring, stiffness: 400, damping: 20 }));
        });
      }
    });

    // --- КУБИКИ (Canvas) ---
    if (!window.location.pathname.startsWith('/admin')) {
      const canvas = document.getElementById('bg-canvas');
      const ctx = canvas.getContext('2d', { alpha: true });
      let width, height, mouse = { x: -1000, y: -1000 }, cubes = [];
      
      const spacing = 50; 
      const cubeSize = 20;

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
              x, y, baseX: x, baseY: y, vx: 0, vy: 0, 
              phase: Math.random() * Math.PI * 2, 
              speed: 0.001 + Math.random() * 0.002 
            }); 
          } 
        } 
      }
      
      window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
      window.addEventListener('touchmove', (e) => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }, { passive: true });

      const isLightTheme = () => document.body.getAttribute('data-theme') === 'light';

      function animateCanvas(time) {
        ctx.clearRect(0, 0, width, height);
        
        const fillStyle = isLightTheme() ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)';
        const strokeStyleBase = isLightTheme() ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.15)';
        const strokeStyleHover = isLightTheme() ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.6)';
        
        ctx.fillStyle = fillStyle;

        cubes.forEach(cube => {
          let targetX = cube.baseX + Math.sin(time * cube.speed + cube.phase) * 8;
          let targetY = cube.baseY + Math.cos(time * cube.speed + cube.phase) * 8;
          
          let dx = mouse.x - cube.x, dy = mouse.y - cube.y;
          let distSq = dx * dx + dy * dy; 
          
          let isHovered = false;
          if (distSq < 22500) {
            let dist = Math.sqrt(distSq);
            let force = (150 - dist) / 150; 
            targetX -= (dx / dist) * force * 40; 
            targetY -= (dy / dist) * force * 40; 
            isHovered = true;
          }
          
          cube.vx += (targetX - cube.x) * 0.05; 
          cube.vy += (targetY - cube.y) * 0.05; 
          cube.vx *= 0.8; 
          cube.vy *= 0.8; 
          cube.x += cube.vx; 
          cube.y += cube.vy;

          ctx.beginPath(); 
          if (ctx.roundRect) {
            ctx.roundRect(cube.x - cubeSize/2, cube.y - cubeSize/2, cubeSize, cubeSize, 5); 
          } else {
            ctx.rect(cube.x - cubeSize/2, cube.y - cubeSize/2, cubeSize, cubeSize);
          }
          
          ctx.fill(); 
          
          ctx.strokeStyle = isHovered ? strokeStyleHover : strokeStyleBase;
          ctx.lineWidth = isHovered ? 2 : 1;
          ctx.stroke();
        });
        
        requestAnimationFrame(animateCanvas);
      }
      
      window.addEventListener('resize', resize); 
      resize(); 
      requestAnimationFrame(animateCanvas);
    }

    // --- СООБЩЕНИЯ С АНИМАЦИЕЙ ---
    if (!window.location.pathname.startsWith('/admin')) {
      const chatLeft = document.getElementById('chat-left');
      const chatRight = document.getElementById('chat-right');
      
      const team = [
        { name: 'Антон', initial: 'А' },
        { name: 'Маша', initial: 'М' },
        { name: 'Иван', initial: 'И' },
        { name: 'Оля', initial: 'О' }
      ];

      const messages = [
        "Ми быстро убираем баги",
        "Режим выживания в Антарктиде готов",
        "Подколи не стоило прыгать в сугроб...",
        "Фикс готов, деплой прошел",
        "Опять кто-то сломал сборку?",
        "Я нашел баг, но он меня нашел первым",
        "Кофе закончился, баги остались",
        "Пофиксили вылет на карте",
        "Кто забыл закрыть фигурную скобку?",
        "QA проверил, багов нет",
        "Добавили механики замерзания"
      ];

      function createMessage() {
        const el = document.createElement('div');
        el.className = 'tg-bubble';
        
        const user = team[Math.floor(Math.random() * team.length)];
        const text = messages[Math.floor(Math.random() * messages.length)];
        const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        el.innerHTML = 
          '<div class="tg-header">' +
            '<div class="tg-avatar">' + user.initial + '</div>' +
            '<div class="tg-name">' + user.name + '</div>' +
          '</div>' +
          '<div class="tg-text">' + text + '</div>' +
          '<div class="tg-meta">' + 
            time + ' <span class="tg-checks">✓✓</span>' + 
          '</div>';

        const isLeft = Math.random() > 0.5;
        if (isLeft) {
          chatLeft.appendChild(el);
        } else {
          chatRight.appendChild(el);
        }

        if (animate) {
          animate(el, { opacity: [0, 1], y: [20, 0], scale: [0.9, 1] }, { duration: 0.5, ease: [0.16, 1, 0.3, 1] });
        } else {
          el.style.opacity = '1';
        }

        setTimeout(() => {
          if (animate) {
            animate(el, { opacity: 0, y: -20, scale: 0.9 }, { duration: 0.3, ease: "easeIn" }).finished.then(() => {
              if (el.parentNode) el.remove();
            });
          } else {
            el.remove();
          }
        }, 8000);
      }

      setTimeout(() => {
        createMessage();
        setInterval(createMessage, 2000);
      }, 1000);
    }
  </script>
`;

const renderDashboard = async (user, res, message = '') => {
  const { rows: tasks } = await pool.query(`
    SELECT * FROM tasks 
    WHERE (role = $1 OR role = 'all' OR role = $2) 
    AND status != 'Удалено' 
    AND (completed_at IS NULL OR completed_at > NOW() - INTERVAL '24 hours') 
    ORDER BY created_at DESC
  `, [user.role, user.username]);
  
  const { rows: ann } = await pool.query(`SELECT * FROM announcements ORDER BY created_at DESC LIMIT 1`);
  const announcement = ann.length > 0 ? `<div class="announcement animate-in"><h3>${ann[0].title}</h3><p>${ann[0].content}</p></div>` : '';

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Кабинет</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container wide-container animate-in">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; flex-wrap: wrap; gap: 16px;">
      <div>
        <h2 style="text-align:left; margin:0; font-size:24px;">${user.name}</h2>
        <p style="color:var(--text-sec); font-size:14px; margin-top:4px;">${user.role} · Очки: <b style="color:var(--warning);">${user.points}</b></p>
      </div>
      <div style="display:flex; gap:8px; flex-wrap: wrap;">
        <button onclick="document.getElementById('settings-modal').style.display='flex'" class="action-btn">Настройки</button>
        <a href="/logout" class="action-btn">Выйти</a>
      </div>
    </div>
    ${message ? `<div class="alert" style="background:rgba(50,215,75,0.1); color:var(--success); border-color:rgba(50,215,75,0.2);">${message}</div>` : ''}
    ${announcement}
    <div class="grid">`;
  
  if (tasks.length === 0) html += `<p style="text-align:center; color:var(--text-sec); grid-column: 1/-1; padding:40px;">Для вас пока нет активных задач.</p>`;
  else {
    tasks.forEach((task, i) => {
      let badgeClass = 'pending', badgeText = 'Свободна'; let actionHtml = ''; let deadlineHtml = '';
      if (task.deadline) { const d = new Date(task.deadline).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); deadlineHtml = `<p style="font-size:12px; color:var(--danger); margin-bottom:12px; font-weight:600;">Дедлайн: ${d}</p>`; }
      if (task.status === 'Свободна') { actionHtml = `<form action="/task/take" method="POST"><input type="hidden" name="task_id" value="${task.id}"><button type="submit" style="width:100%;">Взять задачу</button></form>`; }
      else if (task.status === 'В работе') {
        if (task.taken_by === user.username) { badgeClass = 'taken'; badgeText = 'В работе'; actionHtml = `<form action="/task/done" method="POST" enctype="multipart/form-data" style="margin-top:16px;"><input type="hidden" name="task_id" value="${task.id}"><input type="file" name="proof" required style="padding:10px; font-size:13px; margin-bottom:12px; border-radius:8px;"><button type="submit" class="btn-success" style="width:100%;">Отправить на проверку</button></form>`; }
        else { badgeClass = 'taken'; badgeText = 'В работе'; actionHtml = `<p style="color:var(--text-sec); font-size:13px; font-weight:500; padding-top:12px; border-top:1px solid var(--border); margin-top:16px;">Взял: ${task.taken_by}</p>`; }
      } else if (task.status === 'Выполнено') { badgeClass = 'approved'; badgeText = 'На проверке'; actionHtml = `<p style="color:var(--success); font-size:13px; font-weight:500; padding-top:12px; border-top:1px solid var(--border); margin-top:16px;">Сдал: ${task.taken_by}</p>`; }
      
      let taskType = '';
      if (task.role === 'all') taskType = '<span class="badge" style="color:var(--blue); border-color:var(--blue);">Всем</span>';
      else if (task.role === user.username) taskType = '<span class="badge" style="color:var(--warning); border-color:var(--warning);">Лично</span>';
      else taskType = `<span class="badge">${task.role}</span>`;

      html += `<div class="card ${badgeClass} animate-in delay-${Math.min(i+1, 3)}"><div style="display:flex; gap:8px; flex-wrap: wrap;">${taskType}<span class="badge ${badgeClass}">${badgeText}</span></div><h3 style="margin-top:12px; text-align:left; font-size:16px;">${task.title}</h3>${deadlineHtml}<p style="color:var(--text-sec); font-size:14px; margin-bottom:16px; line-height:1.5;">${task.description}</p>${actionHtml}`;
      if (task.comments) html += `<div class="comments-box"><b>Чат:</b><br><span style="color:var(--text-sec)">${task.comments.replace(/\n/g, '<br>')}</span></div>`;
      html += `</div>`;
    });
  }
  
  html += `</div>
  <div id="settings-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); backdrop-filter:blur(5px); z-index:10000; justify-content:center; align-items:center; padding: 16px;">
    <div class="glass" style="max-width:400px; width:100%; padding:32px; position:relative;">
      <button onclick="document.getElementById('settings-modal').style.display='none'" style="position:absolute; top:16px; right:16px; background:transparent; border:none; color:var(--text-sec); font-size:24px; cursor:pointer; width:auto;">&times;</button>
      <h3 style="text-align:center; margin-bottom:24px;">Сменить пароль</h3>
      <form action="/change-password" method="POST">
        <input type="password" name="old_password" placeholder="Старый пароль" required>
        <input type="password" name="new_password" placeholder="Новый пароль" required>
        <button type="submit" style="width:100%;">Обновить</button>
      </form>
    </div>
  </div>
  </div></body></html>`;
  res.send(html);
};

// --- РОУТЫ ---

app.get('/', (req, res) => { 
  if (req.session.user) return res.redirect('/dashboard');
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Survival in Antarctica</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="main-menu"><a href="/login" class="menu-panel animate-in delay-1"><h2>Сотрудникам</h2><p>Вход в кабинет для получения задач</p></a><a href="/apply" class="menu-panel animate-in delay-2"><h2>Соискателям</h2><p>Подать заявку в команду</p></a><a href="/check-status" class="menu-panel animate-in delay-3"><h2>Проверка статуса</h2><p>Узнать, рассмотрели ли вашу заявку</p></a></div></div></body></html>`); 
});

app.get('/apply', (req, res) => { res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Подать заявку</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="text-align:center; margin-bottom:24px;">Заявка в команду</h2>${req.query.error ? '<div class="alert">Заполните все обязательные поля!</div>' : ''}<form action="/apply" method="POST"><input name="name" placeholder="Ваше имя" required><input name="location" placeholder="Страна / Город" required><input name="roblox" placeholder="Ник в Roblox" required><input name="discord" placeholder="Discord" required><input name="telegram" placeholder="Telegram (необязательно)"><select name="role" required><option value="" disabled selected hidden>Кем вы хотите быть?</option><option>Билдер</option><option>Скриптер</option><option>GUI-дизайнер</option><option>Аниматор</option><option>Тестер</option></select><input name="username" placeholder="Логин для входа" required><input name="password" type="password" placeholder="Пароль для входа" required><button type="submit">Отправить заявку</button></form><div class="link"><a href="/">← На главную</a></div></div></div></body></html>`); });

app.post('/apply', async (req, res) => { const { name, location, roblox, discord, telegram, role, username, password } = req.body; if (!name || !location || !roblox || !discord || !role || !username || !password) return res.redirect('/apply?error=1'); try { await pool.query(`INSERT INTO applications (name, location, roblox_nick, discord, telegram, role, username, password, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'На рассмотрении')`, [name, location, roblox, discord, telegram || null, role, username.trim(), password.trim()]); res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="color:var(--success); text-align:center;">Успешно!</h2><p style="color:var(--text-sec); text-align:center; margin-bottom:24px;">Заявка отправлена. Мы свяжемся с вами после рассмотрения.</p><div class="link"><a href="/">← На главную</a></div></div></div></body></html>`); } catch (err) { res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="color:var(--danger); text-align:center;">Ошибка</h2><div class="alert">Этот логин уже занят.</div><div class="link"><a href="/apply">← Назад</a></div></div></div></body></html>`); } });

app.get('/check-status', (req, res) => { res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Статус заявки</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="text-align:center; margin-bottom:24px;">Статус заявки</h2><form action="/check-status" method="POST"><input name="username" placeholder="Логин" required><input name="password" type="password" placeholder="Пароль" required><button type="submit">Проверить</button></form><div class="link"><a href="/">← На главную</a></div></div></div></body></html>`); });

app.post('/check-status', async (req, res) => { const username = (req.body.username || '').trim(); const password = (req.body.password || '').trim(); try { const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2 AND is_deleted = false', [username, password]); if (rows.length === 0) { return res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="text-align:center;">Ошибка</h2><div class="alert">Неверный логин или пароль.</div><div class="link"><a href="/check-status">← Назад</a></div></div></div></body></html>`); } const data = rows[0]; let statusText = 'На рассмотрении', cardClass = 'pending', extraText = ''; if (data.status === 'Одобрено') { statusText = 'Одобрено. Добро пожаловать в команду.'; cardClass = 'approved'; } if (data.status === 'Отклонено') { statusText = 'Отклонено.'; cardClass = 'rejected'; } if (data.admin_comment) { extraText = `<div class="comments-box" style="color:var(--danger); margin-top:16px;"><b>Комментарий куратора:</b><br>${data.admin_comment}</div>`; } res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="text-align:center;">Ваша заявка</h2><div class="card ${cardClass}" style="margin-top:24px;"><span class="badge ${cardClass}">${statusText}</span><p style="margin:12px 0 8px;"><b>Имя:</b> ${data.name}</p><p style="margin:0 0 16px;"><b>Роль:</b> ${data.role}</p>${extraText}</div><div class="link"><a href="/check-status">← Назад</a></div></div></div></body></html>`); } catch (err) { res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="text-align:center;">Ошибка</h2><div class="alert">${err.message}</div><div class="link"><a href="/check-status">← Назад</a></div></div></div></body></html>`); } });

app.get('/login', (req, res) => { 
  if (req.session.user) return res.redirect('/dashboard');
  res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Вход</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="text-align:center; margin-bottom:24px;">Вход для сотрудников</h2><form action="/login" method="POST"><input name="username" placeholder="Логин" required><input name="password" type="password" placeholder="Пароль" required><button type="submit">Войти в кабинет</button></form><div class="link"><a href="/">← На главную</a></div></div></div></body></html>`); 
});

app.post('/login', async (req, res) => { 
  const { username, password } = req.body; 
  try { 
    const { rows } = await pool.query('SELECT * FROM applications WHERE username = $1 AND password = $2 AND is_deleted = false', [username.trim(), password.trim()]); 
    if (rows.length === 0) return res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="text-align:center;">Ошибка</h2><div class="alert">Неверный логин или пароль.</div><div class="link"><a href="/login">← Назад</a></div></div></div></body></html>`); 
    const user = rows[0]; 
    if (user.status !== 'Одобрено') return res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in"><h2 style="text-align:center;">Доступ закрыт</h2><div class="alert">Ваша заявка еще не одобрена.</div><div class="link"><a href="/">← На главную</a></div></div></div></body></html>`); 
    
    req.session.user = user;
    res.redirect('/dashboard');
  } catch (err) { res.status(500).send('Ошибка сервера'); } 
});

app.get('/dashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const { rows } = await pool.query('SELECT * FROM applications WHERE id = $1', [req.session.user.id]);
    if (rows.length === 0) { req.session.destroy(); return res.redirect('/login'); }
    req.session.user = rows[0];
    await renderDashboard(req.session.user, res);
  } catch (err) { res.status(500).send('Ошибка сервера'); }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => { res.redirect('/'); });
});

app.post('/change-password', async (req, res) => { 
  if (!req.session.user) return res.redirect('/login');
  const { old_password, new_password } = req.body; 
  if (req.session.user.password !== old_password) {
    return res.send('<script>alert("Старый пароль неверный"); history.back();</script>');
  }
  await pool.query('UPDATE applications SET password = $1 WHERE id = $2', [new_password.trim(), req.session.user.id]); 
  req.session.user.password = new_password.trim();
  await renderDashboard(req.session.user, res, 'Пароль успешно изменен!'); 
});

app.post('/task/take', async (req, res) => { 
  if (!req.session.user) return res.redirect('/login');
  const { task_id } = req.body; 
  await pool.query("UPDATE tasks SET status = 'В работе', taken_by = $1 WHERE id = $2", [req.session.user.username, task_id]); 
  await renderDashboard(req.session.user, res); 
});

app.post('/task/done', (req, res) => { 
  if (!req.session.user) return res.redirect('/login');
  let chunks = []; 
  req.on('data', chunk => chunks.push(chunk)); 
  req.on('end', async () => { 
    const buffer = Buffer.concat(chunks); 
    const boundary = req.headers['content-type'].split('boundary=')[1]; 
    const parts = buffer.toString('binary').split('--' + boundary); 
    let task_id, proofBase64 = '', filename = 'file'; 
    for (let part of parts) { 
      if (part.includes('name="task_id"')) task_id = part.split('\r\n\r\n')[1].split('\r\n')[0]; 
      if (part.includes('name="proof"')) { 
        const nameMatch = part.match(/filename="(.*)"/); 
        if (nameMatch) filename = nameMatch[1]; 
        const matches = part.match(/Content-Type: (.*)\r\n\r\n([\s\S]*)\r\n$/); 
        if (matches) { proofBase64 = `data:${matches[1]};base64,${Buffer.from(matches[2], 'binary').toString('base64')}`; } 
      } 
    } 
    if (task_id) { 
      await pool.query("UPDATE tasks SET status = 'Выполнено', completed_at = NOW(), proof_file = $1, proof_filename = $2 WHERE id = $3 AND taken_by = $4", [proofBase64, filename, task_id, req.session.user.username]); 
      await renderDashboard(req.session.user, res); 
    } else { 
      res.redirect('/dashboard'); 
    } 
  }); 
});

// АДМИН-ПАНЕЛЬ
app.get('/admin', async (req, res) => { 
  const pass = req.query.pass; 
  const tab = req.query.tab || 'dash'; 
  if (pass !== ADMIN_PASSWORD) {
    return res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Вход в админку</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container glass animate-in" style="max-width:380px; margin-top:120px;"><h2 style="text-align:center;">Вход для админа</h2><form><input name="pass" type="password" placeholder="Пароль" required><button type="submit">Войти</button></form></div></div></body></html>`);
  }
  
  try { 
    const stats = await pool.query(`SELECT (SELECT COUNT(*) FROM applications WHERE status = 'Одобрено' AND is_deleted = false) as workers, (SELECT COUNT(*) FROM applications WHERE status = 'На рассмотрении' AND is_deleted = false) as new_apps, (SELECT COUNT(*) FROM tasks WHERE status = 'В работе') as in_work, (SELECT COUNT(*) FROM tasks WHERE status = 'Выполнено') as on_review`); 
    const s = stats.rows[0]; 
    
    const { rows: allWorkers } = await pool.query("SELECT username, name FROM applications WHERE status = 'Одобрено' AND is_deleted = false ORDER BY name ASC");
    
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Админ-панель</title><style>${css}</style></head><body>${scripts}<div class="content-wrapper"><div class="container wide-container animate-in">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; flex-direction: column; align-items: flex-start; gap: 16px;">
      <h2 style="text-align:left; margin:0; font-size:24px;">Админ-панель</h2>
      <div class="admin-tabs">
        <a href="/admin?pass=${pass}&tab=dash" class="action-btn ${tab === 'dash' ? 'active' : ''}" style="${tab === 'dash' ? 'background:var(--text); color:var(--bg);' : ''}">Обзор</a>
        <a href="/admin?pass=${pass}&tab=announcements" class="action-btn ${tab === 'announcements' ? 'active' : ''}" style="${tab === 'announcements' ? 'background:var(--text); color:var(--bg);' : ''}">Объявления</a>
        <a href="/admin?pass=${pass}&tab=tasks" class="action-btn ${tab === 'tasks' ? 'active' : ''}" style="${tab === 'tasks' ? 'background:var(--text); color:var(--bg);' : ''}">Задачи</a>
        <a href="/admin?pass=${pass}&tab=applications" class="action-btn ${tab === 'applications' ? 'active' : ''}" style="${tab === 'applications' ? 'background:var(--text); color:var(--bg);' : ''}">Заявки</a>
        <a href="/admin?pass=${pass}&tab=workers" class="action-btn ${tab === 'workers' ? 'active' : ''}" style="${tab === 'workers' ? 'background:var(--text); color:var(--bg);' : ''}">Сотрудники</a>
        <a href="/admin?pass=${pass}&tab=trash" class="action-btn ${tab === 'trash' ? 'active' : ''}" style="${tab === 'trash' ? 'background:var(--text); color:var(--bg);' : ''}">Корзина</a>
      </div>
    </div>`;

    if (tab === 'dash') { 
      html += `<div class="stats-grid animate-in delay-1"><div class="stat-card"><div class="stat-val">${s.workers}</div><div class="stat-lbl">Сотрудников</div></div><div class="stat-card"><div class="stat-val">${s.new_apps}</div><div class="stat-lbl">Новых заявок</div></div><div class="stat-card"><div class="stat-val">${s.in_work}</div><div class="stat-lbl">В работе</div></div><div class="stat-card"><div class="stat-val">${s.on_review}</div><div class="stat-lbl">На проверке</div></div></div>`; 
      const totalTasks = parseInt(s.in_work) + parseInt(s.on_review); 
      const progress = totalTasks === 0 ? 0 : Math.round((s.on_review / totalTasks) * 100); 
      html += `<div class="card animate-in delay-2"><div style="display:flex; justify-content:space-between; align-items:center;"><h3 style="margin:0; font-size:15px;">Прогресс</h3><span style="font-size:13px; font-weight:600;">${progress}%</span></div><div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div></div>`; 
      const { rows: topWorkers } = await pool.query("SELECT * FROM applications WHERE status = 'Одобрено' AND is_deleted = false ORDER BY points DESC LIMIT 5"); 
      html += `<div class="admin-col animate-in delay-3" style="margin-top:32px;"><h3 style="text-align:left; font-size:16px;">Топ сотрудников</h3>`; 
      topWorkers.forEach((w) => { html += `<div class="worker-row"><div><p style="margin:0; font-size:15px; font-weight:600;"><b>${w.name}</b></p><p style="margin:4px 0 0; color:var(--text-sec); font-size:12px;">${w.role}</p></div><div style="font-size:15px; font-weight:700;">${w.points} очк.</div></div>`; }); 
      html += `</div>`; 
    }

    else if (tab === 'announcements') {
      html += `<div class="card animate-in"><h3 style="text-align:left; font-size:16px;">Новое объявление</h3><form action="/admin/announcement" method="POST" style="margin-top:16px;"><input type="hidden" name="pass" value="${pass}"><input name="title" placeholder="Заголовок" required><textarea name="content" placeholder="Текст..." rows="3" required></textarea><button type="submit" style="width:100%;">Опубликовать</button></form></div>`;
      const { rows: anns } = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
      html += `<div class="grid">`;
      anns.forEach(ann => { html += `<div class="card"><div style="display:flex; justify-content:space-between; align-items:start; flex-wrap: wrap; gap: 8px;"><div><h3 style="margin-top:0; text-align:left; font-size:16px;">${ann.title}</h3><p style="font-size:14px; color:var(--text-sec);">${ann.content}</p></div><form action="/admin/delete-announcement" method="POST" onsubmit="return confirm('Удалить?');"><input type="hidden" name="id" value="${ann.id}"><input type="hidden" name="pass" value="${pass}"><button type="submit" class="action-btn" style="color:var(--danger); border-color:var(--border);">Удалить</button></form></div></div>`; });
      html += `</div>`;
    }

    else if (tab === 'tasks') {
      const { rows: tasksList } = await pool.query("SELECT * FROM tasks WHERE status != 'Удалено' ORDER BY created_at DESC");
      
      let workerOptions = allWorkers.map(w => `<option value="${w.username}">${w.name} (${w.username})</option>`).join('');
      
      html += `<div class="card animate-in"><h3 style="text-align:left; font-size:16px;">Создать задачу</h3>
      <form action="/admin/task/add" method="POST" style="margin-top:16px;">
        <input type="hidden" name="pass" value="${pass}">
        <input name="title" placeholder="Название задачи" required>
        <textarea name="description" placeholder="Описание задачи..." rows="3" required></textarea>
        
        <select name="target" required>
          <option value="" disabled selected hidden>Кому выдать задачу?</option>
          <option value="all">Всем сотрудникам</option>
          <optgroup label="Отделу">
            <option value="Билдер">Билдеры</option>
            <option value="Скриптер">Скриптеры</option>
            <option value="GUI-дизайнер">GUI-дизайнеры</option>
            <option value="Аниматор">Аниматоры</option>
            <option value="Тестер">Тестеры</option>
          </optgroup>
          <optgroup label="Лично сотруднику">
            ${workerOptions}
          </optgroup>
        </select>

        <input type="datetime-local" name="deadline">
        <button type="submit">Создать задачу</button>
      </form></div>`;
      
      html += `<h3 style="text-align:left; margin-top:32px; font-size:16px;">Список задач</h3>`;
      tasksList.forEach(t => {
        let proofBlock = t.proof_file ? `<a href="${t.proof_file}" download="${t.proof_filename || 'proof'}" class="action-btn" style="margin-top:12px;">Скачать отчет (${t.proof_filename || 'файл'})</a>` : '';
        
        let targetLabel = t.role;
        if (t.role === 'all') targetLabel = 'Всем';
        else if (!['Билдер', 'Скриптер', 'GUI-дизайнер', 'Аниматор', 'Тестер'].includes(t.role)) {
           const w = allWorkers.find(x => x.username === t.role);
           if (w) targetLabel = `Лично: ${w.name}`;
        }

        html += `<div class="card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap: wrap; gap: 8px;">
            <div>
              <span class="badge ${t.status === 'Выполнено' ? 'approved' : 'pending'}">${t.status}</span>
              <span class="badge">${targetLabel}</span>
            </div>
            <form action="/admin/task/delete" method="POST" onsubmit="return confirm('Удалить задачу?');" style="margin:0;">
              <input type="hidden" name="pass" value="${pass}">
              <input type="hidden" name="id" value="${t.id}">
              <button type="submit" class="action-btn" style="color:var(--danger); border-color:var(--border);">Удалить</button>
            </form>
          </div>
          <h3 style="text-align:left; margin-top:12px; font-size:16px;">${t.title}</h3>
          <p style="color:var(--text-sec); font-size:14px;">${t.description}</p>
          <p style="font-size:14px; margin-top:8px;"><b>Исполнитель:</b> ${t.taken_by || 'Никто'}</p>
          ${proofBlock}`;
        if (t.status === 'Выполнено') {
          html += `<div style="display:flex; gap:10px; margin-top:16px; flex-wrap: wrap;"><form action="/admin/task/approve" method="POST"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="task_id" value="${t.id}"><button type="submit" class="btn-success">Принять</button></form><form action="/admin/task/reject" method="POST"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="task_id" value="${t.id}"><button type="submit" class="btn-danger">На доработку</button></form></div>`;
        }
        html += `</div>`;
      });
    }

    else if (tab === 'applications') {
      const { rows: apps } = await pool.query("SELECT * FROM applications WHERE status = 'На рассмотрении' AND is_deleted = false");
      html += `<h3 style="text-align:left; font-size:16px;">Новые заявки</h3>`;
      if (apps.length === 0) html += `<p style="color:var(--text-sec);">Нет новых заявок.</p>`;
      apps.forEach(a => {
        html += `<div class="card"><h3 style="text-align:left; margin-top:0; font-size:16px;">${a.name} (${a.role})</h3><p style="font-size:14px; margin-top:8px;"><b>Roblox:</b> ${a.roblox_nick} | <b>Discord:</b> ${a.discord}</p><p style="font-size:14px;"><b>Логин:</b> ${a.username}</p><div style="display:flex; gap:10px; margin-top:16px; flex-wrap: wrap;"><form action="/admin/app/approve" method="POST"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="id" value="${a.id}"><button type="submit" class="btn-success">Одобрить</button></form><form action="/admin/app/reject" method="POST" style="flex:1; display:flex; gap:8px; flex-wrap: wrap;"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="id" value="${a.id}"><input name="comment" placeholder="Причина" required style="margin:0; padding:10px; flex: 1;"><button type="submit" class="btn-danger" style="width:auto;">Отклонить</button></form></div></div>`;
      });
    }

    else if (tab === 'workers') {
      const { rows: workers } = await pool.query("SELECT * FROM applications WHERE status = 'Одобрено' AND is_deleted = false ORDER BY role ASC");
      html += `<h3 style="text-align:left; font-size:16px;">Активные сотрудники (${workers.length})</h3>`;
      if (workers.length === 0) html += `<p style="color:var(--text-sec);">Пока никого нет.</p>`;
      
      workers.forEach(w => {
        html += `<div class="worker-row" style="align-items: flex-start;">
          <div style="flex: 1;">
            <p style="margin:0; font-size:16px; font-weight:600;"><b>${w.name}</b> (${w.role})</p>
            <p style="margin:8px 0 0 0; font-size:13px; color:var(--text-sec); line-height:1.6;">
              <b>Город:</b> ${w.location} <br>
              <b>Discord:</b> ${w.discord} <br>
              <b>TG:</b> ${w.telegram || 'Нет'} <br>
              <b>Roblox:</b> ${w.roblox_nick} <br>
              <b>Логин:</b> ${w.username} | <b>Очки:</b> ${w.points}
            </p>
          </div>
          <form action="/admin/worker/fire" method="POST" style="margin-top: 4px; width: auto;">
            <input type="hidden" name="pass" value="${pass}">
            <input type="hidden" name="id" value="${w.id}">
            <button type="submit" class="btn-danger" style="padding:8px 12px; font-size:12px; width:auto;">Уволить</button>
          </form>
        </div>`;
      });
    }

    else if (tab === 'trash') {
      const { rows: trash } = await pool.query("SELECT * FROM applications WHERE is_deleted = true");
      html += `<h3 style="text-align:left; font-size:16px;">Корзина</h3>`;
      if (trash.length === 0) html += `<p style="color:var(--text-sec);">Корзина пуста.</p>`;
      trash.forEach(tr => {
        html += `<div class="worker-row"><div style="flex: 1;"><p style="margin:0; font-size:15px; font-weight:600;"><b>${tr.name}</b> (${tr.role})</p><p style="margin:4px 0 0; color:var(--text-sec); font-size:12px;">Статус: ${tr.status}</p></div><div style="display:flex; gap:10px; flex-wrap: wrap;"><form action="/admin/worker/restore" method="POST"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="id" value="${tr.id}"><button type="submit" class="btn-success" style="padding:8px 12px; font-size:12px; width:auto;">Восстановить</button></form><form action="/admin/worker/delete-forever" method="POST" onsubmit="return confirm('УДАЛИТЬ НАВСЕГДА?');"><input type="hidden" name="pass" value="${pass}"><input type="hidden" name="id" value="${tr.id}"><button type="submit" class="btn-danger" style="padding:8px 12px; font-size:12px; width:auto;">Удалить</button></form></div></div>`;
      });
    }

    html += `</div></div></body></html>`;
    res.send(html);
  } catch (err) {
    res.status(500).send('Ошибка админ-панели: ' + err.message);
  }
});

app.post('/admin/announcement', async (req, res) => {
  const { pass, title, content } = req.body;
  await pool.query('INSERT INTO announcements (title, content) VALUES ($1, $2)', [title, content]);
  res.redirect(`/admin?pass=${pass}&tab=announcements`);
});

app.post('/admin/task/add', async (req, res) => {
  const { pass, title, description, target, deadline } = req.body;
  await pool.query('INSERT INTO tasks (title, description, role, deadline, status) VALUES ($1, $2, $3, $4, $5)', [title, description, target, deadline || null, 'Свободна']);
  res.redirect(`/admin?pass=${pass}&tab=tasks`);
});

app.post('/admin/task/approve', async (req, res) => {
  const { pass, task_id } = req.body;
  const { rows } = await pool.query("SELECT * FROM tasks WHERE id = $1", [task_id]);
  if (rows.length > 0) {
    const task = rows[0];
    await pool.query("UPDATE tasks SET status = 'Завершено' WHERE id = $1", [task_id]);
    await pool.query("UPDATE applications SET points = points + 10 WHERE username = $1", [task.taken_by]);
  }
  res.redirect(`/admin?pass=${pass}&tab=tasks`);
});

app.post('/admin/task/reject', async (req, res) => {
  const { pass, task_id } = req.body;
  await pool.query("UPDATE tasks SET status = 'В работе', proof_file = NULL, proof_filename = NULL WHERE id = $1", [task_id]);
  res.redirect(`/admin?pass=${pass}&tab=tasks`);
});

app.post('/admin/task/delete', async (req, res) => {
  const { pass, id } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query("UPDATE tasks SET status = 'Удалено' WHERE id = $1", [id]);
  res.redirect(`/admin?pass=${pass}&tab=tasks`);
});

app.post('/admin/app/approve', async (req, res) => {
  const { pass, id } = req.body;
  await pool.query("UPDATE applications SET status = 'Одобрено' WHERE id = $1", [id]);
  res.redirect(`/admin?pass=${pass}&tab=applications`);
});

app.post('/admin/app/reject', async (req, res) => {
  const { pass, id, comment } = req.body;
  await pool.query("UPDATE applications SET status = 'Отклонено', admin_comment = $1, is_deleted = true WHERE id = $2", [comment, id]);
  res.redirect(`/admin?pass=${pass}&tab=applications`);
});

app.post('/admin/worker/fire', async (req, res) => {
  const { pass, id } = req.body;
  await pool.query("UPDATE applications SET is_deleted = true, status = 'Уволен' WHERE id = $1", [id]);
  res.redirect(`/admin?pass=${pass}&tab=workers`);
});

app.post('/admin/worker/restore', async (req, res) => {
  const { pass, id } = req.body;
  await pool.query("UPDATE applications SET is_deleted = false, status = 'Одобрено' WHERE id = $1", [id]);
  res.redirect(`/admin?pass=${pass}&tab=trash`);
});

app.post('/admin/worker/delete-forever', async (req, res) => {
  const { pass, id } = req.body;
  await pool.query("DELETE FROM applications WHERE id = $1", [id]);
  res.redirect(`/admin?pass=${pass}&tab=trash`);
});

app.post('/admin/delete-announcement', async (req, res) => {
  const { id, pass } = req.body;
  if (pass !== ADMIN_PASSWORD) return res.status(403).send('Нет доступа');
  await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
  res.redirect('/admin?pass=' + pass + '&tab=announcements');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
