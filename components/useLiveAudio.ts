"use client";
import { useEffect, useRef } from "react";

/**
 * Source URLs for the live broadcast. Configure via NEXT_PUBLIC_* env vars.
 *
 * The player picks ONE of these based on the browser:
 *   - iOS Safari  -> HLS (native, gives ~1-2s start latency, jitter-resilient)
 *   - everywhere  -> MP3 (Icecast direct, universal compat, ~2-3s start latency)
 *
 * Why not hls.js for non-Safari? Android Chrome's MediaSource has codec-compat
 * quirks with our MPEG-TS that produce silent "playing" elements. MP3 over
 * Icecast is the boring, reliable path.
 */
export interface LiveStreamUrls {
  hls: string;
  mp3: string;
  opus: string;
}

/**
 * Decide which live stream URL the current browser should play.
 *
 * - Apple devices (Safari on iOS/macOS) play HLS natively.
 * - Everything else plays MP3 from Icecast.
 */
export function pickLiveUrl(urls: LiveStreamUrls): { url: string; kind: "hls" | "mp3" | "opus" } {
  const supportsNativeHls = typeof document !== "undefined" && (() => {
    try {
      const probe = document.createElement("audio");
      return probe.canPlayType("application/vnd.apple.mpegurl") !== "";
    } catch { return false; }
  })();

  if (supportsNativeHls && urls.hls) return { url: urls.hls, kind: "hls" };
  if (urls.mp3) return { url: urls.mp3, kind: "mp3" };
  if (urls.opus) return { url: urls.opus, kind: "opus" };
  return { url: urls.hls, kind: "hls" }; // last resort
}

/**
 * Drive an <audio> element from a `playing` boolean.
 *
 * Modes:
 *   - enabled=true  : LIVE broadcast. Hook picks URL from `urls` based on browser.
 *   - enabled=false : SOLO playback. Parent passes per-song URL via `soloSrc`.
 *
 * Single effect handles src + play/pause as one atomic operation. This avoids
 * the multi-effect race where src is assigned in one effect and play() runs
 * in another — if the user toggles playing while changing src (e.g. clicking
 * a library song which sets liveMode=false + soloIdx=N + playing=true all at
 * once), the play() effect could fire against the old/empty src.
 *
 * The audio element's own `play`/`pause` events are still attached by the
 * parent's <audio> JSX so the UI's `playing` state can reflect element state
 * honestly; this hook DRIVES the element, the JSX OBSERVES it.
 *
 * For HLS the hook also keeps the listener at the live edge after stalls.
 */
export function useLiveAudio(opts: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  enabled: boolean;
  playing: boolean;
  urls: LiveStreamUrls;
  soloSrc?: string;
  onPlayFail?: (err: unknown) => void;
  onDebug?: (line: string) => void;
}) {
  const { audioRef, enabled, playing, urls, soloSrc, onPlayFail, onDebug } = opts;
  const dbg = (s: string) => { try { onDebug?.(s); } catch { /* ignore */ } };
  const liveSeekCleanup = useRef<(() => void) | null>(null);
  // Track whether we were playing on the previous run so we can detect a
  // paused -> playing transition. On that transition for a live stream we
  // force a load() to drop any stale buffered tail and re-establish the
  // Icecast connection. Without this, Android Chrome plays the buffered
  // ~1s of audio then stops because the underlying socket was closed on
  // pause and the element doesn't refetch.
  const wasPlaying = useRef<boolean>(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    // ---- 1. Resolve the source URL for this configuration. ----
    let url = "";
    let kind: "hls" | "mp3" | "opus" | "solo" = "solo";

    if (enabled) {
      const picked = pickLiveUrl(urls);
      url = picked.url;
      kind = picked.kind;
    } else if (soloSrc) {
      url = soloSrc;
      kind = "solo";
    }

    // ---- 2. Tear down any previous HLS live-edge tracker. ----
    liveSeekCleanup.current?.();
    liveSeekCleanup.current = null;

    // ---- 3. Assign src if it changed. ----
    const srcChanged = url && a.src !== url;
    if (srcChanged) {
      a.src = url;
      a.load();
      dbg(`src=${url.slice(-30)} kind=${kind}`);
    }

    // ---- 4. Audio element knobs. ----
    a.muted = false;
    a.volume = 1;

    // ---- 5. Drive play/pause. ----
    if (playing && url) {
      const transitioningFromPaused = !wasPlaying.current;
      const inEmptyState = a.networkState === HTMLMediaElement.NETWORK_NO_SOURCE
        || a.readyState === HTMLMediaElement.HAVE_NOTHING
        || a.error !== null;
      // Live streams (Icecast/HLS) can't be trusted to resume cleanly from a
      // buffered tail after pause — the underlying connection is closed.
      // Force a reload on pause->play in live mode so we re-establish a fresh
      // connection. Solo (per-song MP3) doesn't have this problem.
      const liveResume = enabled && transitioningFromPaused && !srcChanged;
      if ((inEmptyState || liveResume) && !srcChanged) {
        dbg(`reload before play() rs=${a.readyState} ns=${a.networkState} err=${a.error?.code ?? "none"} liveResume=${liveResume}`);
        a.load();
      }
      dbg(`play() rs=${a.readyState} ns=${a.networkState} muted=${a.muted} vol=${a.volume} src=${a.src.slice(-30)}`);
      const p = a.play();
      if (p && typeof p.catch === "function") {
        p.catch((err: unknown) => {
          const name = (err as { name?: string })?.name;
          const msg  = (err as { message?: string })?.message;
          dbg(`play() REJECTED ${name}: ${msg ?? ""}`);
          if (name === "NotAllowedError") onPlayFail?.(err);
          else console.warn("[useLiveAudio] play() rejected:", err);
        });
        if (typeof p.then === "function") {
          p.then(() => dbg(`play() RESOLVED`));
        }
      }
    } else if (!playing) {
      dbg(`pause()`);
      a.pause();
    }

    wasPlaying.current = playing;

    // ---- 6. HLS live-edge tracking (Apple Safari only). ----
    if (kind === "hls") {
      const seekToLive = () => {
        try {
          const r = a.seekable;
          if (r && r.length > 0) {
            const liveEdge = r.end(r.length - 1);
            const target = Math.max(liveEdge - 2, 0);
            if (target > a.currentTime + 1.5) a.currentTime = target;
          }
        } catch { /* ignore */ }
      };
      a.addEventListener("loadedmetadata", seekToLive);
      a.addEventListener("playing", seekToLive);
      a.addEventListener("waiting", seekToLive);
      a.addEventListener("stalled", seekToLive);
      const interval = setInterval(seekToLive, 30_000);
      liveSeekCleanup.current = () => {
        clearInterval(interval);
        a.removeEventListener("loadedmetadata", seekToLive);
        a.removeEventListener("playing", seekToLive);
        a.removeEventListener("waiting", seekToLive);
        a.removeEventListener("stalled", seekToLive);
      };
    }

    return () => {
      liveSeekCleanup.current?.();
      liveSeekCleanup.current = null;
    };
  // Re-run on every config change. One effect, one truth, no race conditions.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, playing, urls.hls, urls.mp3, urls.opus, soloSrc]);
}
