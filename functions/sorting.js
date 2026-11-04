const SORT_LABELS = {
  bubble: "Bubble Sort",
  exchange: "Exchange Sort",
  selection: "Selection Sort",
  insertion: "Insertion Sort",
  shell: "Shell Sort"
};

const SORT_CRITERIA = new Set([
  "featured", "bestseller", "priceAsc", "priceDesc",
  "nameAsc", "nameDesc", "newest", "oldest"
]);
const idCollator = new Intl.Collator("id", { numeric: true });
const nameCollator = new Intl.Collator("id", { sensitivity: "base" });

const compareId = (a, b) => idCollator.compare(String(a.id), String(b.id));
const compareName = (a, b) => nameCollator.compare(a.name, b.name);

const COMPARATORS = {
  featured: compareId,
  bestseller: (a, b) => b.sales - a.sales || compareId(a, b),
  priceAsc: (a, b) => a.price - b.price || compareId(a, b),
  priceDesc: (a, b) => b.price - a.price || compareId(a, b),
  nameAsc: (a, b) => compareName(a, b) || compareId(a, b),
  nameDesc: (a, b) => compareName(b, a) || compareId(a, b),
  newest: (a, b) => b.created - a.created || compareId(a, b),
  oldest: (a, b) => a.created - b.created || compareId(a, b)
};

const SORTERS = {
  bubble(items, compare) {
    for (let i = 0; i < items.length - 1; i++) {
      for (let j = 0; j < items.length - i - 1; j++) {
        if (compare(items[j], items[j + 1]) > 0) [items[j], items[j + 1]] = [items[j + 1], items[j]];
      }
    }
    return items;
  },
  exchange(items, compare) {
    for (let i = 0; i < items.length - 1; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (compare(items[i], items[j]) > 0) [items[i], items[j]] = [items[j], items[i]];
      }
    }
    return items;
  },
  selection(items, compare) {
    for (let i = 0; i < items.length - 1; i++) {
      let min = i;
      for (let j = i + 1; j < items.length; j++) {
        if (compare(items[j], items[min]) < 0) min = j;
      }
      if (min !== i) [items[i], items[min]] = [items[min], items[i]];
    }
    return items;
  },
  insertion(items, compare) {
    for (let i = 1; i < items.length; i++) {
      const current = items[i];
      let j = i - 1;
      while (j >= 0 && compare(items[j], current) > 0) {
        items[j + 1] = items[j];
        j--;
      }
      items[j + 1] = current;
    }
    return items;
  },
  shell(items, compare) {
    for (let gap = Math.floor(items.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
      for (let i = gap; i < items.length; i++) {
        const current = items[i];
        let j = i;
        while (j >= gap && compare(items[j - gap], current) > 0) {
          items[j] = items[j - gap];
          j -= gap;
        }
        items[j] = current;
      }
    }
    return items;
  }
};

function sortProducts({ algorithm, criteria, items }) {
  if (!Object.hasOwn(SORTERS, algorithm)) throw new Error("Metode sorting tidak valid.");
  if (!SORT_CRITERIA.has(criteria)) throw new Error("Kriteria sorting tidak valid.");
  if (!Array.isArray(items) || items.length > 1000) throw new Error("Jumlah produk tidak valid (maksimal 1.000).");

  const indices = new Set();
  const products = items.map(item => {
    if (!item || !Number.isInteger(item.index) || item.index < 0 || item.index >= items.length || indices.has(item.index) ||
        typeof item.id !== "string" || item.id.length > 128 ||
        typeof item.name !== "string" || item.name.length > 500 ||
        !Number.isFinite(item.price) || !Number.isFinite(item.created) || !Number.isFinite(item.sales)) {
      throw new Error("Data produk untuk sorting tidak valid.");
    }
    indices.add(item.index);
    return item;
  });

  let comparisons = 0;
  const baseCompare = COMPARATORS[criteria];
  const compare = (a, b) => {
    comparisons++;
    return baseCompare(a, b);
  };
  const startedAt = performance.now();
  const sorted = SORTERS[algorithm]([...products], compare);

  return {
    indices: sorted.map(item => item.index),
    count: sorted.length,
    comparisons,
    ms: performance.now() - startedAt,
    algo: algorithm,
    label: SORT_LABELS[algorithm]
  };
}

module.exports = { sortProducts };
