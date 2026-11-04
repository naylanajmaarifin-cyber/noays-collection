// Halaman tas belanja + checkout via WhatsApp
$("#shp").innerHTML = SHAPE.heart;

function renderCartPage() {
  const c = readCart(), el = $("#cartItems");
  const sub = cartSubtotal();
  $("#clearCart").hidden = !c.length;

  if (!c.length) {
    el.innerHTML = `<div class="cart-empty">${bunny("sm")}<h2>Tasmu masih kosong</h2><p>Yuk, cari outfit yang kamu suka!</p><a class="btn blue" href="category.html?type=Semua">Mulai belanja ${ICON.arrow}</a></div>`;
  } else {
    el.innerHTML = c.map((x, i) => {
      const p = findProduct(x.id);
      const col = p.colors.find(k => k.name === x.color) || p.colors[0];
      return `<article class="cart-line">
        <div class="cart-art ${p.imageUrl ? "has-photo" : ""}" style="--tint:${TINTS[p.tint] || TINTS.cream}">${productArt(p, col.hex)}</div>
        <div class="cart-info"><a href="product.html?id=${encodeURIComponent(p.id)}"><b>${esc(p.name)}</b></a>
          <small>Warna: ${esc(x.color)} · Ukuran: ${esc(x.size)}</small><strong>${money(p.price)}</strong>
          <div class="qty-picker sm"><button data-dqty="${i}" data-d="-1" aria-label="Kurangi">−</button><b>${x.qty}</b><button data-dqty="${i}" data-d="1" aria-label="Tambah">+</button></div></div>
        <div style="display:flex;align-items:center"><span class="line-total">${money(p.price * x.qty)}</span><button class="remove" data-dremove="${i}" aria-label="Hapus ${esc(p.name)}">${ICON.close}</button></div>
      </article>`;
    }).join("");
  }
  $("#subtotal").textContent = money(sub);
  $("#total").textContent = money(sub);
  const free = sub >= STORE.freeShippingMin && sub > 0;
  $("#shipCost").textContent = free ? "GRATIS" : "Dihitung saat checkout";
  $("#shipBar").style.width = Math.min(100, sub / STORE.freeShippingMin * 100) + "%";
  $("#shipNote").innerHTML = shippingNote(sub) || `Gratis ongkir untuk belanja mulai ${money(STORE.freeShippingMin)}.`;
}

// Tombol +/−/hapus di daftar tas (drawer memakai delegasi sendiri di common.js)
$("#cartItems").addEventListener("click", e => {
  const q = e.target.closest("[data-dqty]"), r = e.target.closest("[data-dremove]");
  const c = readCart();
  if (q) { const i = +q.dataset.dqty; c[i].qty = Math.min(maxQty(c[i].id), c[i].qty + +q.dataset.d); if (c[i].qty < 1) c.splice(i, 1); saveCart(c); renderCartPage(); }
  if (r) { c.splice(+r.dataset.dremove, 1); saveCart(c); renderCartPage(); }
});
$("#clearCart").addEventListener("click", () => { if (confirm("Kosongkan semua isi tas?")) { saveCart([]); renderCartPage(); } });

// ---- Checkout: formulir -> pesan WhatsApp ----
$("#checkout").addEventListener("click", () => {
  if (!readCart().length) { toast("Tasmu masih kosong", "Yuk, pilih produk dulu!"); return; }
  const user = DB.user || store.get("noaysUser", null);
  openModal(`<h2 style="margin-bottom:4px">Data pengiriman</h2>
    <p class="muted" style="color:var(--muted);margin:0 0 6px">Pesananmu akan dibuka di WhatsApp untuk dikirim ke ${esc(STORE.name)}.</p>
    <form class="form" id="orderForm">
      <div class="form-grid">
        <div><label for="oName">Nama penerima</label><input id="oName" required maxlength="60" value="${user ? esc(user.name) : ""}"></div>
        <div><label for="oPhone">No. WhatsApp kamu</label><input id="oPhone" required inputmode="tel" maxlength="20" placeholder="08xxxxxxxxxx"></div>
      </div>
      <label for="oAddr">Alamat lengkap</label><textarea id="oAddr" required maxlength="300" placeholder="Jalan, kelurahan, kecamatan, kota, kode pos"></textarea>
      <label for="oNote">Catatan (opsional)</label><input id="oNote" maxlength="120" placeholder="mis. warna cadangan jika kosong">
      <button class="btn blue full" type="submit">${ICON.wa} Kirim pesanan via WhatsApp</button>
    </form>`);
  $("#orderForm").addEventListener("submit", e => {
    e.preventDefault();
    const c = readCart();
    const lines = c.map((x, i) => {
      const p = findProduct(x.id);
      return `${i + 1}. ${p.name} (${x.color}, ${x.size}) x${x.qty} = ${money(p.price * x.qty)}`;
    });
    const sub = cartSubtotal();
    const msg = [
      `Halo ${STORE.name}! Saya mau pesan:`, "", ...lines, "",
      `Subtotal: ${money(sub)}`,
      sub >= STORE.freeShippingMin ? "Ongkir: GRATIS" : "Ongkir: mohon dihitungkan",
      "", `Nama: ${$("#oName").value.trim()}`, `WhatsApp: ${$("#oPhone").value.trim()}`,
      `Alamat: ${$("#oAddr").value.trim()}`,
      $("#oNote").value.trim() ? `Catatan: ${$("#oNote").value.trim()}` : ""
    ].filter((l, i, a) => l !== "" || (a[i - 1] !== "")).join("\n");
    window.open(`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    closeModal();
    toast("Pesanan dibuka di WhatsApp 🐰", "Selesaikan dengan menekan kirim di WhatsApp.");
  });
});

READY.then(renderCartPage);
