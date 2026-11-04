// ============================================================
//  ILUSTRASI PRODUK (SVG) + MASKOT KELINCI + WORDMARK
//  Semua gambar dibuat dengan kode, jadi tidak butuh file gambar.
// ============================================================
const BLUE = "#235789";

function luminance(hex) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// bentuk dasar tiap jenis pakaian: [badan, garis-detail]
const SHAPES = {
  pashmina: ['M60 10C32 10 20 38 22 66c1 20-5 34-9 44h94c-4-10-10-24-9-44C100 38 88 10 60 10Z',
             'M42 40a18 22 0 1 0 36 0a18 22 0 1 0-36 0ZM36 92c14 6 34 6 48 0'],
  voal:     ['M60 10C34 10 24 36 26 62c1 22-8 36-12 48h92c-4-12-13-26-12-48C96 36 86 10 60 10Z',
             'M42 40a18 22 0 1 0 36 0a18 22 0 1 0-36 0ZM28 84c10 8 54 8 64 0'],
  inner:    ['M22 70C22 36 40 20 60 20s38 16 38 50v26c-12 10-64 10-76 0Z',
             'M30 90c14 8 46 8 60 0'],
  blouse:   ['M42 12 20 26 8 54l18 8 8-12v54h52V50l8 12 18-8-12-28L78 12c-4 14-14 20-18 20S46 26 42 12Z',
             'M42 12c4 10 12 14 18 14s14-4 18-14M34 50v12M86 50v12'],
  kemeja:   ['M40 12 18 26 6 56l18 8 8-12v52h56V52l8 12 18-8-12-30L80 12 60 28Z',
             'M60 28v82M40 12l20 24 20-24M60 48h.1M60 66h.1M60 84h.1'],
  kaos:     ['M42 12 18 26 8 52l18 8 8-10v54h52V50l8 10 18-8-10-26L78 12c-4 12-10 16-18 16s-14-4-18-16Z',
             'M42 12c3 10 10 14 18 14s15-4 18-14'],
  dress:    ['M44 10 40 40 24 110h72L80 40 76 10c-4 10-10 14-16 14s-12-4-16-14Z',
             'M40 40h40M44 10c3 8 9 12 16 12s13-4 16-12'],
  rok:      ['M38 18h44l22 90H16Z',
             'M38 30h44M50 30l-8 78M70 30l8 78'],
  celana:   ['M34 10h52l6 100H66L60 46l-6 64H28Z',
             'M34 24h52M60 24v22'],
  jaket:    ['M42 10 18 24 10 92l18 4 6-40v54h52V56l6 40 18-4-8-68L78 10 60 28Z',
             'M60 28v82M42 10l18 22 18-22M34 70h12M74 70h12'],
  tote:     ['M24 44h72l6 66H18Z',
             'M42 44C42 12 78 12 78 44'],
  topi:     ['M16 72C16 38 38 22 60 22c26 0 42 20 42 50Z M60 72h50c0 10-12 16-26 16H60Z',
             'M60 22v50M38 30c-6 10-8 24-8 42M82 30c6 10 8 24 8 42']
};
const ART_TYPES = Object.keys(SHAPES);

function garment(type, color, label) {
  const s = SHAPES[type] || SHAPES.kaos;
  const detail = luminance(color) < 0.4 ? "rgba(255,255,255,.7)" : BLUE;
  return `<svg class="garment" viewBox="0 0 120 120" role="img" aria-label="${label ? label.replace(/"/g, "") : type}">
    <ellipse cx="60" cy="114" rx="38" ry="4" fill="rgba(35,87,137,.14)"/>
    <path d="${s[0]}" fill="${color}" stroke="${BLUE}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="${s[1]}" fill="none" stroke="${detail}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

// ---------- Maskot kelinci (U + telinga, mata bintang, kedip, mulut w) ----------
const BUNNY_PATHS = `
  <path class="bn-body" d="M14 30a14 14 0 0 1 28 0V52H58V30a14 14 0 0 1 28 0V80a28 28 0 0 1-28 28H42A28 28 0 0 1 14 80Z"/>
  <path class="bn-star" d="M33 62c1.3 5.2 3.3 7.4 8.2 8.5-4.9 1.1-6.9 3.3-8.2 8.5-1.3-5.2-3.3-7.4-8.2-8.5 4.9-1.1 6.9-3.3 8.2-8.5Z"/>
  <path class="bn-line" d="M69 66l-8 5.5 8 5.5"/>
  <path class="bn-line" d="M42 88q4 6.5 8 0q4 6.5 8 0"/>`;

function bunny(cls = "") {
  return `<svg class="bunny ${cls}" viewBox="0 0 100 112" aria-hidden="true" focusable="false">${BUNNY_PATHS}</svg>`;
}

// ---------- Wordmark: noay’s dengan "o" berupa kelinci ----------
function wordmark(cls = "") {
  return `<span class="wordmark ${cls}" role="img" aria-label="noay’s">n<svg class="wm-o" viewBox="0 0 120 120" aria-hidden="true"><circle class="wm-circle" cx="60" cy="60" r="60"/><g transform="translate(24.5 14.5) scale(.7)">${BUNNY_PATHS}</g></svg>ay’s</span>`;
}

// ---------- Bentuk dekorasi dari brand board ----------
const SHAPE = {
  sparkle: '<svg class="shape" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2C21.5 12 28 18.5 38 20 28 21.5 21.5 28 20 38 18.5 28 12 21.5 2 20 12 18.5 18.5 12 20 2Z"/></svg>',
  asterisk: '<svg class="shape" viewBox="0 0 40 40" aria-hidden="true"><g stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M20 4v32M6 12l28 16M6 28l28-16"/></g></svg>',
  heart: '<svg class="shape" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 36C6 26 2 19 2 13 2 7.500 6.500 4 11 4c4 0 7 2 9 6 2-4 5-6 9-6 4.500 0 9 3.500 9 9 0 6-4 13-18 23Z"/></svg>',
  flower: '<svg class="shape" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3c4 0 6 3 6 6 3-1.500 8 0 9 5 .8 3-1 6-3 7 3 2 3 7 0 10-3 2.500-6 1.500-8 0-1 4-5 7-9 7s-8-3-9-7c-2 1.500-5 2.500-8 0-3-3-3-8 0-10-2-1-4-4-3-7 1-5 6-6.500 9-5 0-3 2-6 6-6Z" transform="translate(2 1) scale(.9)"/></svg>',
  star: '<svg class="shape" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3l4.500 9.500L35 14l-7.500 7.500L29 32l-9-5-9 5 1.500-10.500L5 14l10.500-1.500Z" stroke-linejoin="round" stroke="currentColor" stroke-width="4"/></svg>'
};
