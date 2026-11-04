// Halaman katalog / kategori: filter, pencarian, 5 algoritma sorting, promo, favorit
const params = new URLSearchParams(location.search);
const type = params.get("type") || "Semua";
const query = (params.get("q") || "").trim();
let sortRequest = 0;

const TYPE_INFO = {
  Semua:    ["Semua Koleksi", "Temukan semua outfit nyaman dan mudah dipadukan.", "sparkle"],
  Wanita:   ["Baju Wanita", "Blouse, dress, celana, dan rok untuk setiap suasana hati.", "flower"],
  Pria:     ["Baju Pria", "Kemeja, kaos, dan jaket kasual yang rapi tanpa kaku.", "sparkle"],
  Hijab:    ["Hijab & Kerudung", "Pashmina, voal, dan inner yang adem dan mudah dibentuk.", "asterisk"],
  Aksesori: ["Aksesori", "Pelengkap gaya untuk hari-harimu.", "heart"],
  Promo:    ["Promo Ceria", "Harga spesial untuk menambah ceria harimu.", "star"],
  Baru:     ["Baru Datang", "Koleksi terbaru minggu ini, baru banget masuk.", "sparkle"],
  Favorit:  ["Favoritku", "Produk yang kamu simpan dengan tanda hati.", "heart"]
};
const info = TYPE_INFO[type] || ["Koleksi Noay’s", "Gaya nyaman untuk setiap hari.", "sparkle"];

$("#categoryTitle").textContent = info[0];
$("#crumbType").textContent = info[0];
$("#categoryDesc").textContent = info[1];
$("#bannerDeco").innerHTML = SHAPE[info[2]];
$("#bannerBunny").innerHTML = bunny();
$("#emptyBunny").innerHTML = bunny();
document.title = info[0] + " — Noay’s Collection";
if (type === "Promo") { $("#promoTimer").hidden = false; mountCountdown($("#countdown")); }

const colorFilter = $("#colorFilter"), sizeFilter = $("#sizeFilter"), priceFilter = $("#priceFilter"),
      sortBy = $("#sortBy"), algo = $("#sortAlgorithm");
algo.innerHTML = algoOptionsHTML();
sortBy.innerHTML = sortOptionsHTML([["featured", "Pilihan Noay’s"], ["bestseller", "Terlaris"]], type === "Baru" ? "newest" : "featured");

function baseList() {
  if (type === "Promo") return PRODUCTS.filter(p => p.oldPrice);
  if (type === "Baru") return [...PRODUCTS].sort((a, b) => b.created - a.created).slice(0, 8);
  if (type === "Favorit") { const w = readWish(); return PRODUCTS.filter(p => w.includes(p.id)); }
  if (type === "Semua" || !TYPE_INFO[type]) return PRODUCTS;
  return PRODUCTS.filter(p => p.category === type);
}

async function render() {
  const requestId = ++sortRequest;
  const [minP, maxP] = priceFilter.value ? priceFilter.value.split("-").map(Number) : [0, Infinity];
  const q = query.toLowerCase();
  let list = baseList().filter(p =>
    (!q || (p.name + " " + p.category + " " + p.description).toLowerCase().includes(q)) &&
    (!colorFilter.value || p.colors.some(c => c.name === colorFilter.value)) &&
    (!sizeFilter.value || p.sizes.includes(sizeFilter.value)) &&
    p.price >= minP && p.price <= maxP);

  let res;
  try {
    res = await DB.sortProducts(algo.value, list, sortBy.value);
  } catch (error) {
    if (requestId !== sortRequest) return;
    $("#algoStats").textContent = `Gagal mengurutkan produk: ${error.message}`;
    $("#productGrid").innerHTML = "";
    $("#resultCount").textContent = "";
    $("#empty").hidden = true;
    return;
  }
  if (requestId !== sortRequest) return;
  list = res.sorted;

  $("#productGrid").innerHTML = list.map(productCard).join("");
  $("#algoStats").innerHTML = sortInfoHTML(res);
  $("#resultCount").innerHTML = `Menampilkan <b>${list.length}</b> produk` +
    (query ? `<span class="active-q">“${esc(query)}” <a href="category.html?type=${encodeURIComponent(type)}" aria-label="Hapus pencarian">${ICON.close}</a></span>` : "");

  const none = !list.length;
  $("#empty").hidden = !none;
  if (none && type === "Favorit" && !readWish().length) {
    $("#emptyTitle").textContent = "Belum ada favorit";
    $("#emptyMsg").textContent = "Tekan ikon hati di produk yang kamu suka untuk menyimpannya di sini.";
  } else {
    $("#emptyTitle").textContent = "Produk tidak ditemukan";
    $("#emptyMsg").textContent = "Coba ubah filter atau kata kunci kamu, ya!";
  }
}
[colorFilter, sizeFilter, priceFilter, sortBy, algo].forEach(el => el.addEventListener("change", render));
// Di halaman Favorit, hapus hati langsung memperbarui daftar
window.onWishChange = () => { if (type === "Favorit") render(); };
READY.then(render);
