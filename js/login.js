// Halaman masuk / daftar.
//  • Mode Firebase : Firebase Authentication (email + kata sandi). Peran admin ditentukan di database
//                    (dokumen admins/{uid}), bukan oleh tombol di tampilan.
//  • Mode lokal    : demo tanpa kata sandi tersimpan (hanya untuk uji coba tampilan).
const card = $("#loginCard");
let mode = "login";
const nextUrl = new URLSearchParams(location.search).get("next");
const safeNext = n => (n && /^[a-z0-9_-]+\.html$/i.test(n)) ? n : null;

function render() {
  const user = DB.user;
  if (user && (DB.mode === "firebase" || store.get("noaysUser", null))) {
    card.innerHTML = `<div class="welcome"><span class="avatar">${esc(user.name.charAt(0).toUpperCase())}</span>
      <p class="eyebrow">${user.isAdmin && DB.mode === "firebase" ? "Admin" : "Welcome back"}</p><h2>Halo, ${esc(user.name)}!</h2><p style="color:var(--muted)">${esc(user.email)}</p>
      <a class="btn blue full" href="category.html?type=Semua">Lanjut belanja ${ICON.arrow}</a>
      ${user.isAdmin ? '<a class="btn yellow full" href="admin.html">Buka panel admin</a>' : ""}
      <a class="btn outline full" href="category.html?type=Favorit">Lihat favoritku</a>
      <button class="clear-cart" id="logout">Keluar</button></div>`;
    $("#logout").addEventListener("click", async () => { await DB.signOut(); location.reload(); });
    return;
  }
  const reg = mode === "register", fb = DB.mode === "firebase";
  card.innerHTML = `
    <div class="tabs" role="tablist"><button role="tab" aria-selected="${!reg}" data-mode="login">Masuk</button><button role="tab" aria-selected="${reg}" data-mode="register">Daftar</button></div>
    <p class="eyebrow">Welcome to noay’s</p>
    <h2 style="margin-bottom:6px">${reg ? "Buat akun barumu" : "Masuk ke akunmu"}</h2>
    <form class="form" id="authForm">
      ${reg ? `<label for="aName">Nama lengkap</label><input id="aName" required maxlength="50" autocomplete="name">` : ""}
      <label for="aEmail">Email</label><input id="aEmail" type="email" required placeholder="nama@email.com" autocomplete="email">
      <label for="password">Kata sandi</label>
      <div class="password"><input id="password" type="password" required minlength="6" placeholder="Minimal 6 karakter" autocomplete="${reg ? "new-password" : "current-password"}"><button type="button" id="toggle">Lihat</button></div>
      ${reg ? "" : `<div class="form-row"><span></span><a href="#" id="forgot" style="color:#8E7A00;font-weight:700">Lupa kata sandi?</a></div>`}
      <button class="btn blue full" type="submit" id="submitBtn">${reg ? "Daftar dengan ceria" : "Masuk dengan ceria"} ${ICON.arrow}</button>
      <a class="btn outline full" href="index.html">Lanjut sebagai tamu</a>
      <p id="message" class="message" role="status"></p>
      <p class="tiny">${fb ? "Akun buyer hanya bisa melihat dan membeli produk. Hak admin diberikan oleh pemilik toko lewat database." : "MODE LOKAL: ini demo tampilan. Login sungguhan aktif setelah Firebase dikonfigurasi, dan kata sandi tidak disimpan."}</p>
    </form>`;
  $$("[data-mode]", card).forEach(b => b.addEventListener("click", () => { mode = b.dataset.mode; render(); }));
  $("#toggle").addEventListener("click", () => {
    const pw = $("#password");
    pw.type = pw.type === "password" ? "text" : "password";
    $("#toggle").textContent = pw.type === "password" ? "Lihat" : "Sembunyikan";
  });
  const msg = t => { $("#message").textContent = t; };
  const forgot = $("#forgot");
  if (forgot) forgot.addEventListener("click", async e => {
    e.preventDefault();
    const email = $("#aEmail").value.trim();
    if (!email) { msg("Isi email dulu, lalu klik “Lupa kata sandi?”."); return; }
    try { await DB.resetPassword(email); msg("Tautan reset kata sandi sudah dikirim ke email kamu."); } catch (err) { msg(err.message); }
  });
  $("#authForm").addEventListener("submit", async e => {
    e.preventDefault();
    const email = $("#aEmail").value.trim(), pw = $("#password").value, btn = $("#submitBtn");
    btn.disabled = true; msg("");
    try {
      if (DB.mode === "firebase") {
        if (reg) await DB.signUp($("#aName").value.trim(), email, pw); else await DB.signIn(email, pw);
        await new Promise(r => setTimeout(r, 300));           // beri waktu status admin terbaca
        location.href = safeNext(nextUrl) || (DB.user && DB.user.isAdmin ? "admin.html" : "index.html");
      } else {
        DB.setLocalUser({ name: reg ? $("#aName").value.trim() : DB.nameFromEmail(email), email });
        location.href = safeNext(nextUrl) || "index.html";
      }
    } catch (err) { msg(err.message); btn.disabled = false; }
  });
}
READY.then(render);
