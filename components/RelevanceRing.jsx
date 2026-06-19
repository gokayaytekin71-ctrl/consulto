/**
 * RelevanceRing
 * - score: sayı (tercihen 0..1 normalize edilmiş)
 * - min / max: opsiyonel; normalize aralığı. Verilmezse otomatik tespit:
 *    - 0..1 ise bu aralık kullanılır
 *    - değilse eski aralık (0.04..0.80) kabul edilir
 * - label: opsiyonel; sağdaki metin
 */
function normalizeToPercent(score, min, max) {
  if (typeof score !== "number" || Number.isNaN(score)) return null;

  // Otomatik aralık tespiti
  let _min = min, _max = max;
  if (_min == null || _max == null) {
    if (score >= 0 && score <= 1) {
      _min = 0; _max = 1;               // yeni _ui skoru
    } else {
      _min = 0.04; _max = 0.80;         // eski heuristik
    }
  }

  const span = Math.max(1e-9, _max - _min);
  const pct = Math.round(
    Math.max(0, Math.min(1, (score - _min) / span)) * 100
  );
  return pct;
}

function colorForPercent(p) {
  if (p > 80) return "stroke-emerald-400";
  if (p > 60) return "stroke-sky-400";
  if (p > 35) return "stroke-yellow-400";
  return "stroke-slate-500";
}

export default function RelevanceRing({ score, min, max, label = "Kullanıcı Sorgusu- Sonuç Uyumu" }) {
  const percentage = normalizeToPercent(score, min, max);
  if (percentage == null) return null;

  const colorClass = colorForPercent(percentage);

  // SVG ölçüleri
  const size = 56;
  const strokeWidth = 5;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percentage / 100);

  return (
    <div
      className="relative flex items-center gap-3"
      style={{ width: "auto", height: 56 }}
      aria-label={`Uyum: ${percentage}%`}
      title={`Uyum: ${percentage}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Arka plan halkası */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-slate-700/50"
          fill="transparent"
        />
        {/* Uyum halkası */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          className={colorClass}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
        {/* Yüzde metni */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          className="text-sm font-bold fill-slate-200"
        >
          {`${percentage}%`}
        </text>
      </svg>

      <span className="text-slate-400 text-xs max-w-[140px] leading-snug">
        {label}
      </span>
    </div>
  );
}