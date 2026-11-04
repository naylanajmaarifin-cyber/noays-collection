// ============================================================
//  PANEL ADMIN — tambah / edit / hapus produk + upload foto + sorting inventaris
//  Hak akses sebenarnya ditegakkan di server (Firestore Security Rules).
//  Gerbang di halaman ini hanya soal tampilan; tanpa izin admin, tulis ke database tetap ditolak.
// ============================================================
const PALETTE = [
  { name: "Kuning", hex: "#F1D302" }, { name: "Biru", hex: "#235789" }, { name: "Hitam", hex: "#273D50" },
  { name: "Netral", hex: "#E8D7C2" }, { name: "Pink", hex: "#E7A9A2" }
];
const TINT_KEYS = ["yellow", "blue", "cream"];
let colorOptions = PALETTE.map(c => ({ ...c }));
let items = [];            // semua produk yang dikembalikan database (termasuk nonaktif)
let editing = null;        // produk yang sedang diedit (null = mode tambah)
let pendingFile = null;    // File foto baru yang dipilih (belum disimpan)
let removePhoto = false;   // admin menandai foto lama untuk dihapus
let previewUrl = "";
let sortRequest = 0;

$("#shp").innerHTML = SHAPE.flower;
$("#fCat").innerHTML = CATEGORIES.map(c => `<option>${c}</option>`).join("");
$("#fArt").innerHTML = ART_TYPES.map(t => `<option>${t}</option>`).join("");
function safeColorHex(hex) { return /^#[\da-f]{6}$/i.test(hex) ? hex : "#E8D7C2"; }
function renderColorChoices(selectedNames = []) {
  $("#fColors").innerHTML = colorOptions.map((c, i) =>
    `<label><input type="checkbox" data-color-index="${i}" ${selectedNames.includes(c.name) ? "checked" : ""}><span class="sw" style="background:${safeColorHex(c.hex)}"></span>${esc(c.name)}</label>`).join("");
}
renderColorChoices(["Kuning", "Biru"]);
$("#catFilter").innerHTML = '<option value="">Semua kategori</option>' + CATEGORIES.map(c => `<option>${c}</option>`).join("");
$("#sortAlgorithm").innerHTML = algoOptionsHTML();
$("#sortBy").innerHTML = sortOptionsHTML([["featured", "Urutan awal (ID)"]], "newest");

$("#addColor").addEventListener("click", () => {
  const name = $("#fColorName").value.trim();
  const err = $("#colorErr");
  err.textContent = "";
  if (!name) { err.textContent = "Isi nama warna terlebih dahulu."; return; }
  if (colorOptions.some(c => c.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    err.textContent = "Nama warna tersebut sudah ada.";
    return;
  }
  const selected = $$("#fColors input:checked").map(input => colorOptions[Number(input.dataset.colorIndex)].name);
  colorOptions.push({ name, hex: safeColorHex($("#fColorHex").value) });
  selected.push(name);
  renderColorChoices(selected);
  $("#fColorName").value = "";
});

// ---------------- gerbang akses ----------------
function showGate(html) { const g = $("#gate"); g.innerHTML = html; g.hidden = false; $("#adminApp").hidden = true; }

function whoami() {
  const u = DB.user;
  $("#whoami").innerHTML = DB.mode === "firebase" && u ? `<span>${esc(u.email)} · <b>${u.isAdmin ? "Admin" : "Buyer"}</b></span> <button class="underlink" id="logoutBtn" type="button" style="background:none;border-width:0 0 2px">Keluar</button>` : "";
  const lo = $("#logoutBtn"); if (lo) lo.addEventListener("click", async () => { await DB.signOut(); location.reload(); });
}

async function enter() {
  const u = DB.user;
  if (DB.mode === "firebase") {
    if (!u) {
      showGate(`<h2>Masuk sebagai admin</h2><p>Halaman ini hanya untuk admin toko. Silakan masuk dengan akun admin.</p>
        <form class="form" id="gateForm"><label for="gEmail">Email</label><input id="gEmail" type="email" required autocomplete="email">
        <label for="gPw">Kata sandi</label><input id="gPw" type="password" required autocomplete="current-password">
        <button class="btn blue full" type="submit">Masuk</button><p class="field-error" id="gateErr" role="alert"></p></form>`);
      $("#gateForm").addEventListener("submit", async e => {
        e.preventDefault();
        try { await DB.signIn($("#gEmail").value.trim(), $("#gPw").value); location.reload(); } catch (err) { $("#gateErr").textContent = err.message; }
      });
      return;
    }
    whoami();
    if (!u.isAdmin) {
      showGate(`<h2>Akses ditolak</h2><p>Akun <b>${esc(u.email)}</b> adalah akun buyer, jadi tidak bisa menambah, mengedit, atau menghapus produk. Ini juga dijaga oleh aturan keamanan database, bukan hanya tampilan.</p>
        <p class="hint">Pemilik toko: untuk menjadikan akun ini admin, buat dokumen <code>admins/${esc(u.uid)}</code> di Firestore (lihat FIREBASE_SETUP.md).</p>
        <a class="btn blue" href="index.html">Kembali ke toko</a>`);
      return;
    }
  } else {
    const n = $("#modeNotice"); n.hidden = false;
    n.innerHTML = "<b>Mode lokal.</b> Data dan foto tersimpan di browser ini saja dan halaman ini belum dilindungi login. Isi <code>js/firebase-config.js</code> agar produk & foto tersimpan permanen di database dan hanya admin yang bisa mengubahnya.";
  }
  $("#gate").hidden = true; $("#adminApp").hidden = false;
  await reload();
}

async function reload() {
  try { items = await DB.listProducts(); } catch (err) { toast("Gagal memuat produk", err.message); items = []; }
  renderRows();
  renderVerifiedProductOptions();
}

function renderVerifiedProductOptions() {
  const select = $("#verifiedProduct");
  select.innerHTML = items.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
  select.disabled = DB.mode !== "firebase" || !items.length;
  $("#verifyPurchaseBtn").disabled = select.disabled;
  if (DB.mode !== "firebase") {
    $("#verificationErr").textContent = "Verifikasi ulasan tersedia setelah Firebase diaktifkan.";
  }
}

$("#purchaseVerificationForm").addEventListener("submit", async e => {
  e.preventDefault();
  const err = $("#verificationErr"), btn = $("#verifyPurchaseBtn");
  err.textContent = "";
  const email = $("#verifiedBuyerEmail").value.trim().toLowerCase();
  const productId = $("#verifiedProduct").value;
  if (!email || !productId) { err.textContent = "Isi email pembeli dan pilih produk."; return; }
  btn.disabled = true;
  try {
    const added = await DB.grantVerifiedPurchase(email, productId);
    if (!added) {
      err.textContent = "Pembelian untuk email dan produk ini sudah pernah diverifikasi.";
      return;
    }
    toast("Pembelian terverifikasi", `${email} dapat mengulas produk ini.`);
    $("#verifiedBuyerEmail").value = "";
  } catch (error) {
    err.textContent = error.message;
    toast("Gagal memverifikasi pembelian", error.message);
  } finally {
    btn.disabled = DB.mode !== "firebase" || !items.length;
  }
});

// ---------------- tabel inventaris + sorting ----------------
async function renderRows() {
  const requestId = ++sortRequest;
  const cat = $("#catFilter").value;
  const base = cat ? items.filter(p => p.category === cat) : items;
  let res;
  try {
    res = await DB.sortProducts($("#sortAlgorithm").value, base, $("#sortBy").value);
  } catch (error) {
    if (requestId !== sortRequest) return;
    $("#algoStats").textContent = `Gagal mengurutkan produk: ${error.message}`;
    $("#countTag").textContent = "";
    $("#rows").innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:28px">${esc(error.message)}</td></tr>`;
    return;
  }
  if (requestId !== sortRequest) return;
  $("#algoStats").innerHTML = sortInfoHTML(res);
  $("#countTag").textContent = res.count + " produk";
  $("#rows").innerHTML = res.sorted.map(p => `<tr>
    <td><span class="thumb ${p.imageUrl ? "has-photo" : ""}" style="--tint:${TINTS[p.tint] || TINTS.cream}">${productArt(p)}</span></td>
    <td><b>${esc(p.name)}</b><br><small style="color:var(--muted)">${p.created ? new Date(p.created).toLocaleDateString("id-ID") : "—"}</small></td>
    <td><span class="tag">${esc(p.category)}</span></td>
    <td>${money(p.price)}${p.oldPrice ? `<br><del>${money(p.oldPrice)}</del>` : ""}</td>
    <td class="${p.stock <= 0 ? "stock out" : (p.stock <= 5 ? "stock low" : "")}">${p.stock}</td>
    <td><span class="tag ${p.status === "nonaktif" ? "tag-off" : ""}">${p.status === "nonaktif" ? "Nonaktif" : "Aktif"}</span></td>
    <td class="row-actions"><button class="link-edit" data-edit="${esc(p.id)}">Edit</button><button class="link-danger" data-del="${esc(p.id)}">Hapus</button></td></tr>`).join("")
    || '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:28px">Belum ada produk. Tambahkan lewat formulir, atau impor produk contoh.</td></tr>';
  $("#seedHint").textContent = DB.mode === "firebase" ? "Menulis 16 produk contoh ke Firestore (ID 1–16)." : "Mengembalikan katalog lokal ke 16 produk contoh.";
}
["#sortAlgorithm", "#sortBy", "#catFilter"].forEach(s => $(s).addEventListener("change", renderRows));

$("#rows").addEventListener("click", async e => {
  const ed = e.target.closest("[data-edit]"), del = e.target.closest("[data-del]");
  if (ed) { startEdit(items.find(p => p.id === ed.dataset.edit)); return; }
  if (del) {
    const p = items.find(x => x.id === del.dataset.del);
    if (!p || !confirm(`Hapus “${p.name}” dari katalog?${p.imageUrl ? " Fotonya juga akan dihapus." : ""} Tindakan ini tidak bisa dibatalkan.`)) return;
    try { await DB.deleteProduct(p); toast("Produk dihapus", p.name); if (editing && editing.id === p.id) resetForm(); await reload(); }
    catch (err) { toast("Gagal menghapus", err.message); }
  }
});

$("#seedBtn").addEventListener("click", async () => {
  if (!confirm(DB.mode === "firebase" ? "Impor 16 produk contoh? Produk dengan ID 1–16 yang sudah ada akan ditimpa." : "Kembalikan katalog lokal ke produk contoh? Produk & foto lokalmu akan terhapus.")) return;
  try { await DB.seedSamples(); toast("Produk contoh diimpor", "16 produk ditambahkan."); await reload(); } catch (err) { toast("Gagal mengimpor", err.message); }
});

// ---------------- foto ----------------
function setPreview(url) {
  if (previewUrl && previewUrl.startsWith("blob:") && url !== previewUrl && (!editing || previewUrl !== editing.imageUrl)) URL.revokeObjectURL(previewUrl);
  previewUrl = url || "";
  const box = $("#photoPreview");
  box.innerHTML = url ? `<img src="${esc(url)}" alt="Pratinjau foto produk">` : '<span class="photo-empty">Belum ada foto<br><small>Placeholder Noay’s dipakai</small></span>';
  $("#removePhoto").hidden = !url;
}
$("#pickPhoto").addEventListener("click", () => $("#fPhoto").click());
$("#fPhoto").addEventListener("change", e => {
  const f = e.target.files[0];
  $("#photoErr").textContent = "";
  if (!f) return;
  const err = validatePhoto(f);
  if (err) { $("#photoErr").textContent = err; toast("Foto tidak valid", err); e.target.value = ""; return; }
  pendingFile = f; removePhoto = false;
  setPreview(URL.createObjectURL(f));
  $("#photoName").textContent = `${f.name} · ${(f.size / 1024).toFixed(0)} KB`;
});
$("#removePhoto").addEventListener("click", () => {
  pendingFile = null; removePhoto = true; $("#fPhoto").value = ""; $("#photoName").textContent = editing && editing.imageUrl ? "Foto lama akan dihapus saat disimpan." : "";
  setPreview("");
});

// ---------------- form tambah / edit ----------------
function resetForm() {
  editing = null; pendingFile = null; removePhoto = false;
  $("#productForm").reset();
  $("#fStock").value = 0; $("#fSizes").value = "S, M, L, XL"; $("#fSizes").disabled = false;
  colorOptions = PALETTE.map(c => ({ ...c }));
  renderColorChoices(["Kuning", "Biru"]);
  $("#fColorHex").value = "#88A68A"; $("#colorErr").textContent = "";
  $("#fPhoto").value = ""; $("#photoName").textContent = ""; $("#photoErr").textContent = ""; $("#formErr").textContent = "";
  setPreview("");
  $("#formTitle").textContent = "Tambah produk"; $("#formSub").textContent = "Langsung muncul di halaman buyer setelah disimpan.";
  $("#saveBtn").textContent = "Simpan produk"; $("#cancelEdit").hidden = true;
}
function startEdit(p) {
  if (!p) return;
  resetForm(); editing = p;
  $("#fName").value = p.name; $("#fCat").value = p.category; $("#fStatus").value = p.status;
  $("#fPrice").value = p.price; $("#fOld").value = p.oldPrice || ""; $("#fStock").value = p.stock;
  $("#fArt").value = p.art; $("#fDesc").value = p.description;
  colorOptions = PALETTE.map(c => ({ ...c }));
  p.colors.forEach(color => {
    const existing = colorOptions.find(c => c.name === color.name);
    const savedColor = { name: color.name, hex: safeColorHex(color.hex) };
    if (existing) existing.hex = savedColor.hex;
    else colorOptions.push(savedColor);
  });
  renderColorChoices(p.colors.map(c => c.name));
  const none = p.sizes.length === 1 && p.sizes[0] === "All Size";
  $("#fNoSize").checked = none; $("#fSizes").disabled = none; $("#fSizes").value = none ? "" : p.sizes.join(", ");
  setPreview(p.imageUrl);
  $("#formTitle").textContent = "Edit produk"; $("#formSub").textContent = p.name;
  $("#saveBtn").textContent = "Simpan perubahan"; $("#cancelEdit").hidden = false;
  $("#formPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}
$("#cancelEdit").addEventListener("click", resetForm);
$("#fNoSize").addEventListener("change", e => { $("#fSizes").disabled = e.target.checked; });

$("#productForm").addEventListener("submit", async e => {
  e.preventDefault();
  const ferr = $("#formErr"); ferr.textContent = "";
  const name = $("#fName").value.trim(), price = Number($("#fPrice").value), old = Number($("#fOld").value) || 0;
  const stockRaw = $("#fStock").value, stock = Number(stockRaw);
  const colors = $$("#fColors input:checked").map(input => colorOptions[Number(input.dataset.colorIndex)]);
  const problems = [];
  if (!name) problems.push("Nama produk wajib diisi.");
  if (!$("#fPrice").value || !(price >= 0)) problems.push("Harga harus berupa angka 0 atau lebih.");
  if (old && old <= price) problems.push("Harga coret harus lebih besar dari harga jual (atau kosongkan).");
  if (stockRaw === "" || !Number.isInteger(stock) || stock < 0) problems.push("Stok harus bilangan bulat 0 atau lebih.");
  if (!colors.length) problems.push("Pilih minimal satu warna.");
  if (pendingFile) { const pe = validatePhoto(pendingFile); if (pe) problems.push(pe); }
  if (problems.length) { ferr.textContent = problems.join(" "); toast("Periksa formulir", problems[0]); return; }

  const sizes = $("#fNoSize").checked ? ["All Size"] : ($("#fSizes").value.split(",").map(s => s.trim()).filter(Boolean));
  const p = {
    ...(editing || { rating: 5, sales: 0, badge: "NEW", tint: TINT_KEYS[Math.floor(Math.random() * 3)] }),
    name, category: $("#fCat").value, status: $("#fStatus").value, price, oldPrice: old || undefined, stock,
    art: $("#fArt").value, description: $("#fDesc").value.trim() || "Produk dari Noay’s Collection.",
    colors, sizes: sizes.length ? sizes : ["All Size"]
  };
  const btn = $("#saveBtn"), label = btn.textContent;
  btn.disabled = true; btn.textContent = pendingFile ? "Mengunggah foto…" : "Menyimpan…";
  try {
    const hadFile = !!pendingFile;
    await DB.saveProduct(p, { file: pendingFile, removePhoto });
    toast("Produk berhasil disimpan", name);
    if (hadFile) setTimeout(() => toast("Foto berhasil diunggah", "Foto tersimpan permanen."), 900);
    resetForm(); await reload();
  } catch (err) {
    ferr.textContent = err.message; toast("Gagal menyimpan", err.message);
    btn.textContent = label;
  } finally { btn.disabled = false; if (!editing) btn.textContent = "Simpan produk"; else btn.textContent = "Simpan perubahan"; }
});

READY.then(enter);
