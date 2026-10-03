/**
 * Presentation Layer: kontrol DOM, dynamic rendering, dan event.
 * Semua data dinamis dirender lewat textContent / setAttribute (bukan innerHTML),
 * sehingga aman dari DOM-based XSS. URL dari JSON divalidasi oleh safeUrl().
 */
(() => {
  'use strict';

  const ORDERS_KEY = 'service_orders';
  const FALLBACK_IMG = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80';
  const $ = (id) => document.getElementById(id);

  /** Buat elemen dengan aman: teks -> textContent, atribut -> setAttribute. */
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === false) continue;
      if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value === true ? '' : value);
    }
    [].concat(children).forEach((c) => c && node.append(c));
    return node;
  }

  /** Hanya izinkan http(s) atau path relatif; selain itu (javascript:, data:) ditolak. */
  function safeUrl(value) {
    try {
      const url = new URL(String(value), window.location.href);
      return ['http:', 'https:'].includes(url.protocol) ? String(value) : '#';
    } catch {
      return '#';
    }
  }

  const rupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const App = {
    state: {
      profile: { status: 'loading', data: null, error: null },
      projects: { status: 'loading', data: [], error: null },
      services: { status: 'loading', data: null, error: null },
      activeFilter: 'all',
      query: '',
      orders: []
    },

    /* ---------- Bootstrap ---------- */
    init() {
      this.state.orders = this.readOrders();
      this.renderOrders();
      this.bindEvents();
      this.loadAll();
    },

    loadAll() {
      return Promise.all([this.load('profile'), this.load('projects'), this.load('services')]);
    },

    /** Memuat satu sumber data dan mengelola siklus Loading -> Success/Empty/Error. */
    async load(key) {
      const slice = this.state[key];
      slice.status = 'loading';
      slice.error = null;
      this.render(key);
      try {
        const fetcher = { profile: 'getProfile', projects: 'getProjects', services: 'getServices' }[key];
        slice.data = await ApiService[fetcher]();
        const empty = key === 'projects' ? !slice.data.length : key === 'services' && !slice.data.packages?.length;
        slice.status = empty ? 'empty' : 'success';
      } catch (err) {
        slice.status = 'error';
        slice.error = err.message;
      }
      this.render(key);
    },

    render(key) {
      if (key === 'profile') { this.renderProfile(); this.renderCertificates(); }
      if (key === 'projects') this.renderProjects();
      if (key === 'services') { this.renderServices(); this.populateSelects(); }
    },

    /* ---------- Komponen state umum ---------- */
    skeletonCard(cols = 'col-md-6') {
      return el('div', { class: `${cols} mb-4` }, el('div', { class: 'card h-100 skeleton-card', 'aria-hidden': 'true' }, [
        el('div', { class: 'skeleton skeleton-img' }),
        el('div', { class: 'card-body' }, [
          el('div', { class: 'skeleton skeleton-line w-25' }),
          el('div', { class: 'skeleton skeleton-line w-75' }),
          el('div', { class: 'skeleton skeleton-line w-100' }),
          el('div', { class: 'skeleton skeleton-line w-50' })
        ])
      ]));
    },

    loadingBlock(container, count, cols) {
      container.setAttribute('aria-busy', 'true');
      container.replaceChildren(
        el('span', { class: 'visually-hidden', role: 'status', text: 'Memuat data...' }),
        ...Array.from({ length: count }, () => this.skeletonCard(cols))
      );
    },

    errorBlock(container, message, retry) {
      container.setAttribute('aria-busy', 'false');
      const btn = el('button', { type: 'button', class: 'btn btn-sm btn-light ms-md-auto', text: 'Coba lagi' });
      btn.addEventListener('click', retry);
      container.replaceChildren(el('div', { class: 'col-12' }, el('div', { class: 'alert alert-danger d-flex flex-column flex-md-row align-items-md-center gap-2 shadow-sm', role: 'alert' }, [
        el('div', {}, [el('strong', { text: 'Data tidak dapat dimuat. ' }), document.createTextNode(message)]),
        btn
      ])));
    },

    emptyBlock(container, message, actionLabel, action) {
      container.setAttribute('aria-busy', 'false');
      const children = [el('p', { class: 'mb-2', text: message })];
      if (action) {
        const btn = el('button', { type: 'button', class: 'btn btn-outline-primary btn-sm', text: actionLabel });
        btn.addEventListener('click', action);
        children.push(btn);
      }
      container.replaceChildren(el('div', { class: 'col-12 text-center py-4' }, children));
    },

    /* ---------- Profil & sertifikat ---------- */
    renderProfile() {
      const { status, data: p, error } = this.state.profile;
      const section = $('profil');
      const about = $('tentang');
      section.setAttribute('aria-busy', String(status === 'loading'));
      about.setAttribute('aria-busy', String(status === 'loading'));
      if (status === 'error') {
        $('bioName').textContent = 'Profil tidak tersedia';
        $('bioDetails').textContent = error;
        $('bioDescription').textContent = 'Muat ulang halaman atau periksa berkas data/profile.json.';
        $('skillsList').replaceChildren(el('li', { text: 'Data tidak tersedia.' }));
        $('workflowList').replaceChildren(el('li', { text: 'Data tidak tersedia.' }));
        return;
      }
      if (status !== 'success') return;

      $('brandName').textContent = p.name;
      $('bioName').textContent = p.name;
      $('bioDetails').textContent = `NIM ${p.nim} | ${p.studyProgram} | ${p.institution}`;
      $('bioDescription').textContent = p.bio;
      $('bioStatus').textContent = p.status;
      const photo = $('bioPhoto');
      if (p.photo && photo.getAttribute('src') !== p.photo) photo.setAttribute('src', safeUrl(p.photo));
      $('skillsList').replaceChildren(...p.skills.map((s) => el('li', { text: s })));
      $('workflowList').replaceChildren(...p.workflows.map((w) => el('li', { text: w })));
      Contacts.render($('contactCards'), p.contacts, 'card');
    },

    renderCertificates() {
      const box = $('certificatesGrid');
      const { status, data, error } = this.state.profile;
      if (status === 'loading') return this.loadingBlock(box, 3, 'col-md-4');
      if (status === 'error') return this.errorBlock(box, error, () => this.load('profile'));
      if (!data.certificates?.length) return this.emptyBlock(box, 'Belum ada sertifikat yang ditambahkan.');
      box.setAttribute('aria-busy', 'false');
      box.replaceChildren(...data.certificates.map((c) => el('div', { class: 'col-md-4' }, el('div', { class: 'card h-100 shadow-sm border' }, [
        el('img', { src: safeUrl(c.image), class: 'card-img-top p-2 cert-img', alt: `Sertifikat: ${c.title}`, loading: 'lazy' }),
        el('div', { class: 'card-body' }, [el('h3', { class: 'h6 fw-bold mb-1', text: c.title }), el('small', { text: c.issuer })])
      ]))));
    },

    /* ---------- Proyek (4 UI state + filter + cari) ---------- */
    visibleProjects() {
      const q = this.state.query.trim().toLowerCase();
      return this.state.projects.data.filter((p) => {
        const inCategory = this.state.activeFilter === 'all' || p.category === this.state.activeFilter;
        const haystack = [p.title, p.role, ...(p.tech || []), ...(p.tags || [])].join(' ').toLowerCase();
        return inCategory && (!q || haystack.includes(q));
      });
    },

    renderProjects() {
      const box = $('projectsGrid');
      const summary = $('projectsSummary');
      const { status, error, data } = this.state.projects;

      if (status === 'loading') {
        summary.textContent = 'Memuat proyek...';
        return this.loadingBlock(box, 4, 'col-md-6');
      }
      if (status === 'error') {
        summary.textContent = 'Proyek gagal dimuat.';
        return this.errorBlock(box, error, () => this.load('projects'));
      }
      if (status === 'empty') {
        summary.textContent = 'Belum ada proyek.';
        return this.emptyBlock(box, 'Belum ada proyek di data/projects.json.');
      }

      const list = this.visibleProjects();
      summary.textContent = `Menampilkan ${list.length} dari ${data.length} proyek`;
      if (!list.length) {
        return this.emptyBlock(box, 'Tidak ada proyek yang cocok dengan filter atau kata kunci ini.', 'Reset filter', () => this.resetFilters());
      }

      box.setAttribute('aria-busy', 'false');
      box.replaceChildren(...list.map((proj) => this.projectCard(proj)));
    },

    projectCard(proj) {
      const running = proj.status === 'Berjalan';
      const btn = el('button', { type: 'button', class: 'btn btn-outline-primary btn-sm w-100 btn-detail', 'data-id': proj.id, text: 'Lihat detail proyek' });
      return el('div', { class: 'col-md-6 mb-4' }, el('div', { class: 'card h-100 shadow-sm border-0 project-card' }, [
        el('img', { src: safeUrl(proj.image), class: 'card-img-top project-img', alt: `Gambar proyek ${proj.title}`, loading: 'lazy' }),
        el('div', { class: 'card-body d-flex flex-column' }, [
          el('div', { class: 'd-flex justify-content-between align-items-start mb-2' }, [
            el('span', { class: `badge ${running ? 'bg-info text-dark' : 'bg-warning text-dark'}`, text: proj.status }),
            el('span', { class: 'fw-semibold grade', text: `Target ${proj.gradeTarget}` })
          ]),
          el('h3', { class: 'card-title h5 fw-bold', text: proj.title }),
          el('p', { class: 'card-text small flex-grow-1', text: proj.description }),
          el('div', { class: 'mt-2 mb-3' }, (proj.tech || []).map((t) => el('span', { class: 'badge bg-light text-dark border me-1', text: t }))),
          btn
        ])
      ]));
    },

    resetFilters() {
      this.state.activeFilter = 'all';
      this.state.query = '';
      $('projectSearch').value = '';
      this.syncFilterButtons();
      this.renderProjects();
    },

    syncFilterButtons() {
      document.querySelectorAll('.filter-btn').forEach((b) => {
        const active = b.dataset.filter === this.state.activeFilter;
        b.classList.toggle('active', active);
        b.classList.toggle('btn-primary', active);
        b.classList.toggle('btn-outline-primary', !active);
        b.setAttribute('aria-pressed', String(active));
      });
    },

    /* ---------- Universal Dynamic Modal ---------- */
    openProjectModal(projectId) {
      const proj = this.state.projects.data.find((p) => p.id === projectId);
      if (!proj) return;

      $('projectModalTitle').textContent = proj.title;
      $('projectModalBody').replaceChildren(
        el('img', { src: safeUrl(proj.image), class: 'img-fluid rounded mb-3 w-100 modal-img', alt: `Gambar proyek ${proj.title}` }),
        el('p', { text: proj.description }),
        el('div', { class: 'row g-2 my-2' }, [
          ['Peran', proj.role], ['Status', proj.status], ['Kode', proj.id], ['Target nilai', proj.gradeTarget]
        ].map(([k, v]) => el('div', { class: 'col-6' }, [el('strong', { text: `${k}: ` }), document.createTextNode(v)]))),
        el('h3', { class: 'h6 fw-bold mt-3', text: 'Metrik' }),
        el('div', { class: 'row g-2 mb-3' }, (proj.metrics || []).map((m) => el('div', { class: 'col-4' }, el('div', { class: 'metric-box text-center p-2' }, [
          el('div', { class: 'fw-bold fs-5', text: m.value }), el('small', { text: m.label })
        ])))),
        el('h3', { class: 'h6 fw-bold', text: 'Teknologi dan tag' }),
        el('div', { class: 'mb-3' }, [
          ...(proj.tech || []).map((t) => el('span', { class: 'badge bg-primary me-1 mt-1', text: t })),
          ...(proj.tags || []).map((t) => el('span', { class: 'badge bg-light text-dark border me-1 mt-1', text: `#${t}` }))
        ]),
        el('a', { href: safeUrl(proj.link), class: 'btn btn-primary btn-sm', target: '_blank', rel: 'noopener noreferrer', text: 'Buka proyek' })
      );
      bootstrap.Modal.getOrCreateInstance($('universalProjectModal')).show();
    },

    /* ---------- Layanan ---------- */
    renderServices() {
      const box = $('servicesGrid');
      const { status, data, error } = this.state.services;
      if (status === 'loading') return this.loadingBlock(box, 3, 'col-md-4');
      if (status === 'error') return this.errorBlock(box, error, () => this.load('services'));
      if (status === 'empty') return this.emptyBlock(box, 'Belum ada paket layanan.');

      box.setAttribute('aria-busy', 'false');
      box.replaceChildren(...data.packages.map((pkg) => {
        const choose = el('button', { type: 'button', class: 'btn btn-outline-primary btn-sm w-100 mt-auto btn-choose', 'data-package': pkg.id, text: 'Pilih paket ini' });
        return el('div', { class: 'col-md-6 col-lg-4' }, el('div', { class: 'card h-100 shadow-sm service-card' }, el('div', { class: 'card-body d-flex flex-column' }, [
          el('div', { class: 'd-flex justify-content-between align-items-start mb-2' }, [
            el('h3', { class: 'h5 fw-bold mb-0', text: pkg.name }),
            pkg.popular && el('span', { class: 'badge bg-info text-dark', text: 'Terpopuler' })
          ]),
          el('p', { class: 'small', text: pkg.tagline }),
          el('p', { class: 'fs-5 fw-bold mb-1', text: rupiah(pkg.price) }),
          el('p', { class: 'small', text: `${pkg.unit} | ${pkg.duration}` }),
          el('ul', { class: 'small ps-3 mb-3' }, pkg.features.map((f) => el('li', { text: f }))),
          choose
        ])));
      }));
    },

    populateSelects() {
      const { status, data } = this.state.services;
      if (status !== 'success') return;
      const fill = (id, placeholder, items) => $(id).replaceChildren(
        el('option', { value: '', text: placeholder }),
        ...items.map(([value, label]) => el('option', { value, text: label }))
      );
      fill('packageId', 'Pilih paket', data.packages.map((p) => [p.id, `${p.name} (${rupiah(p.price)})`]));
      fill('topic', 'Pilih topik', (data.topics || []).map((t) => [t.id, t.name]));
    },

    /* ---------- Form POST + state lokal ---------- */
    async submitForm(form) {
      form.classList.add('was-validated');
      if (!form.checkValidity()) {
        form.querySelector(':invalid')?.focus();
        return;
      }

      const fd = new FormData(form);
      const clean = (k, max) => String(fd.get(k) || '').trim().slice(0, max);
      const pkg = this.state.services.data?.packages.find((p) => p.id === fd.get('packageId'));
      const topic = this.state.services.data?.topics.find((t) => t.id === fd.get('topic'));
      const payload = {
        fullname: clean('fullname', 80),
        email: clean('email', 100),
        packageId: clean('packageId', 30),
        packageName: pkg ? pkg.name : '',
        topicId: clean('topic', 20),
        topicName: topic ? topic.name : '',
        priority: clean('priority', 10),
        description: clean('description', 500),
        consent: true,
        submittedAt: new Date().toISOString()
      };

      const btn = $('submitBtn');
      btn.disabled = true;
      btn.replaceChildren(el('span', { class: 'spinner-border spinner-border-sm me-2', role: 'status', 'aria-hidden': 'true' }), document.createTextNode('Mengirim...'));
      try {
        const res = await ApiService.submitServiceOrder(payload);
        this.addOrder({ localId: `ORD-${Date.now().toString(36).toUpperCase()}`, remoteId: res.id ?? null, ...payload });
        this.toast('Permintaan terkirim', `Paket ${payload.packageName} tercatat di riwayat pesanan.`);
        form.reset();
        form.classList.remove('was-validated');
      } catch (err) {
        this.toast('Pengiriman gagal', `${err.message} Data formulir Anda masih tersimpan, coba kirim lagi.`, 'danger');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Kirim permintaan';
      }
    },

    toast(title, message, type = 'success') {
      $('liveToast').querySelector('.toast-header').className = `toast-header text-white bg-${type}`;
      $('toastTitle').textContent = title;
      $('toastBody').textContent = message;
      bootstrap.Toast.getOrCreateInstance($('liveToast')).show();
    },

    readOrders() {
      try {
        const parsed = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },

    saveOrders() {
      try { localStorage.setItem(ORDERS_KEY, JSON.stringify(this.state.orders)); } catch { /* storage penuh/dinonaktifkan */ }
    },

    addOrder(order) {
      this.state.orders.unshift(order);
      this.saveOrders();
      this.renderOrders();
    },

    renderOrders() {
      const orders = this.state.orders;
      $('orderCountBadge').textContent = String(orders.length);
      $('clearOrdersBtn').hidden = !orders.length;
      $('orderList').replaceChildren(...(orders.length
        ? orders.map((o) => el('li', { class: 'order-item mb-2 p-3' }, [
          el('div', { class: 'fw-bold', text: o.packageName || 'Paket layanan' }),
          el('div', { class: 'small', text: `${o.localId} | ${o.priority}` }),
          el('div', { class: 'small', text: new Date(o.submittedAt).toLocaleString('id-ID') })
        ]))
        : [el('li', { class: 'small', text: 'Belum ada pesanan. Kirim formulir untuk membuat yang pertama.' })]));
    },

    /* ---------- Event ---------- */
    bindEvents() {
      $('projectsGrid').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-detail');
        if (btn) this.openProjectModal(btn.dataset.id);
      });

      $('servicesGrid').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-choose');
        if (!btn) return;
        $('packageId').value = btn.dataset.package;
        $('formulir').scrollIntoView({ behavior: 'smooth' });
        $('fullname').focus({ preventScroll: true });
      });

      $('filterGroup').addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        this.state.activeFilter = btn.dataset.filter;
        this.syncFilterButtons();
        this.renderProjects();
      });

      $('projectSearch').addEventListener('input', (e) => {
        this.state.query = e.target.value;
        if (this.state.projects.status === 'success') this.renderProjects();
      });

      $('consultationForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitForm(e.currentTarget);
      });

      $('clearOrdersBtn').addEventListener('click', () => {
        if (!window.confirm('Hapus semua riwayat pesanan di perangkat ini?')) return;
        this.state.orders = [];
        this.saveOrders();
        this.renderOrders();
      });

      // Sinkronisasi badge antar-tab; CSP melarang onerror inline, jadi fallback gambar didelegasikan di sini.
      window.addEventListener('storage', (e) => {
        if (e.key === ORDERS_KEY) { this.state.orders = this.readOrders(); this.renderOrders(); }
      });
      document.addEventListener('error', (e) => {
        const img = e.target;
        if (img instanceof HTMLImageElement && img.dataset.fallback !== '1') {
          img.dataset.fallback = '1';
          img.src = FALLBACK_IMG;
        }
      }, true);
    }
  };

  document.addEventListener('DOMContentLoaded', () => App.init());
})();