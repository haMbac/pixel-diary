// Porovnavanie farieb tak, ako ich vnima clovek (nie len cisla #rrggbb).
//
// Dva hexy moze delit maly cislicny rozdiel a pritom vyzerat rovnako,
// alebo naopak - preto prevadzame do "Lab" farebneho priestoru, ktory je
// navrhnuty tak, aby cislena vzdialenost zodpovedala vnimanej odlisnosti.

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

function rgbToXyz([r, g, b]: [number, number, number]): [number, number, number] {
  const toLinear = (c: number) => {
    const v = c / 255;
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
  };
  const [rl, gl, bl] = [toLinear(r) * 100, toLinear(g) * 100, toLinear(b) * 100];
  return [
    rl * 0.4124 + gl * 0.3576 + bl * 0.1805,
    rl * 0.2126 + gl * 0.7152 + bl * 0.0722,
    rl * 0.0193 + gl * 0.1192 + bl * 0.9505,
  ];
}

function xyzToLab([x, y, z]: [number, number, number]): [number, number, number] {
  // D65 referencny biely bod
  const f = (v: number) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  const [fx, fy, fz] = [f(x / 95.047), f(y / 100), f(z / 108.883)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function hexToLab(hex: string): [number, number, number] {
  return xyzToLab(rgbToXyz(hexToRgb(hex)));
}

// Vzdialenost dvoch farieb v Lab priestore (tzv. Delta E, zjednodusena verzia).
// Orientacne: <2 clovek nerozozna, 2-10 rozozna len pri poriadnom hladani,
// >20 su farby jasne odlisne na prvy pohlad.
export function colorDistance(hexA: string, hexB: string): number {
  const [l1, a1, b1] = hexToLab(hexA);
  const [l2, a2, b2] = hexToLab(hexB);
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}

// Prah pod ktory dve farby povazujeme za "prilis podobne" v legende.
export const MIN_COLOR_DISTANCE = 20;

// Najviac hodnot (farieb) na jeden sheet. Aj idealne vybrane farby su v
// malych bunkach na prvy pohlad jasne odlisne (Delta E 40-50) len do ~15-23
// kusov, rucne vybrane skor menej - 12 nechava rezervu.
export const MAX_VALUES_PER_SHEET = 12;

// Ci na tejto farbe bude lepsie citatelne svetle (biele) pismo nez tmave -
// napr. cislo dna vnutri vyfarbenej bunky v kalendari. L* (svetlost v Lab)
// pod ~55 citame ako tmavu farbu.
export function isDarkColor(hex: string): boolean {
  return hexToLab(hex)[0] < 55;
}
