// ============================================================
//  5 ALGORITMA PENGURUTAN (dipakai di halaman katalog)
//  Setiap fungsi menerima array + fungsi pembanding cmp(a,b)
//  cmp > 0 artinya a harus berada setelah b.
// ============================================================
const SORTERS = {
  bubble(arr, cmp) {
    for (let i = 0; i < arr.length - 1; i++)
      for (let j = 0; j < arr.length - i - 1; j++)
        if (cmp(arr[j], arr[j + 1]) > 0) [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
    return arr;
  },
  exchange(arr, cmp) {
    for (let i = 0; i < arr.length - 1; i++)
      for (let j = i + 1; j < arr.length; j++)
        if (cmp(arr[i], arr[j]) > 0) [arr[i], arr[j]] = [arr[j], arr[i]];
    return arr;
  },
  selection(arr, cmp) {
    for (let i = 0; i < arr.length - 1; i++) {
      let m = i;                                    
      for (let j = i + 1; j < arr.length; j++) if (cmp(arr[j], arr[m]) < 0) m = j;
      if (m !== i) [arr[i], arr[m]] = [arr[m], arr[i]];
    }
    return arr;
  },
  insertion(arr, cmp) {
    for (let i = 1; i < arr.length; i++) {
      const x = arr[i];
      let j = i - 1;
      while (j >= 0 && cmp(arr[j], x) > 0) { arr[j + 1] = arr[j]; j--; }
      arr[j + 1] = x;
    }
    return arr;
  },
  shell(arr, cmp) {
    for (let gap = Math.floor(arr.length / 2); gap > 0; gap = Math.floor(gap / 2))
      for (let i = gap; i < arr.length; i++) {
        const x = arr[i];
        let j = i;
        while (j >= gap && cmp(arr[j - gap], x) > 0) { arr[j] = arr[j - gap]; j -= gap; }
        arr[j] = x;
      }
    return arr;
  }
};

const SORT_LABEL = { bubble: "Bubble Sort", exchange: "Exchange Sort", selection: "Selection Sort", insertion: "Insertion Sort", shell: "Shell Sort" };

// ------------------------------------------------------------
//  Kriteria pengurutan. Seri dipecah dengan id agar hasil selalu deterministik.
// ------------------------------------------------------------
const idCmp = (a, b) => String(a.id).localeCompare(String(b.id), "id", { numeric: true });
const nameCmp = (a, b) => a.name.localeCompare(b.name, "id", { sensitivity: "base" });
const COMPARATORS = {
  priceAsc:   (a, b) => a.price - b.price || idCmp(a, b),
  priceDesc:  (a, b) => b.price - a.price || idCmp(a, b),
  nameAsc:    (a, b) => nameCmp(a, b) || idCmp(a, b),
  nameDesc:   (a, b) => nameCmp(b, a) || idCmp(a, b),
  newest:     (a, b) => b.created - a.created || idCmp(a, b),
  oldest:     (a, b) => a.created - b.created || idCmp(a, b),
  bestseller: (a, b) => b.sales - a.sales || idCmp(a, b),
  featured:   (a, b) => idCmp(a, b)
};
const SORT_CRITERIA = [
  ["priceAsc", "Harga termurah ke termahal"], ["priceDesc", "Harga termahal ke termurah"],
  ["nameAsc", "Nama produk A–Z"], ["nameDesc", "Nama produk Z–A"],
  ["newest", "Produk terbaru"], ["oldest", "Produk terlama"]
];
const sortOptionsHTML = (extra = [], selected = "") =>
  [...extra, ...SORT_CRITERIA].map(([v, l]) => `<option value="${v}" ${v === selected ? "selected" : ""}>${l}</option>`).join("");
const algoOptionsHTML = () => Object.entries(SORT_LABEL).map(([v, l]) => `<option value="${v}">${l}</option>`).join("");

// Menjalankan algoritma terpilih pada SALINAN daftar (data asli tidak diubah, tidak ada duplikat).
function runSort(algo, list, criteria) {
  let comparisons = 0;
  const base = COMPARATORS[criteria] || COMPARATORS.featured;
  const cmp = (a, b) => { comparisons++; return base(a, b); };
  const t0 = performance.now();
  const sorted = (SORTERS[algo] || SORTERS.bubble)([...list], cmp);
  return { sorted, count: sorted.length, comparisons, ms: performance.now() - t0, algo, label: SORT_LABEL[algo] || SORT_LABEL.bubble, backend: "local" };
}
const sortInfoHTML = r => `Metode: <strong>${r.label}</strong> · <strong>${r.count}</strong> produk berhasil diurutkan · ${r.comparisons} perbandingan · ${r.ms.toFixed(2)} ms · ${r.backend === "cloud" ? "Firebase Cloud Functions" : "Browser (mode lokal)"}`;
