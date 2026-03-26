# 💼 BisnisKu

**BisnisKu** adalah aplikasi web manajemen bisnis dan kasir (Point of Sales) *offline-first* yang dirancang khusus untuk memenuhi kebutuhan operasional Usaha Kecil dan Menengah (UKM). Dibangun murni menggunakan HTML, CSS, dan JavaScript tanpa framework backend kompleks, menjadikan aplikasi ini super ringan, cepat, dan 100% berjalan di browser Anda dengan bantuan **Local Storage**.

Dengan desain antarmuka bergaya *Dark Glassmorphism* modern yang responsif, aplikasi ini tidak hanya menawarkan fungsionalitas pencatatan keuangan yang canggih namun juga tampilan premium dan nyaman digunakan seharian penuh.

---

## ✨ Fitur Unggulan

*   **📊 Interaktif Dashboard**: Pantau total pendapatan harian/bulanan, laba, produk terjual terbanyak (top 5), grafik tren penjualan, serta notifikasi barang yang stoknya hampir habis.
*   **🛒 Fitur Kasir (POS) Cerdas**: Modul kasir intuitif dengan katalog grid visual, dukungan fitur pencarian dan *filter kategori*, keranjang terintegrasi penghitung otomatis (total harga & kembalian).
*   **🖨️ Cetak Struk Instan**: Sinkronisasi dengan pencetak struk *Thermal Format* (Printer 58mm & 80mm).
*   **📦 Manajemen Inventaris Barang**: CRUD produk mudah, lacak *"Barang Masuk"* beserta perhitungan modal (HPP).
*   **📁 Laporan Detail & Export**: Filter laporan pembukuan berdasarkan rentang tanggal, ekspor dalam bentuk *CSV spreadsheet* secara praktis.
*   **📱 Integrasi Telegram Bot**: Dapatkan notifikasi *real-time* pesan ke aplikasi Telegram milik pribadi/karyawan untuk tiap transaksi berhasil dan peringatan stok menipis darurat.
*   **🔑 Manajemen Kasir & Otorisasi**: Kelola akun kasir aktif agar setiap transaksi & cetakan struk terhubung dengan nama staf yang bertugas.

---

## ⚙️ Pengaturan Lanjutan (Advanced Config)

BisnisKu menawarkan personalisasi sistem yang mendalam:

1.  **Profil Toko**: Sesuaikan nama profil, alamat cetak struk, logo kustom, dan rentang jam operasional toko.
2.  **Kustomisasi Struk**: Bebas merombak pesan *Header* & *Footer* struk pembayaran kasir.
3.  **Threshold Inventaris**: Tentukan secara manual standar batas stok rendah maupun kritis agar sinkron dengan peringatan di Dashboard/Telegram.
4.  **Tema Dinamis (Theme Switcher)**: Tersedia beberapa palet desain modern seperti *Indigo (default)*, *Emerald*, *Rose*, *Amber*, *Cyan*.
5.  **Dukungan Shortcut (*Keyboard Friendly*)**: Optimasi kerja kasir menggunakan *hotkeys* seperti `F2` ke beranda POS, `F4` menyeleksi form input produk prioritas, dan `F8` eksekusi pembayaran otomatis.

---

## 🚀 Cara Menjalankan Aplikasi

Karena menggunakan teknologi Web murni (SPA), tidak ada setup *database MySQL* maupun instalasi yang menyusahkan. Anda hanya perlu sebuah *local web server*.

### Opsi 1 (Disarankan) - Menggunakan Node.js
1. Pastikan Anda telah menginstal Node.js di komputer Anda.
2. Buka terminal di dalam *folder* BisnisKu.
3. Jalankan perintah instalasi local-server:
    ```bash
    npx serve .
    ```
4. Buka Browser (Chrome / Edge / Firefox) dan arahkan pada `http://localhost:3000`.

### Opsi 2 - Menggunakan ekstensi Live Server (VS Code)
1. Buka folder BisnisKu dengan aplikasi editor code **Visual Studio Code**.
2. Pasang ekstensi `Live Server` karya Ritwick Dey.
3. Klik tombol `Go Live` di ujung kanan bawah jendela VS Code.

---

## 🗄️ Manajemen Database Lokal (Backup & Restore)

Segala bentuk aset transaksi, daftar katalog, hingga info toko tertanam pada konfigurasi memori **Local Storage** pada peramban web (*browser*). Hal ini membuat data aman dan tidak perlu koneksi internet.

*   Untuk mengamankan data secara berkala, kunjugi halaman **Pengaturan -> Tab Data** dan gunakan opsi **"Backup Data (Export)"** untuk menjadi wujud `.json`.
*   File `.json` itu sangat bisa dikembalikan ke posisi keadaan awal dengan memuat via opsi **"Restore Data (Import)"**.
*   Aplikasi juga memantau ukuran kapasitas `localStorage` yang terpakai dengan indikator persentase grafis sehingga Anda dapat tahu kapan saatnya mencadangkan data.

---

## 🛠️ Tech Stack & Library
*   **Struktur UI:** HTML5
*   **Desain:** Vanilla CSS3 (Custom Properties & Animations)
*   **Logika Fungsionalitas Utama:** ES6+ JavaScript
*   **Iconography:** [Lucide Icons](https://lucide.dev/) (via CDN)
*   **Render Grafik Canvas:** [Chart.js](https://www.chartjs.org/) (via CDN)

---
*Dibuat oleh AI Antigravity yang didasarkan konsep sederhana menjadi berkelas (Premium) melalui BisnisKu.* 🥂
