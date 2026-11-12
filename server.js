const scripts = `
  <div id="cursor-glow"></div>
  <canvas id="bg-canvas"></canvas>
  <button class="theme-toggle" onclick="toggleTheme()" id="theme-btn">🌓</button>

  <script src="https://cdn.jsdelivr.net/npm/motion@11.11.13/dist/motion.js"></script>
  <script>
    const { animate, stagger, inView } = window.Motion || {};

    function toggleTheme() {
      const body = document.body;
      const isLight = body.getAttribute('data-theme') === 'light';
      body.setAttribute('data-theme', isLight ? '' : 'light');
      localStorage.setItem('theme', isLight ? '' : 'light');
    }
    if (localStorage.getItem('theme') === 'light') document.body.setAttribute('data-theme', 'light');

    // --- ФУНКЦИЯ АНИМАЦИИ ТЕКСТА (Аналог Magic UI TextAnimate) ---
    function animateText(element, text, animationType = 'blurInUp', by = 'character') {
      if (!element || !animate) return;
      
      // Разбиваем текст
      let segments = [];
      if (by === 'character') segments = text.split('');
      else if (by === 'word') segments = text.split(/(\s+)/);
      else segments = [text];

      element.innerHTML = '';
      element.style.display = 'flex';
      element.style.flexWrap = 'wrap';
      element.style.justifyContent = 'center';

      const spans = segments.map(seg => {
        const span = document.createElement('span');
        span.textContent = seg === ' ' ? '\\u00A0' : seg;
        span.style.display = 'inline-block';
        span.style.willChange = 'transform, opacity, filter';
        element.appendChild(span);
        return span;
      });

      // Анимация (как в Magic UI: blurInUp)
      if (animationType === 'blurInUp') {
        animate(spans, 
          { opacity: [0, 1], y: [20, 0], filter: ['blur(10px)', 'blur(0px)'] },
          { delay: stagger(0.03), duration: 0.6, ease: [0.16, 1, 0.3, 1] }
        );
      } else if (animationType === 'slideUp') {
        animate(spans, 
          { opacity: [0, 1], y: [30, 0] },
          { delay: stagger(0.05), duration: 0.5, ease: 'easeOut' }
        );
      } else {
        // Fallback fadeIn
        animate(spans, { opacity: [0, 1] }, { delay: stagger(0.03), duration: 0.4 });
      }
    }

    // --- ЗАПУСК АНИМАЦИИ ДЛЯ ГЛАВНОГО ЗАГОЛОВКА ---
    document.addEventListener('DOMContentLoaded', () => {
      const heroTitle = document.querySelector('.hero h1');
      if (heroTitle) {
        const text = heroTitle.textContent.trim();
        // Запускаем анимацию по буквам с эффектом blurInUp
        animateText(heroTitle, text, 'blurInUp', 'character');
      }

      // Анимация карточек при скролле
      if (inView) {
        document.querySelectorAll('.section').forEach(section => {
          inView(section, (info) => {
            animate(info.target.querySelectorAll('.idea-card, .menu-panel'), 
              { opacity: [0, 1], y: [30, 0] }, 
              { delay: stagger(0.1), duration: 0.8, ease: [0.16, 1, 0.3, 1] }
            );
          }, { margin: '-100px' });
        });
      }
    });

    // --- 3D КАРТОЧКИ ---
    document.querySelectorAll('.idea-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        card.style.transform = \`perspective(1000px) rotateX(\${rotateX}deg) rotateY(\${rotateY}deg) scale3d(1.02, 1.02, 1.02)\`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      });
    });

    // --- КУБИКИ ---
    if (!window.location.pathname.startsWith('/admin')) {
      const canvas = document.getElementById('bg-canvas');
      const ctx = canvas.getContext('2d', { alpha: true });
      let width, height, mouse = { x: -1000, y: -1000 }, cubes = [];
      const spacing = 50, cubeSize = 20;
      function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; initCubes(); }
      function initCubes() { cubes = []; for (let x = spacing/2; x < width; x += spacing) { for (let y = spacing/2; y < height; y += spacing) { cubes.push({ x, y, baseX: x, baseY: y, vx: 0, vy: 0, phase: Math.random() * Math.PI * 2, speed: 0.001 + Math.random() * 0.002 }); } } }
      window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
      window.addEventListener('touchmove', (e) => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }, { passive: true });
      function animateCanvas(time) {
        ctx.clearRect(0, 0, width, height);
        const isLight = document.body.getAttribute('data-theme') === 'light';
        ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)';
        cubes.forEach(cube => {
          let targetX = cube.baseX + Math.sin(time * cube.speed + cube.phase) * 8;
          let targetY = cube.baseY + Math.cos(time * cube.speed + cube.phase) * 8;
          let dx = mouse.x - cube.x, dy = mouse.y - cube.y, distSq = dx * dx + dy * dy;
          if (distSq < 22500) { let dist = Math.sqrt(distSq); let force = (150 - dist) / 150; targetX -= (dx / dist) * force * 40; targetY -= (dy / dist) * force * 40; }
          cube.vx += (targetX - cube.x) * 0.05; cube.vy += (targetY - cube.y) * 0.05; cube.vx *= 0.8; cube.vy *= 0.8; cube.x += cube.vx; cube.y += cube.vy;
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(cube.x - cubeSize/2, cube.y - cubeSize/2, cubeSize, cubeSize, 5); else ctx.rect(cube.x - cubeSize/2, cube.y - cubeSize/2, cubeSize, cubeSize);
          ctx.fill();
        });
        requestAnimationFrame(animateCanvas);
      }
      window.addEventListener('resize', resize); resize(); requestAnimationFrame(animateCanvas);
    }
  </script>
`;
