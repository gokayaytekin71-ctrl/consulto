// Renk paleti — her renk için Tailwind class'ları
export const SECTION_COLORS = {
  emerald: { dot: "bg-emerald-500", light: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-300", stripe: "from-emerald-500 to-teal-400",   label: "Yeşil"     },
  blue:    { dot: "bg-blue-500",    light: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-300",    stripe: "from-blue-500 to-cyan-400",      label: "Mavi"      },
  violet:  { dot: "bg-violet-500",  light: "bg-violet-50",   text: "text-violet-700",  border: "border-violet-300",  stripe: "from-violet-500 to-purple-500",  label: "Mor"       },
  rose:    { dot: "bg-rose-500",    light: "bg-rose-50",     text: "text-rose-700",    border: "border-rose-300",    stripe: "from-rose-500 to-pink-400",      label: "Kırmızı"   },
  amber:   { dot: "bg-amber-500",   light: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-300",   stripe: "from-amber-500 to-yellow-400",   label: "Sarı"      },
  cyan:    { dot: "bg-cyan-500",    light: "bg-cyan-50",     text: "text-cyan-700",    border: "border-cyan-300",    stripe: "from-cyan-500 to-sky-400",       label: "Camgöbeği" },
  orange:  { dot: "bg-orange-500",  light: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-300",  stripe: "from-orange-500 to-amber-400",   label: "Turuncu"   },
  indigo:  { dot: "bg-indigo-500",  light: "bg-indigo-50",   text: "text-indigo-700",  border: "border-indigo-300",  stripe: "from-indigo-500 to-blue-500",    label: "Lacivert"  },
};

export const COLOR_KEYS    = Object.keys(SECTION_COLORS);
export const DEFAULT_COLOR = "emerald";

// Kullanılmayan bir sonraki rengi döndür
export function nextColor(usedColors = []) {
  for (const c of COLOR_KEYS) {
    if (!usedColors.includes(c)) return c;
  }
  return COLOR_KEYS[usedColors.length % COLOR_KEYS.length];
}
