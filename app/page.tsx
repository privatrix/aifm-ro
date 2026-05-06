import Player from "@/components/Player";
import HostCard from "@/components/HostCard";
import Ticker from "@/components/Ticker";
import Schedule from "@/components/Schedule";
import Recent from "@/components/Recent";
import TalkToVio from "@/components/TalkToVio";

export default function Home() {
  return (
    <main className="relative z-10">
      {/* Top bar */}
      <header className="px-5 pt-6 pb-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ember to-glow text-ink font-display flex items-center justify-center text-lg shadow-soft">FM</div>
          <div className="leading-tight">
            <div className="font-display text-lg">AI FM</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-bone/50">aifm.ro</div>
          </div>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-bone/70">
          <a href="#program" className="hover:text-bone">Program</a>
          <a href="#recent" className="hover:text-bone">Piese</a>
          <a href="#vio" className="hover:text-bone">Vio</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="px-5 pt-6 pb-10 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-glow/80 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-breathe" />
          Live · 24/7
        </div>
        <h1 className="font-display text-4xl sm:text-6xl leading-[1.05] mb-4">
          Radio condus de un <span className="text-ember">AI</span> care nu doarme.
        </h1>
        <p className="text-bone/70 text-lg max-w-xl mx-auto">
          Muzică generată continuu. O gazdă care te ascultă. Un singur loc, deschis non-stop.
        </p>
      </section>

      {/* Player */}
      <section className="px-5 pb-10">
        <Player />
      </section>

      {/* Ticker */}
      <Ticker />

      {/* Vio */}
      <section id="vio" className="px-5 pt-14 pb-6">
        <div className="max-w-3xl mx-auto text-center mb-6">
          <div className="text-xs uppercase tracking-[0.25em] text-glow/80 mb-3">Cunoaște-l pe</div>
          <h2 className="font-display text-3xl sm:text-4xl">Vio. Gazda care nu doarme.</h2>
          <p className="text-bone/65 mt-3 max-w-lg mx-auto">
            Voce caldă. Glume seci. Citește scrisorile ascultătorilor la 3 dimineața. Are păreri despre oglinzi.
          </p>
        </div>
        <HostCard />
      </section>

      {/* Schedule */}
      <div id="program"><Schedule /></div>

      {/* Recent */}
      <div id="recent"><Recent /></div>

      {/* Talk to Vio */}
      <TalkToVio />

      {/* Footer */}
      <footer className="px-5 pb-10 pt-6 text-center text-bone/40 text-xs">
        <div className="font-mono">aifm.ro · made with insomnia</div>
        <div className="mt-1">© {new Date().getFullYear()} AI FM</div>
      </footer>
    </main>
  );
}
