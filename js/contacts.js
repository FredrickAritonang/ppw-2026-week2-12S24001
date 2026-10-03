/**
 * Komponen kontak bersama (dipakai index.html dan tentang.html).
 * Teks dirender lewat textContent; URL hanya boleh https: atau mailto:.
 */
window.Contacts = (() => {
  'use strict';

  const ICON_BASE = 'https://cdn.jsdelivr.net/npm/simple-icons@11/icons/';

  const allowed = (value) => {
    try { return ['https:', 'mailto:'].includes(new URL(String(value)).protocol); } catch { return false; }
  };

  /** variant: 'card' (besar, di halaman Tentang) | 'inline' (ringkas, di footer). */
  function render(box, contacts, variant = 'inline') {
    if (!box) return;
    const items = (contacts || []).filter((c) => allowed(c.url));
    box.replaceChildren(...items.map((c) => {
      const external = c.url.startsWith('https:');
      const a = document.createElement('a');
      a.className = `contact-link contact-${variant}`;
      a.href = c.url;
      if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      a.setAttribute('aria-label', `${c.label}: ${c.value}${external ? ' (buka di tab baru)' : ''}`);

      const badge = document.createElement('span');
      badge.className = `contact-badge contact-${c.type}`;
      badge.setAttribute('aria-hidden', 'true');
      const fallbackText = c.badge || c.label.slice(0, 2);
      if (/^[a-z0-9-]+$/.test(c.icon || '')) {
        // Logo resmi (Simple Icons, via CDN). dataset.fallback='1' agar handler gambar global di app.js tidak ikut campur.
        const img = document.createElement('img');
        img.className = 'contact-logo';
        img.src = `${ICON_BASE}${c.icon}.svg`;
        img.alt = '';
        img.width = 20;
        img.height = 20;
        img.dataset.fallback = '1';
        img.addEventListener('error', () => badge.replaceChildren(document.createTextNode(fallbackText)), { once: true });
        badge.append(img);
      } else {
        badge.textContent = fallbackText;
      }

      const text = document.createElement('span');
      text.className = 'contact-text';
      const label = document.createElement('span');
      label.className = 'contact-label';
      label.textContent = c.label;
      text.append(label);
      if (variant === 'card') {
        const value = document.createElement('span');
        value.className = 'contact-value';
        value.textContent = c.value;
        text.append(value);
      }
      a.append(badge, text);
      return a;
    }));
  }

  return { render };
})();