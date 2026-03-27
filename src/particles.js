// particles.js
// Subtle background particle animation on the Board tab.
// Depends on: state.js

import * as state from './state.js';


function initParticles() {
  const canvas  = document.getElementById('particle-canvas');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  state.setParticleBg(
    Array.from({ length: state.PARTICLE_COUNT }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     0.5 + Math.random() * 1.5,
      vx:    (Math.random() - 0.5) * 0.25,
      vy:    -0.15 - Math.random() * 0.25,
      alpha: 0.15 + Math.random() * 0.25,
    }))
  );
}

export function tickParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx    = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const p of state.particleBg) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.y < -2)                p.y = canvas.height + 2;
    if (p.x < -2)                p.x = canvas.width  + 2;
    if (p.x > canvas.width  + 2) p.x = -2;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle   = state.particleColor;
    ctx.globalAlpha = p.alpha;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (state.particleActive) {
    state.setParticleRaf(requestAnimationFrame(tickParticles));
  }
}

export function startParticles() {
  if (state.particleActive) return;
  state.setParticleActive(true);

  const canvas  = document.getElementById('particle-canvas');
  if (state.particleBg.length === 0) initParticles();
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.opacity = '1';

  tickParticles();
}

export function stopParticles() {
  state.setParticleActive(false);
  cancelAnimationFrame(state.particleRaf);
  document.getElementById('particle-canvas').style.opacity = '0';
}

// Reinitialise on window resize so particles fill the new dimensions
window.addEventListener('resize', () => {
  if (!state.particleActive) return;
  initParticles();
});