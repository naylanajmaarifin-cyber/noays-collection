# Mengaktifkan database, login, dan upload foto (Firebase)

Konfigurasi `js/firebase-config.js` saat ini sudah menunjuk ke project `noay-s-collection`. Jika project itu
milikmu, lanjutkan dengan mengaktifkan layanan di bawah. Jika bukan, ganti nilainya dengan konfigurasi Web App
dari project milikmu sebelum menerbitkan website. Jika konfigurasi dikosongkan (`null`), website berjalan di
**MODE LOKAL** (data & foto hanya di browser ini, tanpa keamanan).

## 1. Pastikan project
1. Buka https://console.firebase.google.com dan pastikan kamu memiliki akses ke project `noay-s-collection`.
2. Jika memakai project lain, buka **Project settings → Your apps → Web (`</>`)**, daftarkan app, lalu
   ganti objek `FIREBASE_CONFIG` di `js/firebase-config.js` dengan konfigurasi Web App tersebut.

## 2. Aktifkan layanan
- **Authentication → Sign-in method → Email/Password → Enable.**
- **Firestore Database → Create database** (pilih lokasi terdekat, mis. `asia-southeast2` Jakarta).
- Sorting katalog dan inventaris dijalankan oleh **Firebase Cloud Functions** di region `asia-southeast2`.
  Deploy function pada langkah 3. Cloud Functions memerlukan project Firebase dengan paket **Blaze** (pay-as-you-go);
  aktifkan anggaran/alert biaya di Google Cloud sebelum produksi.
- Website menyimpan foto kecil langsung di dokumen Firestore, jadi **Firebase Storage tidak perlu diaktifkan**.
  Batas foto di formulir adalah 700 KB agar dokumen tetap di bawah batas Firestore 1 MiB. Firestore memiliki
  kuota gratis dan batas pemakaian; pemakaian di atas kuota dapat dikenai biaya sesuai paket dan kebijakan Google.

## 3. Pasang Security Rules dan deploy backend
Lewat konsol: salin isi `firestore.rules` ke **Firestore → Rules → Publish**.
Untuk deploy sorting backend, pasang Node.js 20 dan Firebase CLI, lalu jalankan dari folder proyek yang berisi `firebase.json`:
```sh
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,functions
```
Jika rules sudah dipublikasikan lewat konsol, deploy function saja dengan `firebase deploy --only functions`.
Function bernama `sortProducts` menerima data ringkas produk dan mengembalikan urutan indeks beserta statistiknya.
Saat Firebase aktif, katalog dan inventaris menggunakan function ini; jika belum dideploy, web menampilkan pesan error
dan tidak diam-diam menjalankan sorting di browser.

## 4. Jadikan akunmu admin
1. Buka `login.html`, **Daftar** dengan emailmu (ini akun buyer biasa).
2. Firebase Console → **Authentication → Users** → salin **User UID** akunmu.
3. **Firestore → Start collection** `admins` → Document ID = **UID tadi** → tambahkan satu field apa saja
   (mis. `role: "admin"`) → Save.
4. Keluar lalu masuk lagi → `admin.html` terbuka. Akun lain tetap buyer dan **ditolak oleh database**
   walau mencoba memanggil API langsung.

## 5. Isi produk
Di `admin.html` klik **Impor produk contoh** (opsional) atau tambah produk sendiri beserta foto.

## 6. Ulasan pembeli terverifikasi
Setelah pesanan WhatsApp selesai dan pembelian dikonfirmasi, buka panel admin, masukkan email akun Firebase pembeli, pilih produk, lalu klik **Konfirmasi pembelian**. Pembeli harus masuk/daftar memakai email yang sama; pada halaman detail produk mereka dapat memilih bintang dan mengirim komentar. Setiap akun mendapat satu ulasan per produk dan dapat memperbarui ulasannya.

Aturan terbaru di `firestore.rules` harus dipublikasikan agar verifikasi pembelian dan ulasan berfungsi. Ulasan dapat dibaca publik, tetapi hanya akun yang emailnya telah diverifikasi untuk produk tersebut yang boleh membuat atau mengubah ulasan.

## 7. Hosting dengan GitHub Pages
Project ini memakai GitHub Pages untuk website statis. Workflow `.github/workflows/deploy-pages.yml`
akan menerbitkan file website setiap kali ada push ke branch `main`.
1. Buat repository GitHub (mis. `noays-collection`) dan unggah seluruh isi folder project ke branch `main`.
2. Di repository, buka **Settings → Pages** dan pilih **GitHub Actions** sebagai sumber deployment.
3. Tunggu workflow **Deploy to GitHub Pages** selesai. URL biasanya berbentuk
   `https://USERNAME.github.io/NAMA-REPOSITORY/`.
4. Di Firebase Console, buka **Authentication → Settings → Authorized domains** dan tambahkan
   domain `USERNAME.github.io` (tanpa `https://`, path, atau garis miring). Ini diperlukan untuk login Firebase.

Konfigurasi `.firebaserc` mengarahkan Firebase CLI ke project `noay-s-collection`. Untuk menerbitkan aturan
Firestore dan Cloud Functions, jalankan `firebase deploy --only firestore:rules,functions` dari folder project.
Jika ingin memakai Firebase Hosting juga, jalankan `firebase deploy --only hosting`; konfigurasi Hosting tetap
tersedia di `firebase.json`.

Membuka lewat `file://` tidak mendukung login Firebase; gunakan `http://localhost` atau URL GitHub Pages.

Foto produk disimpan sebagai data di dokumen Firestore (batas dokumen 1 MiB). Karena itu, jangan menaikkan
batas foto 700 KB tanpa memperhitungkan ukuran data setelah dikodekan dan data produk lainnya.
