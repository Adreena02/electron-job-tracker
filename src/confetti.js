// confetti.js
// Canvas-based confetti burst, fired when a new job is added.
// Depends on: state.js

import * as state from './state.js';


export function launchConfetti(originEl) {
  const canvas  = document.getElementById('confetti-canvas');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const rect = originEl?.getBoundingClientRect();
  const cx = rect ? rect.left + rect.width  / 2 : canvas.width  / 2;
  const cy = rect ? rect.top  + rect.height / 2 : canvas.height / 2;

  state.setConfettiParticles(
    Array.from({ length: 100 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        color:  state.CONFETTI_COLORS[Math.floor(Math.random() * state.CONFETTI_COLORS.length)],
        w:     6 + Math.random() * 6,
        h:     4 + Math.random() * 4,
        rot:   Math.random() * Math.PI * 2,
        rotV:  (Math.random() - 0.5) * 0.3,
        alpha: 1,
        circle: Math.random() < 0.5,
      };
    })
  );

  if (state.confettiRaf) cancelAnimationFrame(state.confettiRaf);
  tickConfetti(canvas.getContext('2d'), canvas.width, canvas.height);
}

function tickConfetti(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  let alive = false;

  for (const p of state.confettiParticles) {
    p.vy    += 0.25;
    p.vx    *= 0.99;
    p.x     += p.vx;
    p.y     += p.vy;
    p.rot   += p.rotV;
    p.alpha -= 0.012;
    if (p.alpha <= 0) continue;
    alive = true;

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = p.color;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);

    if (p.circle) {
      ctx.beginPath();
      ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }

    ctx.restore();
  }

  if (alive) {
    state.setConfettiRaf(requestAnimationFrame(() => tickConfetti(ctx, w, h)));
  } else {
    ctx.clearRect(0, 0, w, h);
  }
}