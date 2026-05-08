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
 * In either mode, the hook owns the play()/pause() lifecycle. The audio
 * element's own `play`/`pause` events are still attached by the parent's
 * <audio> JSX so the UI's `playing` state can reflect element state honestly;
 * this hook DRIVES the element, the JSX OBSERVES it.
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

  // 1. Source assignment.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    liveSeekCleanup.current?.();
    liveSeekCleanup.current = null;

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

    if (!url) return;

    if (a.src !== url) {
      a.src = url;
      a.load();
      dbg(`src=${url.slice(-30)} kind=${kind}`);
    }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, urls.hls, urls.mp3, urls.opus, soloSrc]);

  // 2. play() / pause().
  //
  // Always re-runs when `playing` flips, in either mode. Before play(), if
  // the element is in an empty/error state, call load() to refresh the
  // connection. This covers the case where Icecast drops the listener after
  // pause and the next play() needs a fresh fetch.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    a.muted = false;
    a.volume = 1;

    if (playing) {
      const needsReload = a.networkState === HTMLMediaElement.NETWORK_NO_SOURCE
        || a.readyState === HTMLMediaElement.HAVE_NOTHING
        || a.error !== null;
      if (needsReload && a.src) {
        dbg(`reload before play() rs=${a.readyState} ns=${a.networkState} err=${a.error?.code ?? "none"}`);
        a.load();
      }
      dbg(`play() rs=${a.readyState} ns=${a.networkState} muted=${a.muted} vol=${a.volume} src=${a.src?.slice(-30) ?? "(none)"}`);
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
    } else {
      dbg(`pause()`);
      a.pause();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);
}
