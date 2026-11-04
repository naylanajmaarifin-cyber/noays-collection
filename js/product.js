// Halaman detail produk
READY.then(async () => {
const wantId = new URLSearchParams(location.search).get("id");
const p = findProduct(wantId) || PRODUCTS[0];
if (!p) {
  $("#detail").innerHTML = `<div class="empty" style="grid-column:1/-1">${bunny("sm")}<h3>Produk tidak ditemukan</h3><p>Produk ini mungkin sudah tidak tersedia.</p><a class="btn blue" href="category.html?type=Semua">Lihat semua koleksi</a></div>`;
  $(".related").hidden = true;
  return;
}

document.title = p.name + " — Noay’s Collection";
$("#backCategory").textContent = p.category;
$("#backCategory").href = "category.html?type=" + encodeURIComponent(p.category);
$("#shp").innerHTML = SHAPE.heart;

$("#detail").innerHTML = `
  <div class="detail-visual ${p.imageUrl ? "has-photo" : ""}" id="detailVisual" style="--tint:${TINTS[p.tint] || TINTS.cream}">
    ${productArt(p)}
    <span class="detail-sticker">${bunny()} NOAY’S PICK</span>
  </div>
  <div class="detail-info">
    <p class="eyebrow">${esc(p.category)} · Noay’s Collection</p>
    <h1>${esc(p.name)}</h1>
    <div class="detail-price">${money(p.price)} ${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ""}</div>
    <div class="rating-line"><b id="productRating">Belum ada ulasan</b> · <span class="stock-pill ${p.stock <= 0 ? "out" : (p.stock <= 5 ? "low" : "")}">${stockLabel(p)}</span></div>
    <p class="description">${esc(p.description)}</p>
    <div id="picker">${pickerHTML(p)}</div>
    <a class="btn outline full" href="cart.html">Lihat tas belanja ${ICON.arrow}</a>
    <button class="btn outline full" id="wishBtn" type="button" data-wish="${esc(p.id)}" aria-pressed="${isWished(p.id)}" style="border-radius:99px">♡ Simpan ke favorit</button>
    <div class="benefits">
      <span>${SHAPE.flower}<b>Nyaman</b><small>untuk harian</small></span>
      <span>${SHAPE.sparkle}<b>Warna pilihan</b><small>mudah dipadukan</small></span>
      <span>${SHAPE.heart}<b>Gaya Noay’s</b><small>ceria setiap hari</small></span>
    </div>
    <details open><summary>Deskripsi produk</summary><p>${esc(p.description)}</p></details>
    <details><summary>Pengiriman & pemesanan</summary><p>Pesanan dikirim lewat WhatsApp ke toko untuk konfirmasi stok, ongkir, dan pembayaran. Gratis ongkir untuk belanja mulai ${money(STORE.freeShippingMin)}.</p></details>
  </div>`;

bindPicker($("#picker"), p, st => { const g = $("#detailVisual .garment"); if (!p.imageUrl && g) g.outerHTML = garment(p.art, st.color.hex, p.name); });

const stars = rating => "★".repeat(rating) + "☆".repeat(5 - rating);
async function loadReviews() {
  const summary = $("#reviewSummary"), list = $("#reviewList"), formWrap = $("#reviewFormWrap");
  summary.textContent = "Memuat ulasan…";
  list.innerHTML = "";
  formWrap.innerHTML = "";
  try {
    const reviews = await DB.listReviews(p.id);
    const average = reviews.length ? reviews.reduce((total, review) => total + Number(review.rating), 0) / reviews.length : 0;
    const ratingText = reviews.length ? `★ ${average.toFixed(1)} · ${reviews.length} ulasan` : "Belum ada ulasan";
    summary.textContent = ratingText;
    $("#productRating").textContent = ratingText;
    list.innerHTML = reviews.length ? reviews.map(review => `
      <article class="review-card">
        <div class="review-card-head"><b>Pembeli terverifikasi</b><span class="review-stars" aria-label="${Number(review.rating)} dari 5 bintang">${stars(Number(review.rating))}</span></div>
        <p>${esc(review.comment)}</p>
        <small>${Number(review.updated || review.created) ? new Date(Number(review.updated || review.created)).toLocaleDateString("id-ID") : ""} · Pembelian terverifikasi</small>
      </article>`).join("") : '<p class="muted">Belum ada ulasan untuk produk ini.</p>';

    if (DB.mode !== "firebase") {
      formWrap.innerHTML = '<p class="notice">Ulasan terverifikasi memerlukan Firebase dan akun pembeli.</p>';
      return;
    }
    if (!DB.user) {
      formWrap.innerHTML = '<p>Sudah membeli produk ini? <a class="underlink" href="login.html">Masuk atau buat akun</a> untuk memberi ulasan setelah admin memverifikasi pembelian.</p>';
      return;
    }
    const verified = await DB.hasVerifiedPurchase(p.id);
    if (!verified) {
      formWrap.innerHTML = '<p>Ulasan hanya tersedia untuk pembelian yang sudah dikonfirmasi admin. Gunakan akun dengan email yang dipakai saat pesanan.</p>';
      return;
    }
    const mine = reviews.find(review => review.uid === DB.user.uid);
    formWrap.innerHTML = `
      <form id="reviewForm" class="form">
        <p class="review-writer">Akun pembelian terverifikasi · Satu ulasan per akun</p>
        <label>Penilaian</label>
        <div class="star-rating" id="reviewRating" role="group" aria-label="Pilih penilaian bintang">
          ${[1, 2, 3, 4, 5].map(value => `<button type="button" data-rating="${value}" aria-label="${value} bintang" aria-pressed="${value === (mine ? Number(mine.rating) : 5)}">${value <= (mine ? Number(mine.rating) : 5) ? "★" : "☆"}</button>`).join("")}
        </div>
        <label for="reviewComment">Komentar</label>
        <textarea id="reviewComment" maxlength="1000" required placeholder="Ceritakan pengalamanmu memakai produk ini…">${mine ? esc(mine.comment) : ""}</textarea>
        <button class="btn blue" type="submit">${mine ? "Perbarui ulasan" : "Kirim ulasan"}</button>
        <p id="reviewError" class="field-error" role="alert"></p>
      </form>`;
    $("#reviewRating").addEventListener("click", event => {
      const selected = event.target.closest("[data-rating]");
      if (!selected) return;
      const rating = Number(selected.dataset.rating);
      $$("#reviewRating [data-rating]").forEach(button => {
        const value = Number(button.dataset.rating);
        button.setAttribute("aria-pressed", String(value === rating));
        button.textContent = value <= rating ? "★" : "☆";
      });
      $("#reviewForm").dataset.rating = String(rating);
    });
    $("#reviewForm").dataset.rating = String(mine ? Number(mine.rating) : 5);
    $("#reviewForm").addEventListener("submit", async event => {
      event.preventDefault();
      const error = $("#reviewError"), button = $("#reviewForm button[type=submit]");
      error.textContent = "";
      const comment = $("#reviewComment").value.trim(), rating = Number($("#reviewForm").dataset.rating);
      if (!comment) { error.textContent = "Tulis komentar terlebih dahulu."; return; }
      button.disabled = true;
      try {
        await DB.saveReview(p.id, { rating, comment });
        toast("Ulasan tersimpan", "Terima kasih sudah berbagi pengalaman.");
        await loadReviews();
      } catch (err) {
        error.textContent = err.message;
        toast("Gagal menyimpan ulasan", err.message);
        button.disabled = false;
      }
    });
  } catch (error) {
    summary.textContent = "Ulasan tidak dapat dimuat.";
    formWrap.innerHTML = `<p class="field-error" role="alert">${esc(error.message)}</p>`;
  }
}
await loadReviews();

// tombol favorit di halaman ini memakai teks sendiri
const wishBtn = $("#wishBtn");
const syncWish = () => { wishBtn.textContent = isWished(p.id) ? "♥ Tersimpan di favorit" : "♡ Simpan ke favorit"; };
syncWish();
window.onWishChange = syncWish;

const related = PRODUCTS.filter(x => x.category === p.category && x.id !== p.id);
const more = related.concat(PRODUCTS.filter(x => x.category !== p.category && x.id !== p.id)).slice(0, 4);
$("#relatedGrid").innerHTML = more.map(productCard).join("");
});
