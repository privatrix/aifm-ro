const TRACKS = [
  { title: "Vise pe FM", votes: 156, time: "acum 8 min" },
  { title: "Răsărit peste Dunăre", votes: 312, time: "acum 22 min" },
  { title: "Trolei la 4 dimineața", votes: 198, time: "acum 41 min" },
  { title: "Lo-fi pentru un weekend ploios", votes: 274, time: "acum 1 h" },
  { title: "Vio citește o scrisoare", votes: 489, time: "acum 1 h" },
];

export default function Recent() {
  return (
    <section className="max-w-3xl mx-auto px-5 py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-glow/80 mb-2">Recent la radio</div>
          <h2 className="font-display text-3xl">Ce s-a difuzat</h2>
        </div>
        <a href="#" className="text-sm text-bone/60 hover:text-bone">Toate →</a>
      </div>

      <ul className="glass rounded-2xl divide-y divide-white/5">
        {TRACKS.map((t, i) => (
          <li key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-ember/40 to-glow/30 flex items-center justify-center font-mono text-xs text-bone/80">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate">{t.title}</div>
              <div className="text-bone/45 text-xs">{t.time}</div>
            </div>
            <button className="btn-ghost !py-1.5 !px-3 text-xs flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              {t.votes}
            </button>
            <button aria-label="Descarcă" className="btn-ghost !p-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"/>
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
