NOAY'S COLLECTION — VERSI 3 (gabungan web 1 + web 2, tema logo Noay's)

CARA BUKA
1. Ekstrak ZIP, buka folder di VS Code (File > Open Folder).
2. Klik kanan index.html > Open with Live Server, atau klik dua kali index.html.
   (Butuh internet hanya untuk font Google; tanpa internet tetap jalan dengan font cadangan.)

HALAMAN
index.html     Beranda (hero, kategori, favorit, promo, mix & match, baru datang)
category.html  Katalog: ?type=Semua | Wanita | Pria | Hijab | Aksesori | Promo | Baru | Favorit
product.html  Detail produk (warna, ukuran, jumlah) ?id=
cart.html      Tas belanja + checkout via WhatsApp
login.html     Masuk / daftar (DEMO)
admin.html     Panel admin: tambah/edit/hapus produk + upload foto + sorting inventaris

DIAMBIL DARI WEB 2 (zip v2): struktur multi-halaman, tombol menu kuning, detail produk
  dengan warna/ukuran, tas belanja di localStorage, filter warna/ukuran/harga, bahasa & Rupiah.
DIAMBIL DARI WEB 1 (HTML tunggal): favorit (wishlist), lihat cepat (quick view), laci tas
  belanja, notifikasi toast, hitung mundur promo, panel admin, statistik algoritma sorting,
  Terlaris/Terbaru, register, newsletter.

YANG DIUBAH AGAR SESUAI LOGO
- Palet resmi: kuning #F1D302, biru #235789 (+ turunan biru tua/krem). Warna oranye/coral web 1 dibuang.
- Wordmark "noay's" dengan huruf "o" berupa kelinci (SVG, js/art.js), font serif Fraunces.
- Pola gingham kuning-biru, bentuk dekorasi (sparkle, asterisk, hati, bunga, bintang).
- Ilustrasi produk dibuat SVG bergaya logo, dan warnanya ikut berubah saat pilih warna.

MENGUBAH ISI
- js/config.js    : nomor WhatsApp toko, email, batas gratis ongkir.  <-- GANTI NOMOR WA!
- js/products.js  : daftar produk (BASE_PRODUCTS).
- admin.html      : tambah/hapus produk (hanya di browser ini).

CATATAN: ini prototipe frontend. Belum ada database, login sungguhan, stok, pembayaran, atau
pengiriman. Pesanan dikirim sebagai pesan WhatsApp. admin.html belum dilindungi login.


================ PEMBARUAN v3.1 ================
BARU
- Sorting: 5 algoritma (Bubble, Exchange, Selection, Insertion, Shell) x 6 kriteria (harga naik/turun,
  nama A-Z/Z-A, terbaru/terlama; plus Pilihan Noay's & Terlaris) di katalog buyer DAN inventori admin.
  Di mode Firebase algoritma dijalankan di Firebase Cloud Functions (`functions/index.js`, sorting di `functions/sorting.js`);
  web hanya mengirim data sort yang diperlukan dan menerima urutan hasil. Mode lokal tetap memakai algoritma di `js/sort.js`.
  Menampilkan metode aktif, lokasi proses, dan statistik. Deploy backend dengan `firebase deploy --only functions`;
  Cloud Functions memerlukan paket Firebase Blaze. Detail setup ada di FIREBASE_SETUP.md.
- Upload foto produk (JPG/JPEG/PNG/WebP, maks 700 KB, disimpan di Firestore, preview, ganti, hapus) + stok, status aktif/nonaktif,
  deskripsi, ukuran, serta pilihan warna bawaan atau warna custom dengan nama dan kode warna sendiri. Tanpa foto -> placeholder ilustrasi Noay's.
- Ulasan dan penilaian bintang di detail produk: admin memverifikasi email pembeli dan produk setelah pembelian dikonfirmasi; pembeli masuk dengan email yang sama untuk menulis atau memperbarui satu ulasan per produk.
- Database & penyimpanan: Firebase Auth + Firestore dengan Security Rules. Foto disimpan di dokumen Firestore; Firebase Storage tidak diperlukan. Lihat FIREBASE_SETUP.md.
  Sebelum Firebase diisi, website berjalan di MODE LOKAL (IndexedDB, tanpa keamanan) agar bisa dicoba.
FILE BARU : js/db.js, js/firebase-config.js, firestore.rules, firebase.json, FIREBASE_SETUP.md
FILE DIUBAH: sort.js, products.js, common.js, category.js, product.js, cart.js, login.js, admin.js,
             index.html, category.html, admin.html, (semua halaman: urutan <script>), css/styles.css
CATATAN: stok belum berkurang otomatis saat pesanan WhatsApp dikirim (butuh alur pesanan di backend).
Keranjang & favorit tetap per-perangkat (localStorage).
