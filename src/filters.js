// filters.js
// All filter and search logic — state toggles, pill rendering,
// filteredJobs(), and the industry select in the modal.
// Depends on: state.js, storage.js, utils.js

import * as state from './state.js';
import { persistIndustries, persistHideInactive } from './storage.js';
import { parseSalary } from './utils.js';


// Industry helpers

export function allIndustries() {
  return [...state.DEFAULT_INDUSTRIES, ...state.customIndustries];
}

export function usedIndustries() {
  return [...new Set(state.jobs.map(j => j.industry).filter(Boolean))];
}

export function populateIndustrySelect(current) {
  const sel = document.getElementById('f-industry');
  if (!sel) return;

  const industries = allIndustries();
  sel.innerHTML =
    `<option value="">— None —</option>` +
    industries.map(i => `<option value="${i}" ${i === current ? 'selected' : ''}>${i}</option>`).join('') +
    `<option value="__custom__">Custom...</option>`;

  // If current value isn't in the list (custom from a previous session), add it
  if (current && !industries.includes(current)) {
    sel.innerHTML += `<option value="${current}" selected>${current}</option>`;
  }
}

export function handleIndustryChange(sel) {
  if (sel.value !== '__custom__') return;

  const name = window.prompt('Enter industry name:')?.trim();
  if (name) {
    if (!allIndustries().includes(name)) {
      state.customIndustries.push(name);
      persistIndustries(state.customIndustries);
    }
    populateIndustrySelect(name);
  } else {
    sel.value = '';
  }
}


// Core filter logic

export function filteredJobs() {
  const used = usedIndustries();

  return state.jobs.filter(job => {
    if (!state.activeStatuses.has(job.status))   return false;
    if (!state.activeWorktypes.has(job.worktype)) return false;
    if (job.industry && used.length && !state.activeIndustries.has(job.industry)) return false;

    if (state.searchQuery) {
      const haystack = `${job.company} ${job.role}`.toLowerCase();
      if (!haystack.includes(state.searchQuery)) return false;
    }

    if (state.salaryMin !== null || state.salaryMax !== null) {
      const mid = parseSalary(job.salary);
      if (mid < 0) return false;
      if (state.salaryMin !== null && mid < state.salaryMin) return false;
      if (state.salaryMax !== null && mid > state.salaryMax) return false;
    }

    return true;
  });
}

export function hasActiveFilters() {
  return state.searchQuery !== '' ||
    state.salaryMin !== null ||
    state.salaryMax !== null ||
    state.activeStatuses.size  < state.STATUSES.length ||
    state.activeWorktypes.size < 3 ||
    state.activeIndustries.size < usedIndustries().length;
}


// Filter pill rendering

export function buildFilterPills() {
  const statusEl   = document.getElementById('statusFilters');
  const worktypeEl = document.getElementById('worktypeFilters');
  const industryEl = document.getElementById('industryFilters');

  statusEl.innerHTML = state.STATUSES.map(s => `
    <button class="filter-pill ${state.activeStatuses.has(s) ? 'active' : ''}"
      data-filter-status="${s}">${state.STATUS_CFG[s].emoji} ${s}</button>
  `).join('');

  worktypeEl.innerHTML = '';
  ['Remote', 'Hybrid', 'On-site'].forEach(w => {
    const btn = document.createElement('button');
    btn.className   = `filter-pill ${state.activeWorktypes.has(w) ? 'active' : ''}`;
    btn.textContent = w;
    btn.dataset.filterWorktype = w;
    worktypeEl.appendChild(btn);
  });

  const used = usedIndustries();
  const row  = document.getElementById('industryFilterRow');
  if (row) row.style.display = used.length ? 'flex' : 'none';

  if (industryEl) {
    // Sync activeIndustries — add newly seen industries, remove ones no longer present
    used.forEach(i => { if (!state.activeIndustries.has(i)) state.activeIndustries.add(i); });
    [...state.activeIndustries].forEach(i => { if (!used.includes(i)) state.activeIndustries.delete(i); });

    industryEl.innerHTML = used.map(i => `
      <button class="filter-pill ${state.activeIndustries.has(i) ? 'active' : ''}"
        data-filter-industry="${i}">${i}</button>
    `).join('');
  }
}


// Toggle handlers

export function toggleStatusFilter(status) {
  state.activeStatuses.has(status)
    ? state.activeStatuses.delete(status)
    : state.activeStatuses.add(status);
  buildFilterPills();
  applyFilters();
}

export function toggleWorktypeFilter(worktype) {
  state.activeWorktypes.has(worktype)
    ? state.activeWorktypes.delete(worktype)
    : state.activeWorktypes.add(worktype);
  buildFilterPills();
  applyFilters();
}

export function toggleIndustryFilter(industry) {
  state.activeIndustries.has(industry)
    ? state.activeIndustries.delete(industry)
    : state.activeIndustries.add(industry);
  buildFilterPills();
  applyFilters();
}

export function toggleHideInactive() {
  state.setHideInactive(!state.hideInactive);
  persistHideInactive(state.hideInactive);

  if (state.hideInactive) {
    state.activeStatuses.delete('Rejected');
    state.activeStatuses.delete('Ghosted');
  } else {
    state.activeStatuses.add('Rejected');
    state.activeStatuses.add('Ghosted');
  }

  buildFilterPills();
  updateHideInactiveBtn();
  updateFilterCount();

  // Imported lazily to avoid circular dependency with render.js
  import('./render.js').then(({ render }) => render());
}


// UI update helpers

export function expandFilters() {
  document.getElementById('filterBar').classList.add('expanded');
}

export function collapseFilters() {
  if (!hasActiveFilters()) {
    document.getElementById('filterBar').classList.remove('expanded');
  }
}

export function applyFilters() {
  state.setSearchQuery(document.getElementById('searchInput').value.trim().toLowerCase());
  state.setSalaryMin(parseFloat(document.getElementById('salaryMin').value) || null);
  state.setSalaryMax(parseFloat(document.getElementById('salaryMax').value) || null);

  if (hasActiveFilters()) expandFilters();
  updateFilterCount();

  import('./render.js').then(({ render }) => render());
}

export function clearFilters() {
  state.setActiveStatuses(new Set(state.STATUSES));
  state.setActiveWorktypes(new Set(['Remote', 'Hybrid', 'On-site']));
  state.setActiveIndustries(new Set(usedIndustries()));
  state.setSearchQuery('');
  state.setSalaryMin(null);
  state.setSalaryMax(null);
  state.setHideInactive(false);
  persistHideInactive(false);

  document.getElementById('searchInput').value = '';
  document.getElementById('salaryMin').value   = '';
  document.getElementById('salaryMax').value   = '';
  document.getElementById('filterBar').classList.remove('expanded');

  buildFilterPills();
  updateHideInactiveBtn();
  updateFilterCount();

  import('./render.js').then(({ render }) => render());
}

export function updateHideInactiveBtn() {
  const btn = document.getElementById('hideInactiveBtn');
  if (!btn) return;
  btn.classList.toggle('active', state.hideInactive);
  btn.textContent = state.hideInactive ? 'Show inactive' : 'Hide inactive';
}

export function updateFilterCount() {
  const used     = usedIndustries();
  const inactive =
    (state.STATUSES.length   - state.activeStatuses.size) +
    (3                        - state.activeWorktypes.size) +
    (used.length              - state.activeIndustries.size) +
    (state.searchQuery        ? 1 : 0) +
    (state.salaryMin !== null ? 1 : 0) +
    (state.salaryMax !== null ? 1 : 0);

  const badge = document.getElementById('filterCount');
  if (!badge) return;
  if (inactive > 0) {
    badge.textContent    = inactive;
    badge.style.display  = 'inline';
  } else {
    badge.style.display  = 'none';
  }
}