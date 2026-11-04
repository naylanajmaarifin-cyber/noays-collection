// ============================================================
//  FUNGSI BERSAMA: header, footer, keranjang, favorit, kartu produk,
//  quick view, drawer keranjang, toast
// ============================================================
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => "Rp" + Math.round(n).toLocaleString("id-ID");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage penuh / diblokir */ } }
};
const findProduct = id => PRODUCTS.find(p => String(p.id) === String(id));
let DATA_LOADED = false;

// Gambar produk: foto asli jika ada, jika tidak ilustrasi SVG bergaya logo (placeholder)
function productArt(p, hex, label) {
  const c = hex || p.colors[0].hex;
  return p.imageUrl
    ? `<img class="photo" src="${esc(p.imageUrl)}" alt="${esc(label || p.name)}" loading="lazy" decoding="async" data-art="${esc(p.art)}" data-hex="${esc(c)}">`
    : garment(p.art, c, label || p.name);
}
// Jika URL foto gagal dimuat, jatuh kembali ke ilustrasi placeholder
document.addEventListener("error", e => {
  const im = e.target;
  if (im && im.tagName === "IMG" && im.classList.contains("photo")) {
    im.closest(".has-photo")?.classList.remove("has-photo");
    im.outerHTML = garment(im.dataset.art || "kaos", im.dataset.hex || "#F1D302", im.alt);
  }
}, true);
const stockLabel = p => p.stock <= 0 ? "Stok habis" : (p.stock <= 5 ? `Sisa ${p.stock}` : `Stok ${p.stock}`);

const ICON = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.500 4.500"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.500C5 15.500 3 12 3 8.800 3 6 5.200 4 7.800 4c1.700 0 3.200.9 4.200 2.500C13 4.900 14.500 4 16.200 4 18.800 4 21 6 21 8.800c0 3.200-2 6.700-9 11.700Z"/></svg>',
  user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/></svg>',
  bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6.500a3 3 0 0 1 6 0V8"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  truck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.500" r="1.800"/><circle cx="17" cy="17.500" r="1.800"/></svg>',
  wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.200-4.100A8 8 0 1 1 8.200 18.900L4 20Z"/><path d="M9 8.800c.3 2.300 2.400 4.500 5.200 5.200l1.200-1.300-1.900-1-.8.700c-1-.4-1.800-1.200-2.200-2.200l.7-.8-1-1.900L9 8.800Z"/></svg>'
};

// ------------------------------------------------------------
//  Keranjang & favorit (localStorage)
// ------------------------------------------------------------
function readCart() {
  const raw = store.get("noaysCart", []).map(x => ({ ...x, id: String(x.id) }));
  return DATA_LOADED ? raw.filter(x => findProduct(x.id)) : raw;
}
const maxQty = id => { const p = findProduct(id); return p ? Math.max(0, Math.min(99, p.stock)) : 99; };
function saveCart(c) { store.set("noaysCart", c); updateBadges(); renderDrawer(); }
function addToCart(id, color, size, qty = 1) {
  const c = readCart();
  const sid = String(id), cap = maxQty(sid);
  const hit = c.find(x => x.id === sid && x.color === color && x.size === size);
  if (hit) hit.qty = Math.min(cap, hit.qty + qty); else c.push({ id: sid, color, size, qty: Math.min(cap, qty) });
  saveCart(c);
}
const cartCount = () => readCart().reduce((s, x) => s + x.qty, 0);
const cartSubtotal = () => readCart().reduce((s, x) => s + (findProduct(x.id) ? findProduct(x.id).price * x.qty : 0), 0);
const readWish = () => store.get("noaysWish", []).map(String).filter(id => !DATA_LOADED || findProduct(id));
const isWished = id => readWish().includes(String(id));
function toggleWish(id) {
  let w = readWish();
  const sid = String(id), on = !w.includes(sid);
  w = on ? [...w, sid] : w.filter(x => x !== sid);
  store.set("noaysWish", w);
  updateBadges();
  $$(`[data-wish="${id}"]`).forEach(b => b.setAttribute("aria-pressed", on));
  toast(on ? "Disimpan ke favorit" : "Dihapus dari favorit", findProduct(id).name);
  return on;
}
function shippingNote(subtotal) {
  if (subtotal <= 0) return "";
  if (subtotal >= STORE.freeShippingMin) return "🎉 Selamat! Kamu dapat <b>gratis ongkir</b>.";
  return `Belanja <b>${money(STORE.freeShippingMin - subtotal)}</b> lagi untuk gratis ongkir.`;
}

// ------------------------------------------------------------
//  Kartu produk
// ------------------------------------------------------------
function productCard(p) {
  const disc = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const href = "product.html?id=" + encodeURIComponent(p.id);
  return `<article class="product-card">
    <div class="product-visual ${p.imageUrl ? "has-photo" : ""}" style="--tint:${TINTS[p.tint] || TINTS.cream}">
      <a class="product-link" href="${href}" aria-label="Lihat ${esc(p.name)}">${productArt(p)}</a>
      <div class="badges">${p.stock <= 0 ? '<span class="badge badge-out">HABIS</span>' : (p.badge ? `<span class="badge">${esc(p.badge)}</span>` : "")}${disc ? `<span class="badge badge-sale">−${disc}%</span>` : ""}</div>
      <button class="wish" data-wish="${p.id}" aria-pressed="${isWished(p.id)}" aria-label="Simpan ${esc(p.name)} ke favorit">${ICON.heart}</button>
      <button class="quick" data-quick="${p.id}">Lihat cepat</button>
    </div>
    <div class="product-info">
      <div class="meta"><span>${esc(p.category)}</span></div>
      <a href="${href}"><h3>${esc(p.name)}</h3></a>
      <div class="price-row"><b class="price">${money(p.price)}</b>${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ""}</div>
      <div class="stock ${p.stock <= 0 ? "out" : (p.stock <= 5 ? "low" : "")}">${stockLabel(p)}</div>
      <div class="mini-colors" aria-label="Pilihan warna">${p.colors.map(c => `<i title="${esc(c.name)}" style="background:${c.hex}"></i>`).join("")}</div>
    </div>
  </article>`;
}

// ------------------------------------------------------------
//  Pemilih warna / ukuran / jumlah (dipakai halaman detail & quick view)
// ------------------------------------------------------------
function pickerHTML(p) {
  const single = p.sizes.length === 1;
  return `<div class="picker">
    <div class="choice-block"><div class="choice-title">Warna: <b class="pick-color">${esc(p.colors[0].name)}</b></div>
      <div class="color-options">${p.colors.map((c, i) => `<button type="button" class="color-choice ${i === 0 ? "selected" : ""}" data-color="${i}" title="${esc(c.name)}" aria-label="Warna ${esc(c.name)}" style="--swatch:${c.hex}"></button>`).join("")}</div></div>
    <div class="choice-block"><div class="choice-title">Ukuran: <b class="pick-size">${esc(p.sizes[0])}</b></div>
      <div class="size-options">${p.sizes.map((s, i) => `<button type="button" class="size-choice ${i === 0 ? "selected" : ""}" data-size="${esc(s)}">${esc(s)}</button>`).join("")}</div>
      ${single ? "" : '<small class="hint">Pilih ukuran yang sesuai sebelum menambahkan ke tas.</small>'}</div>
    <div class="choice-block"><div class="choice-title">Jumlah <small class="hint" style="display:inline;margin:0 0 0 6px">(${stockLabel(p)})</small></div>
      <div class="qty-picker"><button type="button" data-minus aria-label="Kurangi">−</button><b class="pick-qty">1</b><button type="button" data-plus aria-label="Tambah">+</button></div></div>
    <button type="button" class="btn yellow full" data-add ${p.stock <= 0 ? "disabled" : ""}>${p.stock <= 0 ? "Stok habis" : "＋ Masukkan ke Tas"}</button>
  </div>`;
}
function bindPicker(root, p, onChange) {
  const st = { color: p.colors[0], size: p.sizes[0], qty: 1 };
  root.addEventListener("click", e => {
    const c = e.target.closest("[data-color]");
    if (c) {
      st.color = p.colors[+c.dataset.color];
      $$("[data-color]", root).forEach(x => x.classList.toggle("selected", x === c));
      $(".pick-color", root).textContent = st.color.name;
      onChange && onChange(st);
      return;
    }
    const s = e.target.closest("[data-size]");
    if (s) {
      st.size = s.dataset.size;
      $$("[data-size]", root).forEach(x => x.classList.toggle("selected", x === s));
      $(".pick-size", root).textContent = st.size;
      return;
    }
    if (e.target.closest("[data-minus]")) { st.qty = Math.max(1, st.qty - 1); $(".pick-qty", root).textContent = st.qty; return; }
    if (e.target.closest("[data-plus]")) { st.qty = Math.min(Math.max(1, p.stock), st.qty + 1); $(".pick-qty", root).textContent = st.qty; return; }
    const add = e.target.closest("[data-add]");
    if (add && !add.disabled) {
      addToCart(p.id, st.color.name, st.size, st.qty);
      add.textContent = "✓ Ditambahkan ke Tas";
      add.classList.add("done");
      setTimeout(() => { add.textContent = "＋ Masukkan ke Tas"; add.classList.remove("done"); }, 1400);
      toast("Masuk ke tas 🐰", `${p.name} · ${st.color.name} · ${st.size} × ${st.qty}`);
    }
  });
  return st;
}

// ------------------------------------------------------------
//  Toast
// ------------------------------------------------------------
let toastTimer;
function toast(title, msg = "") {
  const t = $("#toast");
  if (!t) return;
  $("#toastTitle").textContent = title;
  $("#toastMsg").textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

// ------------------------------------------------------------
//  Modal & drawer
// ------------------------------------------------------------
function openModal(html) {
  const m = $("#modal");
  $(".modal-body", m).innerHTML = html;
  m.hidden = false;
  document.body.classList.add("lock");
  $(".modal-close", m).focus();
}
function closeModal() { $("#modal").hidden = true; document.body.classList.remove("lock"); }

function openQuick(id) {
  const p = findProduct(id);
  if (!p) return;
  openModal(`<div class="quick-layout">
    <div class="quick-visual ${p.imageUrl ? "has-photo" : ""}" id="quickVisual" style="--tint:${TINTS[p.tint] || TINTS.cream}">${productArt(p)}</div>
    <div class="quick-info">
      <p class="eyebrow">${esc(p.category.toUpperCase())}</p>
      <h2>${esc(p.name)}</h2>
      <div class="detail-price">${money(p.price)} ${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ""}</div>
      <p class="description">${esc(p.description)}</p>
      <div id="quickPicker">${pickerHTML(p)}</div>
      <a class="underlink" href="product.html?id=${encodeURIComponent(p.id)}">Lihat detail lengkap ↗</a>
    </div></div>`);
  bindPicker($("#quickPicker"), p, st => { if (!p.imageUrl) $("#quickVisual").innerHTML = garment(p.art, st.color.hex, p.name); });
}

function openDrawer() { renderDrawer(); $("#drawer").classList.add("open"); $("#scrim").hidden = false; document.body.classList.add("lock"); }
function closeDrawer() { $("#drawer").classList.remove("open"); $("#scrim").hidden = true; document.body.classList.remove("lock"); }

function renderDrawer() {
  const box = $("#drawerItems");
  if (!box) return;
  const c = readCart();
  if (!DATA_LOADED) { box.innerHTML = '<p class="muted" style="padding:20px 0">Memuat…</p>'; $("#drawerFoot").hidden = true; return; }
  if (!c.length) {
    box.innerHTML = `<div class="cart-empty">${bunny("sm")}<h3>Tasmu masih kosong</h3><p>Yuk, cari outfit yang kamu suka!</p><a class="btn blue" href="category.html?type=Semua">Mulai belanja ${ICON.arrow}</a></div>`;
  } else {
    box.innerHTML = c.map((x, i) => {
      const p = findProduct(x.id);
      const col = p.colors.find(k => k.name === x.color) || p.colors[0];
      return `<div class="mini-line">
        <div class="mini-art ${p.imageUrl ? "has-photo" : ""}" style="--tint:${TINTS[p.tint] || TINTS.cream}">${productArt(p, col.hex)}</div>
        <div class="mini-info"><a href="product.html?id=${encodeURIComponent(p.id)}"><b>${esc(p.name)}</b></a>
          <small>${esc(x.color)} · ${esc(x.size)}</small><span>${money(p.price)}</span>
          <div class="qty-picker sm"><button data-dqty="${i}" data-d="-1" aria-label="Kurangi">−</button><b>${x.qty}</b><button data-dqty="${i}" data-d="1" aria-label="Tambah">+</button></div></div>
        <button class="remove" data-dremove="${i}" aria-label="Hapus">${ICON.close}</button></div>`;
    }).join("");
  }
  const sub = cartSubtotal();
  $("#drawerSub").textContent = money(sub);
  $("#drawerShip").innerHTML = shippingNote(sub);
  $("#drawerFoot").hidden = !c.length;
}

function updateBadges() {
  $$("[data-bag-count]").forEach(el => el.textContent = cartCount());
  const w = readWish().length;
  $$("[data-wish-count]").forEach(el => { el.textContent = w; el.hidden = !w; });
}

// ------------------------------------------------------------
//  Header & footer
// ------------------------------------------------------------
const NAV = [
  ["cart.html", "🐰 Tas Belanja", "Tas"],
  ["category.html?type=Wanita", "✿ Baju Wanita", "Wanita"],
  ["category.html?type=Pria", "✦ Baju Pria", "Pria"],
  ["category.html?type=Hijab", "〰 Hijab", "Hijab"],
  ["category.html?type=Aksesori", "♡ Aksesori", "Aksesori"],
  ["category.html?type=Baru", "✷ Terbaru", "Baru"],
  ["category.html?type=Promo", "☀ Promo", "Promo"]
];

function brandHTML(extra = "") {
  return `<a class="brand ${extra}" href="index.html" aria-label="Noay’s Collection — beranda">${bunny("brand-bunny")}<span class="brand-text"><b>noay’s</b><small>collection</small></span></a>`;
}

function mountChrome() {
  const user = store.get("noaysUser", null);
  const page = location.pathname.split("/").pop() || "index.html";
  const type = new URLSearchParams(location.search).get("type");
  const q = new URLSearchParams(location.search).get("q") || "";
  const activeKey = page === "cart.html" ? "Tas" : (page === "category.html" ? type : "");

  const header = $("#site-header");
  window.refreshUser = () => {
    const u = DB.user || store.get("noaysUser", null), b = $("#userBtn");
    if (!b) return;
    b.classList.toggle("logged", !!u);
    b.setAttribute("aria-label", u ? "Akun " + u.name : "Masuk");
    b.innerHTML = u ? `<span class="avatar">${esc(u.name.charAt(0).toUpperCase())}</span>` : ICON.user;
  };
  if (header) header.innerHTML = `
    <div class="announcement"><span>☀ GOOD CLOTHES</span><span class="dot">✦</span><span>GOOD MOOD</span><span class="dot">✦</span><span>ALWAYS YOU</span><span class="ship-note">· Gratis ongkir min. ${money(STORE.freeShippingMin)}</span></div>
    <div class="header"><div class="header-row">
      ${brandHTML()}
      <form class="search" role="search" id="searchForm"><span class="search-ico">${ICON.search}</span><input id="searchInput" type="search" name="q" value="${esc(q)}" placeholder="Cari pashmina, dress, kemeja…" aria-label="Cari produk"><button class="search-go" type="submit">Cari</button></form>
      <div class="head-tools">
        <a class="icon-btn" href="category.html?type=Favorit" aria-label="Favorit">${ICON.heart}<span class="count" data-wish-count hidden>0</span></a>
        <a class="icon-btn" id="userBtn" href="login.html"></a>
        <button class="bag-btn" type="button" id="openBag" aria-label="Buka tas belanja">${ICON.bag}<span>Tas</span><b data-bag-count>0</b></button>
      </div></div></div>
    <nav class="nav-yellow" aria-label="Kategori">${NAV.map(([href, label, key]) => `<a href="${href}" ${key === activeKey ? 'aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`;

  const footer = $("#site-footer");
  if (footer) footer.innerHTML = `
    <div class="gingham gingham-band" aria-hidden="true"></div>
    <footer class="footer"><div class="footer-grid">
      <div class="footer-brand">${wordmark("on-dark")}<p>Outfit santai, warna ceria, dan pilihan nyaman untuk menemani setiap harimu.</p>
        <div class="social">${STORE.instagram ? `<a href="${esc(STORE.instagram)}" target="_blank" rel="noopener">Instagram</a>` : ""}${STORE.tiktok ? `<a href="${esc(STORE.tiktok)}" target="_blank" rel="noopener">TikTok</a>` : ""}${STORE.youtube ? `<a href="${esc(STORE.youtube)}" target="_blank" rel="noopener">YouTube</a>` : ""}<a href="https://wa.me/${encodeURIComponent(STORE.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a></div></div>
      <div><h4>Jelajahi</h4><a href="category.html?type=Wanita">Baju Wanita</a><a href="category.html?type=Pria">Baju Pria</a><a href="category.html?type=Hijab">Hijab</a><a href="category.html?type=Aksesori">Aksesori</a><a href="category.html?type=Promo">Promo</a></div>
      <div><h4>Bantuan</h4><a href="login.html">Akun saya</a><a href="cart.html">Tas belanja</a><a href="mailto:${STORE.email}">${STORE.email}</a><a href="admin.html">Panel admin</a></div>
      <div><h4>Join Noay’s Club</h4><p>Dapatkan info promo & koleksi baru.</p>
        <form class="newsletter" id="newsletter"><input type="email" required placeholder="Email kamu" aria-label="Email"><button class="btn yellow" type="submit">Gabung</button></form></div>
    </div><p class="copyright">© 2026 Noay’s Collection · Wear your sunshine ☀</p></footer>`;

  document.body.insertAdjacentHTML("beforeend", `
    <div id="scrim" class="scrim" hidden></div>
    <aside id="drawer" class="drawer" aria-label="Tas belanja">
      <div class="drawer-head"><h2>Tas belanja ${SHAPE.heart}</h2><button class="icon-btn" id="closeBag" aria-label="Tutup">${ICON.close}</button></div>
      <div id="drawerItems" class="drawer-items"></div>
      <div id="drawerFoot" class="drawer-foot" hidden>
        <div class="summary-row"><span>Subtotal</span><b id="drawerSub">Rp0</b></div>
        <p class="ship-hint" id="drawerShip"></p>
        <a class="btn blue full" href="cart.html">Lihat tas & checkout ${ICON.arrow}</a>
      </div>
    </aside>
    <div id="modal" class="modal" hidden><div class="modal-card" role="dialog" aria-modal="true"><button class="icon-btn modal-close" aria-label="Tutup">${ICON.close}</button><div class="modal-body"></div></div></div>
    <div id="toast" class="toast" role="status" aria-live="polite"><span class="toast-ico">${bunny("xs")}</span><div><b id="toastTitle"></b><small id="toastMsg"></small></div></div>`);

  // --- events ---
  $("#searchForm").addEventListener("submit", e => {
    e.preventDefault();
    const v = $("#searchInput").value.trim();
    location.href = "category.html?type=Semua" + (v ? "&q=" + encodeURIComponent(v) : "");
  });
  $("#openBag").addEventListener("click", openDrawer);
  $("#closeBag").addEventListener("click", closeDrawer);
  $("#scrim").addEventListener("click", closeDrawer);
  $("#modal").addEventListener("click", e => { if (e.target.id === "modal" || e.target.closest(".modal-close")) closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeModal(); closeDrawer(); } });
  $("#newsletter").addEventListener("submit", e => { e.preventDefault(); e.target.reset(); toast("Terima kasih! 🐰", "Kamu sudah bergabung di Noay’s Club."); });

  $("#drawerItems").addEventListener("click", e => {
    const q = e.target.closest("[data-dqty]"), r = e.target.closest("[data-dremove]");
    const c = readCart();
    if (q) { const i = +q.dataset.dqty; c[i].qty = Math.min(maxQty(c[i].id), c[i].qty + +q.dataset.d); if (c[i].qty < 1) c.splice(i, 1); saveCart(c); if (window.renderCartPage) renderCartPage(); }
    if (r) { c.splice(+r.dataset.dremove, 1); saveCart(c); if (window.renderCartPage) renderCartPage(); }
  });

  // Delegasi global: favorit & lihat cepat di kartu produk mana pun
  document.addEventListener("click", e => {
    const w = e.target.closest("[data-wish]");
    if (w) { e.preventDefault(); toggleWish(w.dataset.wish); if (window.onWishChange) onWishChange(); return; }
    const qv = e.target.closest("[data-quick]");
    if (qv) { e.preventDefault(); openQuick(qv.dataset.quick); }
  });

  updateBadges();
  refreshUser();
  renderDrawer();
}

// Hitung mundur sampai tengah malam (promo harian)
function mountCountdown(el) {
  if (!el) return;
  const pad = n => String(n).padStart(2, "0");
  const tick = () => {
    const now = new Date(), end = new Date(now); end.setHours(24, 0, 0, 0);
    const s = Math.max(0, Math.floor((end - now) / 1000));
    el.innerHTML = [["Jam", Math.floor(s / 3600)], ["Menit", Math.floor(s % 3600 / 60)], ["Detik", s % 60]]
      .map(([l, v]) => `<span class="cd"><b>${pad(v)}</b><small>${l}</small></span>`).join('<i>:</i>');
  };
  tick();
  setInterval(tick, 1000);
}

mountChrome();

// ------------------------------------------------------------
//  Memuat data produk dari database. Skrip halaman memakai READY.then(...)
// ------------------------------------------------------------
function showBanner(msg) {
  const b = document.createElement("div");
  b.className = "load-error"; b.setAttribute("role", "alert"); b.textContent = msg;
  document.body.insertBefore(b, document.body.firstChild);
}
const READY = (async () => {
  try {
    await DB.init();
    const all = await DB.listProducts();
    ALL_PRODUCTS.splice(0, ALL_PRODUCTS.length, ...all);
    PRODUCTS.splice(0, PRODUCTS.length, ...all.filter(p => p.status !== "nonaktif"));
  } catch (err) {
    console.error(err);
    showBanner("Produk gagal dimuat: " + (err && err.message ? err.message : err) + " — periksa koneksi internet dan konfigurasi Firebase.");
  }
  DATA_LOADED = true;
  if (DB.mode === "local") {
    document.body.insertAdjacentHTML("afterbegin", '<div class="mode-bar">MODE LOKAL — data & foto hanya tersimpan di browser ini dan belum ada keamanan. Isi <code>js/firebase-config.js</code> untuk mengaktifkan database permanen.</div>');
  }
  DB.onAuth(() => refreshUser());
  refreshUser(); updateBadges(); renderDrawer();
})();
