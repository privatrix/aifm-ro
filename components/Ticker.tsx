const ITEMS = [
  "🎵 Noaptea în Chișinău · 247",
  "🎵 Trolei la 4 dimineața · 198",
  "🎵 Răsărit peste Dunăre · 312",
  "🎵 Vise pe FM · 156",
  "🎵 Vio citește o scrisoare · 489",
  "🎵 Lo-fi pentru un weekend ploios · 274",
];

export default function Ticker() {
  const stream = [...ITEMS, ...ITEMS];
  return (
    <div className="overflow-hidden border-y border-white/5 bg-black/20">
      <div className="flex animate-ticker whitespace-nowrap py-3">
        {stream.map((s, i) => (
          <span key={i} className="px-6 text-sm text-bone/70 font-mono">{s}</span>
        ))}
      </div>
    </div>
  );
}
