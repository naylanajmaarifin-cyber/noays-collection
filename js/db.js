// ============================================================
//  LAPISAN DATA — satu API, dua backend
//   • "firebase": Firebase Auth + Cloud Firestore (permanen, multi-perangkat,
//                 hak akses ditegakkan oleh Firestore Security Rules)
//   • "local"   : IndexedDB di browser ini (hanya untuk mencoba sebelum Firebase diisi; TANPA keamanan)
//  Halaman tidak perlu tahu backend mana yang aktif; cukup memakai objek DB.
// ============================================================
const PHOTO_MAX_BYTES = 700 * 1024;
const PHOTO_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const CATEGORIES = ["Hijab", "Wanita", "Pria", "Aksesori"];

// Firestore limits each document to 1 MiB; base64 encoding increases the photo size.
function validatePhoto(file) {
  if (!file) return "";
  if (!PHOTO_TYPES[file.type]) return "Format foto tidak didukung. Gunakan JPG, JPEG, PNG, atau WebP.";
  if (file.size > PHOTO_MAX_BYTES) return `Ukuran foto ${(file.size / 1024).toFixed(0)} KB melebihi batas 700 KB. Perkecil dulu fotonya.`;
  return "";
}

function photoAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Foto tidak dapat dibaca."));
    reader.onerror = () => reject(reader.error || new Error("Foto tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });
}

const DB = (() => {
  const FB_URL = "https://www.gstatic.com/firebasejs/10.12.2/";
  const FUNCTIONS_REGION = "asia-southeast2";
  const cfg = (typeof FIREBASE_CONFIG !== "undefined" && FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && !/^ISI/i.test(FIREBASE_CONFIG.apiKey)) ? FIREBASE_CONFIG : null;
  const mode = cfg ? "firebase" : "local";
  const listeners = [];
  let user = null, fb = null;

  // ---------- util ----------
  const safeUrl = u => (typeof u === "string" && /^(https:|blob:|data:image\/)/.test(u)) ? u : "";
  const clean = o => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
  function normalize(r) {
    return {
      id: String(r.id),
      name: String(r.name || "Tanpa nama"),
      category: CATEGORIES.includes(r.category) ? r.category : "Wanita",
      art: r.art || "kaos",
      price: Number(r.price) || 0,
      oldPrice: Number(r.oldPrice) > Number(r.price) ? Number(r.oldPrice) : undefined,
      badge: r.badge || "",
      tint: ["yellow", "blue", "cream"].includes(r.tint) ? r.tint : "cream",
      description: r.description || "",
      stock: Number.isFinite(Number(r.stock)) ? Math.max(0, Math.floor(Number(r.stock))) : 0,
      status: r.status === "nonaktif" ? "nonaktif" : "aktif",
      colors: Array.isArray(r.colors) && r.colors.length ? r.colors.map(c => ({
        name: String(c.name || "Warna").slice(0, 24),
        hex: typeof c.hex === "string" && /^#[\da-f]{6}$/i.test(c.hex) ? c.hex : "#E8D7C2"
      })) : [{ name: "Netral", hex: "#E8D7C2" }],
      sizes: Array.isArray(r.sizes) && r.sizes.length ? r.sizes : ["All Size"],
      rating: Number(r.rating) || 5,
      sales: Number(r.sales) || 0,
      created: Number(r.created) || (r.date ? Date.parse(r.date) : 0) || 0,
      imageUrl: safeUrl(r.imageUrl),
      imagePath: r.imagePath || ""
    };
  }
  const seedList = () => SEED_PRODUCTS.map(p => ({ ...p, stock: p.stock ?? 25, status: "aktif", created: Date.parse(p.date) }));
  const toDoc = p => clean({
    name: p.name, category: p.category, art: p.art, price: p.price, oldPrice: p.oldPrice, badge: p.badge || "",
    tint: p.tint, description: p.description, stock: p.stock, status: p.status, colors: p.colors, sizes: p.sizes,
    rating: p.rating, sales: p.sales, created: p.created, imageUrl: p.imageUrl || "", imagePath: p.imagePath || "", updated: Date.now()
  });
  const nameFromEmail = e => (e.split("@")[0].replace(/[._-]+/g, " ").trim() || "Teman Noay’s").replace(/\b\w/g, c => c.toUpperCase());
  const emit = () => listeners.forEach(f => { try { f(user); } catch { /* abaikan */ } });
  const cacheUser = () => {
    try { user ? localStorage.setItem("noaysUser", JSON.stringify({ name: user.name, email: user.email, isAdmin: user.isAdmin })) : localStorage.removeItem("noaysUser"); } catch { /* storage diblokir */ }
  };

  // ============================================================
  //  FIREBASE
  // ============================================================
  async function loadFB() {
    if (fb) return fb;
    const [app, auth, fs] = await Promise.all(["firebase-app", "firebase-auth", "firebase-firestore"].map(m => import(FB_URL + m + ".js")));
    const a = app.initializeApp(cfg);
    fb = { app: a, auth, fs, authI: auth.getAuth(a), db: fs.getFirestore(a) };
    return fb;
  }
  async function setUserFromFB(u) {
    if (!u) { user = null; cacheUser(); return; }
    let isAdmin = false;
    try { isAdmin = (await fb.fs.getDoc(fb.fs.doc(fb.db, "admins", u.uid))).exists(); } catch { isAdmin = false; }
    user = { uid: u.uid, name: u.displayName || nameFromEmail(u.email || ""), email: u.email || "", isAdmin };
    cacheUser();
  }
  const fbErr = e => {
    const c = (e && e.code) || "";
    const map = {
      "permission-denied": "Akun ini tidak memiliki izin untuk tindakan tersebut. Periksa akun dan aturan keamanan Firebase.",
      "auth/invalid-credential": "Email atau kata sandi salah.", "auth/wrong-password": "Email atau kata sandi salah.", "auth/user-not-found": "Email atau kata sandi salah.",
      "auth/email-already-in-use": "Email ini sudah terdaftar. Silakan masuk.", "auth/weak-password": "Kata sandi terlalu lemah (minimal 6 karakter).",
      "auth/invalid-email": "Format email tidak valid.", "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
      "auth/network-request-failed": "Tidak ada koneksi internet.", "unavailable": "Server tidak dapat dijangkau. Periksa koneksi internet."
    };
    return new Error(map[c] || map[c.replace(/^firestore\//, "")] || (e && e.message) || "Terjadi kesalahan.");
  };

  const firebaseBackend = {
    async init() {
      await loadFB();
      await new Promise(res => {
        let first = true;
        fb.auth.onAuthStateChanged(fb.authI, async u => { await setUserFromFB(u); if (first) { first = false; res(); } else emit(); });
      });
    },
    async list() {
      const col = fb.fs.collection(fb.db, "products");
      // Buyer hanya boleh membaca produk aktif; query HARUS memuat filter ini agar lolos Security Rules.
      const q = user && user.isAdmin ? col : fb.fs.query(col, fb.fs.where("status", "==", "aktif"));
      const snap = await fb.fs.getDocs(q).catch(e => { throw fbErr(e); });
      return snap.docs.map(d => normalize({ ...d.data(), id: d.id }));
    },
    async sort(algo, list, criteria) {
      const functionsModule = await import(FB_URL + "firebase-functions.js");
      const functions = functionsModule.getFunctions(fb.app, FUNCTIONS_REGION);
      const sortProducts = functionsModule.httpsCallable(functions, "sortProducts");
      try {
        const response = await sortProducts({
          algorithm: algo,
          criteria,
          items: list.map((product, index) => ({
            index,
            id: String(product.id),
            name: String(product.name),
            price: Number(product.price),
            created: Number(product.created),
            sales: Number(product.sales)
          }))
        });
        const result = response.data;
        if (!result || !Array.isArray(result.indices) || result.indices.length !== list.length ||
            result.indices.some(index => !Number.isInteger(index) || index < 0 || index >= list.length)) {
          throw new Error("Respons sorting dari backend tidak valid.");
        }
        return {
          ...result,
          sorted: result.indices.map(index => list[index]),
          backend: "cloud"
        };
      } catch (error) {
        if (error && error.code === "functions/not-found") {
          throw new Error("Layanan sorting backend belum tersedia. Jalankan firebase deploy --only functions.");
        }
        throw fbErr(error);
      }
    },
    async save(p, { file, removePhoto } = {}) {
      const { fs, db } = fb;
      const id = p.id || fs.doc(fs.collection(db, "products")).id;
      let imageUrl = p.imageUrl || "";
      try {
        if (file) imageUrl = await photoAsDataUrl(file);
        else if (removePhoto) imageUrl = "";
        const saved = normalize({ ...p, id, imageUrl, imagePath: "", created: p.created || Date.now() });
        await fs.setDoc(fs.doc(db, "products", id), toDoc(saved));
        return saved;
      } catch (e) {
        throw fbErr(e);
      }
    },
    async remove(p) {
      try {
        await fb.fs.deleteDoc(fb.fs.doc(fb.db, "products", p.id));
      } catch (e) { throw fbErr(e); }
    },
    async grantVerifiedPurchase(email, productId) {
      try {
        const ref = fb.fs.doc(fb.db, "verifiedPurchases", email, "products", productId);
        if ((await fb.fs.getDoc(ref)).exists()) return false;
        await fb.fs.setDoc(ref, {
          email, productId, verifiedAt: Date.now(), verifiedBy: user.uid
        });
        return true;
      } catch (e) { throw fbErr(e); }
    },
    async hasVerifiedPurchase(productId) {
      if (!user || !user.email) return false;
      try {
        const ref = fb.fs.doc(fb.db, "verifiedPurchases", user.email.toLowerCase(), "products", productId);
        return (await fb.fs.getDoc(ref)).exists();
      } catch (e) { throw fbErr(e); }
    },
    async listReviews(productId) {
      try {
        const ref = fb.fs.collection(fb.db, "reviews", productId, "entries");
        const snap = await fb.fs.getDocs(ref);
        return snap.docs.map(d => ({ ...d.data(), uid: d.id }))
          .sort((a, b) => Number(b.created) - Number(a.created));
      } catch (e) { throw fbErr(e); }
    },
    async saveReview(productId, { rating, comment }) {
      if (!user || !user.uid || !user.email) throw new Error("Masuk ke akun pembeli terlebih dahulu.");
      try {
        const ref = fb.fs.doc(fb.db, "reviews", productId, "entries", user.uid);
        const previous = await fb.fs.getDoc(ref);
        const now = Date.now();
        await fb.fs.setDoc(ref, {
          uid: user.uid,
          rating,
          comment: comment.trim(),
          created: previous.exists() ? previous.data().created : now,
          updated: now
        });
      } catch (e) { throw fbErr(e); }
    },
    async seed() {
      try {
        const batch = fb.fs.writeBatch(fb.db);
        seedList().forEach(p => batch.set(fb.fs.doc(fb.db, "products", String(p.id)), toDoc(normalize(p))));
        await batch.commit();
      } catch (e) { throw fbErr(e); }
    },
    async signIn(email, pw) { try { await fb.auth.signInWithEmailAndPassword(fb.authI, email, pw); } catch (e) { throw fbErr(e); } },
    async signUp(name, email, pw) {
      try {
        const cred = await fb.auth.createUserWithEmailAndPassword(fb.authI, email, pw);
        await fb.auth.updateProfile(cred.user, { displayName: name });
        await setUserFromFB(cred.user); emit();
      } catch (e) { throw fbErr(e); }
    },
    async signOut() { await fb.auth.signOut(fb.authI); },
    async resetPassword(email) { try { await fb.auth.sendPasswordResetEmail(fb.authI, email); } catch (e) { throw fbErr(e); } }
  };

  // ============================================================
  //  LOKAL (IndexedDB) — hanya untuk uji coba
  // ============================================================
  const idb = () => new Promise((res, rej) => {
    const r = indexedDB.open("noays-local", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("products", { keyPath: "id" });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  async function tx(modeRW, fn) {
    const d = await idb();
    return new Promise((res, rej) => {
      const t = d.transaction("products", modeRW), out = fn(t.objectStore("products"));
      t.oncomplete = () => res(out && "result" in out ? out.result : undefined);
      t.onerror = t.onabort = () => rej(t.error);
    });
  }
  const withUrl = r => { const o = { ...r }; if (r.photo) o.imageUrl = URL.createObjectURL(r.photo); delete o.photo; return o; };
  const stripForIDB = (p, photo) => ({ ...toDoc(p), id: p.id, imageUrl: "", photo: photo || undefined });

  const localBackend = {
    async init() {
      try { user = JSON.parse(localStorage.getItem("noaysUser")); } catch { user = null; }
      if (user) user.isAdmin = true; // mode lokal: tidak ada pembedaan hak akses
    },
    async list() {
      let rows = await tx("readonly", s => s.getAll());
      if (!rows.length && !localStorage.getItem("noaysSeeded")) { await localBackend.seed(); rows = await tx("readonly", s => s.getAll()); }
      return rows.map(r => normalize(withUrl(r)));
    },
    async sort(algo, list, criteria) {
      return { ...runSort(algo, list, criteria), backend: "local" };
    },
    async save(p, { file, removePhoto } = {}) {
      const id = p.id || "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const prev = p.id ? await tx("readonly", s => s.get(p.id)) : null;
      let photo = prev && prev.photo;
      if (file) photo = file; else if (removePhoto) photo = undefined;
      const saved = normalize({ ...p, id, created: p.created || Date.now() });
      await tx("readwrite", s => s.put(stripForIDB(saved, photo)));
      return normalize(withUrl({ ...stripForIDB(saved, photo), id }));
    },
    async remove(p) { await tx("readwrite", s => s.delete(p.id)); },
    async grantVerifiedPurchase() { throw new Error("Verifikasi pembelian dan ulasan memerlukan Firebase."); },
    async hasVerifiedPurchase() { return false; },
    async listReviews() { return []; },
    async saveReview() { throw new Error("Ulasan terverifikasi memerlukan Firebase dan akun pembeli."); },
    async seed() {
      await tx("readwrite", s => { s.clear(); seedList().forEach(p => s.put(stripForIDB(normalize(p)))); });
      try { localStorage.setItem("noaysSeeded", "1"); } catch { /* abaikan */ }
    },
    async signIn() { throw new Error("Mode lokal: login sungguhan aktif setelah Firebase dikonfigurasi."); },
    async signUp() { throw new Error("Mode lokal: pendaftaran sungguhan aktif setelah Firebase dikonfigurasi."); },
    async signOut() { try { localStorage.removeItem("noaysUser"); } catch { /* abaikan */ } user = null; },
    async resetPassword() { throw new Error("Mode lokal: reset kata sandi aktif setelah Firebase dikonfigurasi."); }
  };

  const be = cfg ? firebaseBackend : localBackend;
  return {
    mode,
    get user() { return user; },
    init: () => be.init(),
    listProducts: () => be.list(),
    sortProducts: (algo, list, criteria) => be.sort(algo, list, criteria),
    saveProduct: (p, opts) => be.save(p, opts),
    deleteProduct: p => be.remove(p),
    grantVerifiedPurchase: (email, id) => be.grantVerifiedPurchase(email, id),
    hasVerifiedPurchase: id => be.hasVerifiedPurchase(id),
    listReviews: id => be.listReviews(id),
    saveReview: (id, review) => be.saveReview(id, review),
    seedSamples: () => be.seed(),
    signIn: (e, p) => be.signIn(e, p),
    signUp: (n, e, p) => be.signUp(n, e, p),
    signOut: () => be.signOut(),
    resetPassword: e => be.resetPassword(e),
    onAuth: f => listeners.push(f),
    setLocalUser(u) { user = u ? { ...u, isAdmin: true } : null; cacheUser(); emit(); },
    nameFromEmail
  };
})();
