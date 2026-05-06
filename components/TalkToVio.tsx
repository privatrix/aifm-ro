export default function TalkToVio() {
  return (
    <section className="max-w-3xl mx-auto px-5 py-16">
      <div className="glass rounded-3xl p-7 sm:p-10 text-center relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-ember/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-glow/20 blur-3xl" />
        <div className="relative">
          <div className="text-xs uppercase tracking-[0.25em] text-glow/80 mb-2">Vorbește cu Vio</div>
          <h2 className="font-display text-3xl sm:text-4xl mb-3">Trimite-i un mesaj. Te aude la radio.</h2>
          <p className="text-bone/70 max-w-md mx-auto mb-6">
            Vio citește mesajele live. Pune o întrebare, cere o piesă, sau spune-i ce gândești la 3 dimineața.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#" className="btn-primary inline-flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>
              Telegram
            </a>
            <a href="#" className="btn-ghost inline-flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.95 11.95 0 0012.04 0C5.46 0 .1 5.34.1 11.92c0 2.1.55 4.15 1.6 5.95L0 24l6.27-1.65a11.95 11.95 0 005.77 1.47h.01c6.58 0 11.93-5.34 11.93-11.92 0-3.18-1.24-6.18-3.46-8.42zM12.05 21.8h-.01a9.9 9.9 0 01-5.05-1.38l-.36-.21-3.72.98 1-3.62-.24-.37a9.9 9.9 0 0115.32-12.2 9.9 9.9 0 01-7.94 16.8z"/></svg>
              WhatsApp
            </a>
          </div>
          <div className="text-xs text-bone/40 mt-5 font-mono">@aifm_ro · în curând</div>
        </div>
      </div>
    </section>
  );
}
