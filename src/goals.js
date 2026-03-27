// goals.js
// Goals tab rendering, goal counting, target updates, and mood tracker.
// Depends on: state.js, storage.js, utils.js

import * as state from './state.js';
import { persistGoals, persistMoods } from './storage.js';
import { weekRange, todayISO } from './utils.js';


// Goal counting

function monthRange() {
  const now  = new Date();
  const y    = now.getFullYear();
  const m    = String(now.getMonth() + 1).padStart(2, '0');
  const last = new Date(y, now.getMonth() + 1, 0).getDate();
  return [`${y}-${m}-01`, `${y}-${m}-${String(last).padStart(2, '0')}`];
}

function countGoal(type) {
  if (type === 'weekly') {
    const [start, end] = weekRange();
    return state.jobs.filter(j => j.status === 'Applied' && j.date >= start && j.date <= end).length;
  }
  if (type === 'monthly') {
    const [start, end] = monthRange();
    return state.jobs.filter(j => j.status === 'Applied' && j.date >= start && j.date <= end).length;
  }
  if (type === 'interviews') {
    const [start, end] = monthRange();
    return state.jobs.filter(j => j.interviewDate && j.interviewDate >= start && j.interviewDate <= end).length;
  }
  if (type === 'offers') {
    return state.jobs.filter(j => j.status === 'Offer').length;
  }
  return 0;
}

function goalColor(current, target) {
  const pct = target > 0 ? current / target : 0;
  if (pct >= 1)    return '#34D399';
  if (pct >= 0.75) return '#FBBF24';
  return 'var(--accent)';
}

function goalStatusText(current, target) {
  const pct = target > 0 ? current / target : 0;
  if (current >= target) return 'Goal reached! 🎉';
  if (pct >= 0.75)       return 'Almost there — keep going! 🔥';
  if (pct >= 0.5)        return 'Halfway there 💪';
  if (current > 0)       return 'Good start — keep it up!';
  return 'Not started yet';
}


// Goals tab (full view)

export function renderGoals() {
  const defs = [
    { key: 'weekly',     label: 'Weekly applications',   period: 'Resets every Monday' },
    { key: 'monthly',    label: 'Monthly applications',  period: 'Resets 1st of each month' },
    { key: 'interviews', label: 'Interviews this month', period: 'Resets 1st of each month' },
    { key: 'offers',     label: 'Total offers',          period: 'All time' },
  ];

  document.getElementById('goalsGrid').innerHTML = defs.map(def => {
    const current = countGoal(def.key);
    const target  = state.goalTargets[def.key];
    const pct     = Math.min(100, target > 0 ? Math.round(current / target * 100) : 0);
    const color   = goalColor(current, target);

    return `
      <div class="goal-card">
        <div class="goal-card-top">
          <span class="goal-label">${def.label}</span>
          <span class="goal-period">${def.period}</span>
        </div>
        <div class="goal-count">${current} <span>/ ${target}</span></div>
        <div class="goal-track"><div class="goal-fill" style="width:${pct}%;background:${color}"></div></div>
        <div class="goal-status">${goalStatusText(current, target)}</div>
        <div class="goal-edit-row">
          <span class="goal-target-label">Target:</span>
          <input class="goal-target-input" type="number" min="1" value="${target}"
            data-goal-key="${def.key}">
        </div>
      </div>
    `;
  }).join('');
}

export function updateGoalTarget(key, val) {
  const n = Math.max(1, parseInt(val) || 1);
  state.goalTargets[key] = n;
  persistGoals(state.goalTargets);
  renderGoals();
  renderGoalsWidget();
}


// Goals widget (shown on Stats tab)

export function renderGoalsWidget() {
  const el = document.getElementById('goalsWidget');
  if (!el) return;

  const defs = [
    { key: 'weekly',     label: 'Weekly applications' },
    { key: 'monthly',    label: 'Monthly applications' },
    { key: 'interviews', label: 'Interviews this month' },
    { key: 'offers',     label: 'Total offers' },
  ];

  el.innerHTML = `
    <div class="goals-widget-title">Goals</div>
    ${defs.map(def => {
      const current = countGoal(def.key);
      const target  = state.goalTargets[def.key];
      const pct     = Math.min(100, target > 0 ? Math.round(current / target * 100) : 0);
      const color   = goalColor(current, target);
      return `
        <div class="goal-mini-row">
          <div class="goal-mini-label">${def.label}</div>
          <div class="goal-mini-track"><div class="goal-mini-fill" style="width:${pct}%;background:${color}"></div></div>
          <div class="goal-mini-val">${current}/${target}</div>
        </div>
      `;
    }).join('')}
    <div style="margin-top:10px;font-size:11px;color:var(--text3);font-weight:600">
      Edit targets in the <span style="color:var(--accent);cursor:pointer;font-weight:700"
        data-switch-tab="goals">Goals tab →</span>
    </div>
  `;
}


// Mood tracker

export function logMood(emoji) {
  state.moodLog[todayISO()] = emoji;
  persistMoods(state.moodLog);
  renderMoodWidget();
}

export function renderMoodWidget() {
  const el = document.getElementById('moodWidget');
  if (!el) return;

  const today     = todayISO();
  const todayMood = state.moodLog[today];

  const history = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (state.moodLog[key]) {
      history.push({
        key,
        emoji: state.moodLog[key],
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
  }

  const historyHtml = history.length > 1 ? `
    <div style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-top:14px;margin-bottom:6px">Last 14 days</div>
    <div class="mood-history">
      ${history.map(h => `
        <div class="mood-day" title="${h.label}">
          <div class="mood-day-emoji">${h.emoji}</div>
          <div class="mood-day-date">${h.label.split(' ')[1]}</div>
        </div>
      `).join('')}
    </div>` : '';

  el.innerHTML = `
    <div class="chart-title" style="margin-bottom:6px">How are you feeling today?</div>
    <div style="font-size:11px;font-weight:600;color:var(--text3);margin-bottom:4px">
      ${todayMood
        ? `You logged ${todayMood} today. You can change it any time.`
        : 'Tap to log your mood — just between you and the app.'}
    </div>
    <div class="mood-emojis">
      ${state.MOODS.map(m => `
        <button class="mood-emoji ${todayMood === m.emoji ? 'selected' : ''}"
          data-log-mood="${m.emoji}" title="${m.label}">${m.emoji}</button>
      `).join('')}
    </div>
    ${historyHtml}
  `;
}