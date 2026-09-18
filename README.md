# Portofolio Profil Profesional - Week 2 PPW

Dokumen ini merupakan proyek pembuatan halaman web portofolio profil profesional tunggal (*Single Page Showcase Webpage*) untuk memenuhi Tugas Mingguan Ke-2 Mata Kuliah **Pemrograman dan Pengujian Aplikasi Web (PPW)** di IT Del.

---

## 👤 Informasi Mahasiswa
* **Nama**: Fredrick Laurensius Aritonang
* **NIM**: 12S24001
* **Program Studi**: S1 Sistem Informasi
* **Institusi**: Institut Teknologi Del

---

## 🌐 Live Demo (GitHub Pages)
Halaman web ini telah dipublikasikan secara *live* dan dapat diakses melalui tautan berikut:
👉 [https://FredrickAritonang.github.io/ppw-2026-week2-12S24001/](https://FredrickAritonang.github.io/ppw-2026-week2-12S24001/)

---

## 🛠️ Fitur & Implementasi Spesifikasi Teknis

Aplikasi web ini dibangun dengan memenuhi seluruh kriteria teknis wajib:

1. **Struktur Semantik HTML5**:
   * Menggunakan elemen semantik `<header>`, `<nav>`, `<main>`, `<section>`, `<aside>`, dan `<footer>`.
   * Bebas dari penggunaan pembungkus `<div>` tanpa makna semantik pada struktur utama.

2. **Data Tabular & Lists**:
   * Menyajikan rekapitulasi nilai/proyek dalam bentuk tabel semantik lengkap (`<table>`, `<caption>`, `<thead>`, `<tbody>`, `<tfoot>`, serta atribut `scope="col/row"`).
   * Memuat dua jenis daftar HTML (`<ul>` untuk Fokus Keahlian dan `<ol>` untuk Alur Kerja Pengerjaan Proyek).

3. **Formulir Interaktif & Aksesibel (WCAG 2.2 AA)**:
   * Mengelompokkan input menggunakan `<fieldset>` dan `<legend>`.
   * Memuat lebih dari 6 jenis kontrol input (`text`, `email`, `tel`, `number`, `radio`, `checkbox`, `select`, dan `textarea`).
   * Menggunakan atribut `for="..."` pada `<label>` secara eksplisit serta validasi native `required`.

4. **Estetika & CSS Modern**:
   * Memakai CSS Eksternal (`style.css`) dengan reset *Universal Box Sizing*.
   * Menerapkan aturan palet warna 60-30-10, sudut membulat (`border-radius`), dan bayangan lembut (`box-shadow`).
   * Tata letak berbasis **CSS Flexbox** dan **CSS Grid**.
   * Fully Responsive pada berbagai ukuran layar menggunakan Media Queries (`@media (max-width: 768px)`).

---

## 📂 Struktur Berkas Repositori

```text
ppw-2026-week2-12S24001/
├── index.html        # Berkas utama struktur dokumen HTML5
├── style.css         # Berkas styling CSS eksternal
├── pasfoto.png.png   # Foto profil pengguna
└── README.md         # Dokumentasi repositori proyek