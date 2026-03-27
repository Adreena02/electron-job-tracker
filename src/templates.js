// templates.js
// Email template library — CRUD operations and rendering.
// Depends on: state.js, storage.js, utils.js

import * as state from './state.js';
import { persistTemplates } from './storage.js';
import { uid } from './utils.js';


export function renderTemplates() {
  const grid = document.getElementById('templatesGrid');
  if (!grid) return;

  if (!state.templates.length) {
    grid.innerHTML = `<div class="empty-state">No templates yet — create one to get started.</div>`;
    return;
  }

  grid.innerHTML = state.templates.map(t => `
    <div class="template-card">
      <div class="template-name">${t.name}</div>
      ${t.subject ? `<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">Subject: ${t.subject}</div>` : ''}
      <div class="template-preview">${t.body}</div>
      <div class="template-actions">
        <button class="btn-template" data-edit-template="${t.id}">Edit</button>
        <button class="btn-template danger" data-delete-template="${t.id}">Delete</button>
      </div>
    </div>
  `).join('');
}

export function openTemplateEditor(id) {
  state.setEditTemplateId(id || null);
  const tpl = id ? state.templates.find(t => t.id === id) : null;
  document.getElementById('templateEditorTitle').textContent = tpl ? 'Edit template' : 'New template';
  document.getElementById('te-name').value    = tpl?.name    || '';
  document.getElementById('te-subject').value = tpl?.subject || '';
  document.getElementById('te-body').value    = tpl?.body    || '';
  document.getElementById('templateEditorBackdrop').classList.add('open');
}

export function closeTemplateEditor() {
  document.getElementById('templateEditorBackdrop').classList.remove('open');
}

export function saveTemplate() {
  const name    = document.getElementById('te-name').value.trim();
  const subject = document.getElementById('te-subject').value.trim();
  const body    = document.getElementById('te-body').value.trim();

  if (!name) { alert('Please enter a template name.'); return; }

  if (state.editTemplateId) {
    const idx = state.templates.findIndex(t => t.id === state.editTemplateId);
    state.templates[idx] = { ...state.templates[idx], name, subject, body };
  } else {
    state.templates.push({ id: 'tpl-' + uid(), name, subject, body });
  }

  persistTemplates(state.templates);
  renderTemplates();
  closeTemplateEditor();
}

export function deleteTemplate(id) {
  state.setTemplates(state.templates.filter(t => t.id !== id));
  persistTemplates(state.templates);
  renderTemplates();
}