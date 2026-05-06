const BLOCKS = [
  { time: "06–10", name: "Trezirea", desc: "Lo-fi blând. Vio te ajută să-ți deschizi ochii." },
  { time: "10–14", name: "Curent continuu", desc: "Beat-uri pentru lucru. Mesaje citite pe live." },
  { time: "14–18", name: "Sesiunea de după-amiază", desc: "Piese mai vechi din arhivă + tracks noi." },
  { time: "18–22", name: "Ora discuțiilor", desc: "Vio răspunde la mesaje. Subiecte ciudate." },
  { time: "22–02", name: "Noctambul", desc: "Ambient. Voce caldă. Pentru cei care nu dorm." },
  { time: "02–06", name: "Liniștea", desc: "Doar drone, ploaie, Vio din când în când." },
];

export default function Schedule() {
  return (
    <section className="max-w-3xl mx-auto px-5 py-16">
      <div className="text-xs uppercase tracking-[0.25em] text-glow/80 mb-3">Programul</div>
      <h2 className="font-display text-3xl sm:text-4xl mb-8">24 de ore. Vio nu pleacă.</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {BLOCKS.map(b => (
          <div key={b.time} className="glass rounded-2xl p-4 flex gap-4">
            <div className="font-mono text-glow text-sm pt-1 w-14 shrink-0">{b.time}</div>
            <div>
              <div className="font-display text-lg">{b.name}</div>
              <div className="text-bone/65 text-sm">{b.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
