/**
 * Data Access Layer (Application/API tier simulasi).
 * Hanya berisi HTTP Fetch + error handling. Tidak menyentuh DOM.
 *
 * Parameter URL untuk demo UI state (berguna untuk screenshot/presentasi):
 *   ?delay=1500          -> tambah latensi buatan (ms) pada GET data
 *   ?simulate=projects   -> paksa error pada data tertentu (profile|projects|services|order)
 */
class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

class ApiService {
  static DATA_BASE = './data/';
  // Mock REST endpoint publik (menerima POST JSON, membalas 201 Created).
  static ORDER_ENDPOINT = 'https://jsonplaceholder.typicode.com/posts';
  static TIMEOUT_MS = 8000;

  static get debug() {
    const q = new URLSearchParams(window.location.search);
    return { delay: Number(q.get('delay')) || 0, simulate: q.get('simulate') };
  }

  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async request(url, options = {}, label = url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!response.ok) {
        throw new ApiError(`HTTP ${response.status}: ${response.statusText || 'Permintaan gagal'}`, response.status);
      }
      return await response.json();
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new ApiError(`Waktu tunggu habis (${this.TIMEOUT_MS / 1000} detik) saat memuat ${label}`);
      }
      if (err instanceof ApiError) throw err;
      throw new ApiError(`Gagal terhubung ke ${label}. Periksa koneksi internet Anda.`);
    } finally {
      clearTimeout(timer);
    }
  }

  static async fetchData(name) {
    const { delay, simulate } = this.debug;
    if (delay) await this.sleep(delay);
    if (simulate === name) throw new ApiError(`Simulasi error pada ${name}.json`, 500);
    // Tanpa header kustom agar cocok dengan <link rel="preload"> di index.html (satu unduhan per berkas).
    return this.request(`${this.DATA_BASE}${name}.json`, {}, `${name}.json`);
  }

  static getProfile() { return this.fetchData('profile'); }
  static getProjects() { return this.fetchData('projects'); }
  static getServices() { return this.fetchData('services'); }

  /** HTTP POST asli dengan body JSON (DTO). */
  static async submitServiceOrder(payload) {
    if (this.debug.simulate === 'order') throw new ApiError('Simulasi error pada pengiriman pesanan', 500);
    return this.request(
      this.ORDER_ENDPOINT,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      },
      'server pesanan'
    );
  }
}
