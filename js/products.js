// ============================================================
//  PRODUK CONTOH (SEED)
//  Produk sebenarnya dikelola lewat admin.html (database).
//  art   : bentuk ilustrasi -> pashmina, voal, inner, blouse, kemeja, kaos, dress, rok, celana, jaket, tote, topi
//  tint  : warna latar kartu (yellow | blue | cream)
//  colors: nama warna dipakai filter (Kuning, Biru, Hitam, Netral, Pink)
// ============================================================
const TINTS = { yellow: "#FBEF8F", blue: "#CFE0EE", cream: "#FFF6D9" };

const SEED_PRODUCTS = [
  { id: 1, name: "Pashmina Tencel Premium", category: "Hijab", art: "pashmina", price: 59000, oldPrice: 69000, badge: "BESTSELLER", tint: "yellow", date: "2026-09-02", sales: 420, rating: 4.9,
    colors: [{ name: "Kuning", hex: "#F1D302" }, { name: "Biru", hex: "#235789" }, { name: "Netral", hex: "#D8C8A8" }], sizes: ["All Size"],
    description: "Pashmina tencel lembut, ringan, dan adem. Jatuhnya cantik dan nyaman menemani aktivitas harian." },
  { id: 2, name: "Hijab Voal Daily", category: "Hijab", art: "voal", price: 39000, badge: "EASY STYLE", tint: "cream", date: "2026-08-15", sales: 305, rating: 4.8,
    colors: [{ name: "Pink", hex: "#E7A9A2" }, { name: "Netral", hex: "#E8D7C2" }, { name: "Biru", hex: "#8FB1C9" }], sizes: ["All Size"],
    description: "Hijab voal yang ringan dan mudah dibentuk untuk gaya sehari-hari." },
  { id: 3, name: "Blouse Sunday", category: "Wanita", art: "blouse", price: 89000, badge: "NEW", tint: "cream", date: "2026-10-12", sales: 150, rating: 4.7,
    colors: [{ name: "Pink", hex: "#F2B4AC" }, { name: "Biru", hex: "#8FB1C9" }, { name: "Kuning", hex: "#F1D302" }], sizes: ["S", "M", "L", "XL"],
    description: "Blouse kasual dengan potongan santai, cocok dipadukan dengan rok maupun celana." },
  { id: 4, name: "Celana Linen Santai", category: "Wanita", art: "celana", price: 119000, tint: "blue", date: "2026-08-30", sales: 120, rating: 4.6,
    colors: [{ name: "Netral", hex: "#D3C6AD" }, { name: "Biru", hex: "#6F8FA8" }, { name: "Hitam", hex: "#273D50" }], sizes: ["S", "M", "L", "XL"],
    description: "Celana linen santai dengan siluet longgar, mudah dipadukan untuk agenda harian." },
  { id: 5, name: "Dress Summer Day", category: "Wanita", art: "dress", price: 149000, oldPrice: 179000, badge: "FEEL-GOOD", tint: "yellow", date: "2026-09-20", sales: 260, rating: 4.9,
    colors: [{ name: "Kuning", hex: "#F1D302" }, { name: "Pink", hex: "#E3A79D" }, { name: "Biru", hex: "#6D93B5" }], sizes: ["S", "M", "L", "XL"],
    description: "Dress ceria untuk acara santai, jalan-jalan, atau kumpul bersama teman." },
  { id: 6, name: "Kemeja Relaxed Fit", category: "Pria", art: "kemeja", price: 129000, tint: "blue", date: "2026-09-08", sales: 175, rating: 4.7,
    colors: [{ name: "Netral", hex: "#EEE7D2" }, { name: "Biru", hex: "#7FA2BA" }, { name: "Hitam", hex: "#273D50" }], sizes: ["S", "M", "L", "XL"],
    description: "Kemeja kasual berpotongan relaxed fit untuk gaya rapi tanpa terasa kaku." },
  { id: 7, name: "Jaket Weekend", category: "Pria", art: "jaket", price: 189000, badge: "NEW", tint: "cream", date: "2026-10-15", sales: 90, rating: 4.5,
    colors: [{ name: "Biru", hex: "#2F5F8E" }, { name: "Netral", hex: "#BFA97F" }, { name: "Hitam", hex: "#303C4B" }], sizes: ["M", "L", "XL"],
    description: "Jaket ringan untuk melengkapi gaya kasual saat bepergian." },
  { id: 8, name: "Kaos Basic Everyday", category: "Pria", art: "kaos", price: 69000, oldPrice: 85000, tint: "yellow", date: "2026-07-25", sales: 380, rating: 4.8,
    colors: [{ name: "Netral", hex: "#F4F0E5" }, { name: "Biru", hex: "#235789" }, { name: "Kuning", hex: "#F1D302" }], sizes: ["S", "M", "L", "XL"],
    description: "Kaos basic untuk outfit sehari-hari yang simpel dan gampang dipadukan." },
  { id: 9, name: "Tote Bag Sunshine", category: "Aksesori", art: "tote", price: 49000, tint: "blue", date: "2026-09-28", sales: 210, rating: 4.8,
    colors: [{ name: "Kuning", hex: "#F1D302" }, { name: "Biru", hex: "#235789" }, { name: "Pink", hex: "#E3A79D" }], sizes: ["All Size"],
    description: "Tote bag ringan untuk membawa barang esensial saat beraktivitas." },
  { id: 10, name: "Inner Hijab Nyaman", category: "Hijab", art: "inner", price: 25000, tint: "cream", date: "2026-07-10", sales: 460, rating: 4.9,
    colors: [{ name: "Netral", hex: "#E9D7C4" }, { name: "Hitam", hex: "#303C4B" }, { name: "Biru", hex: "#8EA4BE" }], sizes: ["All Size"],
    description: "Inner hijab yang nyaman dan tidak mudah bergeser, jadi dasar hijab harian." },
  { id: 11, name: "Rok A-Line Casual", category: "Wanita", art: "rok", price: 99000, tint: "blue", date: "2026-08-05", sales: 110, rating: 4.6,
    colors: [{ name: "Biru", hex: "#235789" }, { name: "Netral", hex: "#D3C6AD" }, { name: "Hitam", hex: "#252B30" }], sizes: ["S", "M", "L", "XL"],
    description: "Rok A-line yang mudah dipadukan dengan blouse, kemeja, atau kaos." },
  { id: 12, name: "Topi Weekend Club", category: "Aksesori", art: "topi", price: 45000, badge: "JUST IN", tint: "yellow", date: "2026-10-17", sales: 70, rating: 4.7,
    colors: [{ name: "Biru", hex: "#235789" }, { name: "Kuning", hex: "#F1D302" }, { name: "Netral", hex: "#F4F0E5" }], sizes: ["All Size"],
    description: "Topi kasual sebagai pelengkap gaya untuk hari cerah." },
  { id: 13, name: "Jaket Denim Surfside", category: "Pria", art: "jaket", price: 219000, badge: "UNISEX", tint: "blue", date: "2026-09-12", sales: 310, rating: 5.0,
    colors: [{ name: "Biru", hex: "#2B5A87" }, { name: "Hitam", hex: "#273D50" }], sizes: ["S", "M", "L", "XL"],
    description: "Jaket denim biru klasik, unisex. Bahan katun drill yang awet tapi tetap lembut dipakai." },
  { id: 14, name: "Dress Floral Plumage", category: "Wanita", art: "dress", price: 159000, oldPrice: 189000, badge: "FLORAL", tint: "cream", date: "2026-10-05", sales: 210, rating: 4.9,
    colors: [{ name: "Kuning", hex: "#F6DD3A" }, { name: "Pink", hex: "#E7A9A2" }], sizes: ["S", "M", "L", "XL"],
    description: "Dress motif bunga ceria dengan lapisan katun yang ringan dan adem." },
  { id: 15, name: "Celana Chino Serene", category: "Pria", art: "celana", price: 139000, tint: "yellow", date: "2026-08-22", sales: 95, rating: 4.6,
    colors: [{ name: "Biru", hex: "#235789" }, { name: "Netral", hex: "#CDBE9D" }, { name: "Hitam", hex: "#273D50" }], sizes: ["S", "M", "L", "XL"],
    description: "Celana chino stretch yang nyaman untuk jalan santai sampai acara malam." },
  { id: 16, name: "Pashmina Instan Sunset", category: "Hijab", art: "pashmina", price: 35000, oldPrice: 45000, badge: "PROMO", tint: "cream", date: "2026-10-01", sales: 400, rating: 4.9,
    colors: [{ name: "Kuning", hex: "#F1D302" }, { name: "Pink", hex: "#E7A9A2" }, { name: "Netral", hex: "#E8D7C2" }], sizes: ["All Size"],
    description: "Pashmina instan jersey, tinggal pakai. Anti-slip dan ramah di kulit." }
];

// ------------------------------------------------------------
//  DATA AKTIF — diisi dari database (Firebase) atau mode lokal oleh db.js
//  ALL_PRODUCTS = semua yang boleh dilihat akun ini (admin: termasuk nonaktif)
//  PRODUCTS     = hanya produk berstatus "aktif" (dipakai halaman buyer)
//  SEED_PRODUCTS di atas hanya bahan "produk contoh" (impor lewat admin).
// ------------------------------------------------------------
const ALL_PRODUCTS = [];
const PRODUCTS = [];
