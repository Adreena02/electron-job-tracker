// timeline.js
// Timeline tab — feed view and calendar view.
// Depends on: state.js, utils.js, modal.js (lazy)

import * as state from './state.js';
import { formatDate, todayISO } from './utils.js';


// Build a flat sorted list of all events across all jobs

function allEvents() {
  const events = [];

  for (const job of state.jobs) {
    if (job.date) {
      events.push({ date: job.date, type: 'applied', job });
    }
    if (job.interviewDate) {
      events.push({ date: job.interviewDate, type: 'interview', job });
    }
    if (job.applyBy && !state.RESOLVED_STATUSES.includes(job.status)) {
      events.push({ date: job.applyBy, type: 'applyBy', job });
    }
    if (job.hearBackBy && !state.RESOLVED_STATUSES.includes(job.status)) {
      events.push({ date: job.hearBackBy, type: 'hearBackBy', job });
    }
    for (const entry of (job.activity || [])) {
      if (entry.type === 'status') {
        events.push({ date: entry.date, type: 'status', from: entry.from, to: entry.to, job });
      }
    }
  }

  return events.sort((a, b) => b.date.localeCompare(a.date));
}

function eventLabel(ev) {
  if (ev.type === 'applied')    return `Applied to ${ev.job.company}`;
  if (ev.type === 'interview')  return `Interview at ${ev.job.company}`;
  if (ev.type === 'status')     return `${ev.job.company} moved to ${ev.to}`;
  if (ev.type === 'applyBy')    return `Apply by deadline — ${ev.job.company}`;
  if (ev.type === 'hearBackBy') return `Hear back from ${ev.job.company}`;
  return '';
}

function eventColor(ev) {
  if (ev.type === 'interview') return '#34D399';
  if (ev.type === 'applyBy' || ev.type === 'hearBackBy') {
    const today   = todayISO();
    const warnDay = new Date(Date.now() + state.WARN_DAYS * 86400000).toISOString().slice(0, 10);
    if (ev.date < today)    return '#FB7185';
    if (ev.date <= warnDay) return '#FBBF24';
    return '#38BDF8';
  }
  const status = ev.type === 'status' ? ev.to : ev.job.status;
  return state.STATUS_CFG[status]?.color || '#94A3B8';
}


// Tab switching

export function switchTimelineView(view) {
  state.setTimelineView(view);
  document.getElementById('tl-feed-btn').classList.toggle('active', view === 'feed');
  document.getElementById('tl-cal-btn').classList.toggle('active',  view === 'cal');
  document.getElementById('tl-feed').style.display = view === 'feed' ? 'block' : 'none';
  document.getElementById('tl-cal').style.display  = view === 'cal'  ? 'block' : 'none';
  renderTimeline();
}

export function renderTimeline() {
  if (state.timelineView === 'feed') renderFeed();
  else renderCal();
}


// Feed view

function renderFeed() {
  const events = allEvents();
  const el     = document.getElementById('tl-feed');

  if (!events.length) {
    el.innerHTML = '<div class="feed-empty">No events yet — start adding applications!</div>';
    return;
  }

  el.innerHTML = '<div class="feed-list">' +
    events.map((ev, i) => `
      <div class="feed-item" data-open-job="${ev.job.id}">
        <div class="feed-dot-wrap">
          <div class="feed-dot" style="background:${eventColor(ev)}"></div>
          ${i < events.length - 1 ? '<div class="feed-line"></div>' : ''}
        </div>
        <div class="feed-content">
          <div class="feed-title">${eventLabel(ev)}</div>
          <div class="feed-sub">${ev.job.role}${ev.job.location ? ' · ' + ev.job.location : ''}</div>
        </div>
        <div class="feed-date">${formatDate(ev.date)}</div>
      </div>
    `).join('') +
  '</div>';
}


// Calendar view

function renderCal() {
  const el     = document.getElementById('tl-cal');
  const events = allEvents();
  const byDate = {};
  for (const ev of events) {
    (byDate[ev.date] = byDate[ev.date] || []).push(ev);
  }

  const today     = todayISO();
  const firstDay  = new Date(state.calYear, state.calMonth, 1);
  const lastDay   = new Date(state.calYear, state.calMonth + 1, 0);
  const startDow  = firstDay.getDay();
  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const days = [];
  for (let i = 0; i < startDow; i++) {
    const d = new Date(state.calYear, state.calMonth, -startDow + i + 1);
    days.push({ date: d.toISOString().slice(0, 10), other: true });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(state.calYear, state.calMonth, d).toISOString().slice(0, 10), other: false });
  }
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({ date: new Date(state.calYear, state.calMonth + 1, d).toISOString().slice(0, 10), other: true });
  }

  const dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  el.innerHTML = `
    <div class="cal-header">
      <button class="cal-nav" data-cal-nav="-1">‹</button>
      <span class="cal-month-label">${monthName}</span>
      <button class="cal-today-btn" data-cal-today>Today</button>
      <button class="cal-nav" data-cal-nav="1">›</button>
    </div>
    <div class="cal-grid">
      ${dows.map(d => `<div class="cal-dow">${d}</div>`).join('')}
      ${days.map(day => {
        const evs    = byDate[day.date] || [];
        const isToday = day.date === today;
        const isOpen  = state.openCalDay === day.date && evs.length;
        return `
          <div class="cal-day${day.other ? ' other-month' : ''}${isToday ? ' today' : ''}${evs.length ? ' has-events' : ''}"
            ${evs.length ? `data-toggle-cal-day="${day.date}"` : ''}>
            <div class="cal-day-num">${parseInt(day.date.slice(8))}</div>
            ${evs.slice(0, 2).map(ev =>
              `<div class="cal-chip" style="background:${eventColor(ev)}22;color:${eventColor(ev)}">${eventLabel(ev)}</div>`
            ).join('')}
            ${evs.length > 2 ? `<div style="font-size:9px;color:var(--text3);font-weight:700">+${evs.length - 2} more</div>` : ''}
          </div>
        `;
      }).join('')}
      ${state.openCalDay && byDate[state.openCalDay] ? `
        <div class="cal-popover open">
          <div class="cal-popover-title">${formatDate(state.openCalDay)}</div>
          ${(byDate[state.openCalDay] || []).map(ev => `
            <div class="cal-popover-item" data-open-job="${ev.job.id}">
              <div class="feed-dot" style="background:${eventColor(ev)};flex-shrink:0"></div>
              <span class="cal-popover-label">${eventLabel(ev)} — ${ev.job.role}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

export function toggleCalDay(date) {
  state.setOpenCalDay(state.openCalDay === date ? null : date);
  renderCal();
}

export function calNav(dir) {
  let m = state.calMonth + dir;
  let y = state.calYear;
  if (m > 11) { m = 0;  y++; }
  if (m < 0)  { m = 11; y--; }
  state.setCalMonth(m);
  state.setCalYear(y);
  state.setOpenCalDay(null);
  renderCal();
}

export function calToday() {
  const now = new Date();
  state.setCalYear(now.getFullYear());
  state.setCalMonth(now.getMonth());
  state.setOpenCalDay(null);
  renderCal();
}