type Tints = { morning: string; midday: string; dusk: string; night: string };

const ANCHORS: Array<{ hour: number; key: keyof Tints }> = [
  { hour: 0, key: "night" },
  { hour: 6, key: "morning" },
  { hour: 12, key: "midday" },
  { hour: 18, key: "dusk" },
  { hour: 24, key: "night" },
];

export function tintForHour(hour: number, tints: Tints): string {
  const h = ((hour % 24) + 24) % 24;
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const a = ANCHORS[i];
    const b = ANCHORS[i + 1];
    if (h >= a.hour && h <= b.hour) {
      const t = (h - a.hour) / (b.hour - a.hour);
      return mixHex(tints[a.key], tints[b.key], t);
    }
  }
  return tints.night;
}

export function tintNow(tints: Tints, now: Date = new Date()): string {
  return tintForHour(now.getHours() + now.getMinutes() / 60, tints);
}

function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return "#" + [r, g, bl].map((n) => n.toString(16).padStart(2, "0")).join("");
}

function parseHex(h: string): [number, number, number] {
  const s = h.startsWith("#") ? h.slice(1) : h;
  const full =
    s.length === 3
      ? s
          .split("")
          .map((c) => c + c)
          .join("")
      : s;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}
