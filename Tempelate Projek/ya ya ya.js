
/*
  Neon Galaxy Home — single-file
  - Canvas draws stars (twinkle), moving parallax layers, comets
  - CSS planets float via JS transform
  - Buttons link to /explore, /login, /daftar (can change)
  - Accessible, prefers-reduced-motion aware
*/

(function(){
  const canvas = document.getElementById('space');
  const ctx = canvas.getContext('2d', { alpha: true });
  let w = 0, h = 0, DPR = Math.max(1, window.devicePixelRatio || 1);
  const stars = [];
  const comets = [];
  const STAR_LAYERS = 3;

  function resize(){
    w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }

  window.addEventListener('resize', resize);
  resize();

  // Utility
  function rand(min,max){ return Math.random()*(max-min)+min; }

  // Build starfield
  function initStars(){
    stars.length = 0;
    for(let layer=0; layer<STAR_LAYERS; layer++){
      const count = Math.floor((50 + layer*80) * (w/1200));
      for(let i=0;i<count;i++){
        stars.push({
          x: rand(0,w),
          y: rand(0,h),
          baseR: rand(0.3, 1.6)/(layer+0.5),
          layer,
          twinkle: rand(0.2,1),
          phase: rand(0, Math.PI*2),
          speed: 0.01 + layer*0.03
        });
      }
    }
  }

  // Comet prototype
  function spawnComet(){
    const fromTop = Math.random() < 0.5;
    const x = fromTop ? rand(0,w*0.6) : rand(w*0.4,w);
    const y = fromTop ? rand(0,h*0.4) : rand(h*0.4,h);
    const vx = rand( -2.2, -0.6 );
    const vy = rand( -1.1, -0.2 );
    comets.push({
      x, y, vx, vy,
      len: rand(80, 220),
      life: 0,
      maxLife: rand(150, 360),
      glow: rand(0.06,0.18)
    });
    // Keep comet count modest
    if(comets.length > 10) comets.shift();
  }

  // Planets floating simple animation (transform via JS)
  const planetA = document.getElementById('planet-a');
  const planetB = document.getElementById('planet-b');
  const planetC = document.getElementById('planet-c');

  // Respect reduced-motion
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Render loop
  let t0 = performance.now();
  function frame(t){
    const dt = (t - t0) / 1000;
    t0 = t;

    // clear (soft gradient overlay)
    ctx.clearRect(0,0,w,h);

    // subtle nebula radial glow center
    const g = ctx.createRadialGradient(w*0.2, h*0.2, 40, w*0.6, h*0.4, Math.max(w,h));
    g.addColorStop(0, 'rgba(126,249,182,0.02)');
    g.addColorStop(0.45, 'rgba(155,140,255,0.02)');
    g.addColorStop(1, 'rgba(2,6,20,0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    // Draw stars
    for(let i=0;i<stars.length;i++){
      const s = stars[i];
      // twinkle
      s.phase += s.speed * (reduce ? 0.1 : 1) * dt * 60;
      const tval = 0.5 + Math.sin(s.phase * s.twinkle) * 0.5;
      const r = s.baseR * (0.8 + tval*0.6);
      const alpha = Math.min(1, 0.3 + tval*0.7);

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.arc(s.x, s.y, r, 0, Math.PI*2);
      ctx.fill();
    }

    // Parallax subtle shift (gently move stars by layer)
    const time = t * 0.00005;
    for(let i=0;i<stars.length;i++){
      const s = stars[i];
      s.x += (s.layer+1) * Math.sin(time + s.layer) * 0.02;
      s.y += (s.layer+1) * Math.cos(time + s.layer) * 0.01;
      // wrap
      if(s.x < -10) s.x = w + 10;
      if(s.x > w + 10) s.x = -10;
      if(s.y < -10) s.y = h + 10;
      if(s.y > h + 10) s.y = -10;
    }

    // Draw comets
    for(let i=comets.length-1;i>=0;i--){
      const c = comets[i];
      c.x += c.vx * (reduce ? 0.3 : 1) * dt * 60;
      c.y += c.vy * (reduce ? 0.3 : 1) * dt * 60;
      c.life++;
      // tail gradient
      const grad = ctx.createLinearGradient(c.x, c.y, c.x - c.vx*c.len, c.y - c.vy*c.len);
      grad.addColorStop(0, `rgba(255,255,255,${0.9*c.glow})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x - c.vx*c.len, c.y - c.vy*c.len);
      ctx.stroke();

      // head
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,0.95)`;
      ctx.arc(c.x, c.y, 2.6, 0, Math.PI*2);
      ctx.fill();

      if(c.life > c.maxLife || c.x < -200 || c.y < -200 || c.x > w+200 || c.y > h+200){
        comets.splice(i,1);
      }
    }

    // occasionally spawn comets
    if(Math.random() < 0.006 && comets.length < 3 && !reduce) spawnComet();

    // animate planets (float + rotate)
    const now = performance.now() * 0.001;
    if(!reduce){
      planetA.style.transform = `translate3d(${Math.sin(now*0.32)*18}px, ${Math.cos(now*0.21)*12}px, 0) rotate(${now*6}deg)`;
      planetB.style.transform = `translate3d(${Math.cos(now*0.43)*10}px, ${Math.sin(now*0.35)*8}px, 0) rotate(${now*12}deg)`;
      planetC.style.transform = `translate3d(${Math.sin(now*0.21)*6}px, ${Math.cos(now*0.14)*6}px, 0) rotate(${now*4}deg)`;
    }

    requestAnimationFrame(frame);
  }

  // Start
  initStars();
  requestAnimationFrame(frame);

  // Mouse parallax subtle for card
  const card = document.querySelector('.card');
  let mouseX = 0, mouseY = 0;
  let cx = window.innerWidth/2, cy = window.innerHeight/2;

  function onMove(e){
    const rect = document.body.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) - cx;
    mouseY = (e.clientY - rect.top) - cy;
    if(!reduce){
      card.style.transform = `translate3d(${mouseX*0.003}px, ${mouseY*0.002}px, 0)`;
    }
  }
  window.addEventListener('mousemove', onMove);

  // Accessibility: keyboard focus styles already exist; add key handler for enter on focused btns
  document.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){
      const active = document.activeElement;
      if(active && active.classList.contains('btn')){
        active.click();
      }
    }
  });

  // Optional: gentle intro animation
  if(!reduce){
    card.style.opacity = 0;
    card.style.transform = 'translateY(18px)';
    setTimeout(()=>{
      card.animate([{ opacity:0, transform:'translateY(18px)' }, { opacity:1, transform:'translateY(0)' }], {duration:650, easing:'cubic-bezier(.2,.9,.3,1)'});
      card.style.opacity = 1;
      card.style.transform = 'translateY(0)';
    }, 120);
  }

  // Responsive: re-init stars on big resize (throttle)
  let resTimer = null;
  window.addEventListener('resize', function(){
    clearTimeout(resTimer);
    resTimer = setTimeout(function(){
      resize();
      initStars();
    }, 220);
  });

  // Minimal degrade for browsers without canvas support
  if(!ctx){
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.inset = 0;
    el.style.background = 'linear-gradient(180deg,#02101b,#041226)';
    el.innerHTML = '';
    document.body.appendChild(el);
  }

  // (Optional) click handlers already use hrefs; if you want SPA style routing, intercept clicks here.
})();

document.querySelector('#register-btn').addEventListener('click', e=>{
  e.preventDefault();

  // efek warp lembut
  const warp = document.createElement('div');
  warp.style.position = 'fixed';
  warp.style.inset = 0;
  warp.style.background = 'radial-gradient(circle at center, rgba(255,255,255,0.6), rgba(0,0,0,1))';
  warp.style.transition = 'opacity 1s ease';
  warp.style.opacity = '0';
  warp.style.zIndex = '9999';
  document.body.appendChild(warp);

  // mulai efek fade
  requestAnimationFrame(() => warp.style.opacity = '1');

  // setelah 1 detik, pindah ke halaman daftar
  setTimeout(() => window.location.href = 'daftar.html', 1000);
});