"use client";
import { useEffect, useRef } from "react";

/**
 * Source URLs for the live broadcast. Configure via NEXT_PUBLIC_* env vars.
 *
 * The player picks ONE of these based on the browser:
 *   - iOS Safari  -> HLS (native, gives ~1-2s start latency, jitter-resilient)
 *   - everywhere  -> MP3 (Icecast direct, universal compat, ~2-3s start latency)
 *
 * Why not hls.js for non-Safari?  We tried. Android Chrome's MediaSource has
 * codec-compat quirks with our MPEG-TS that produce silent "playing" elements
 * intermittently. MP3-over-Icecast is the boring, reliable path.
 */
export interface LiveStreamUrls {
  hls: string;
  mp3: string;
  opus: string;
}

/**
 * Decide which live stream URL the current browser should play.
 *
 * - Apple devices (Safari on iOS/macOS) play HLS natively. Use it for the
 *   smoothest live feel and the ability to seek to the live edge after
 *   network jitter.
 * - Everything else (Android, Chrome, Firefox) plays MP3 from Icecast.
 *
 * Note: this is called during render (and inside the audio sync effect), so
 * it is safe to use when window/document are available. On the server we
 * default to MP3 (irrelevant: SSR doesn't bind the audio element).
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
 * Drive the live broadcast on an <audio> element.
 *
 * Responsibilities:
 *   1. Pick the right source URL for the browser and assign it to the audio
 *      element.
 *   2. Call play() / pause() to follow `playing`. Honest mapping: if the
 *      browser rejects play() (autoplay policy), reflect that in `onPlayFail`
 *      so the UI can update.
 *   3. For HLS: keep the listener at the live edge after stalls/jitter. iOS
 *      treats HLS as a seekable timeline by default and otherwise lets users
 *      drift behind broadcast.
 *
 * What this hook deliberately does NOT do:
 *   - Listen to the audio element's own `pause`/`play` events. The parent
 *     attaches those directly to <audio> for clear semantics (see App.tsx).
 *   - Reload the source on pause. That breaks resume on some Android browsers
 *     and provides little value (the user resumes a few seconds behind live,
 *     which is fine for radio).
 *   - Pre-warm by silently playing on mount. Mobile browsers reject muted
 *     autoplay anyway and the trick only worked on desktop.
 */
export function useLiveAudio(opts: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  enabled: boolean;        // true = live mode, false = solo mode
  playing: boolean;        // user's intent
  urls: LiveStreamUrls;
  onPlayFail?: (err: unknown) => void;
}) {
  const { audioRef, enabled, playing, urls, onPlayFail } = opts;
  const liveSeekCleanup = useRef<(() => void) | null>(null);

  // 1. Source assignment.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    // Tear down any previous live-seek listeners on src change.
    liveSeekCleanup.current?.();
    liveSeekCleanup.current = null;

    if (!enabled) {
      // Solo mode handles its own src in the parent. Nothing to do here.
      return;
    }

    const { url, kind } = pickLiveUrl(urls);
    if (!url) return;

    if (a.src !== url) {
      a.src = url;
      a.load();
    }

    if (kind === "hls") {
      // iOS Safari treats HLS as a seekable timeline. After a stall or
      // network blip, it resumes at the same offset and the listener drifts
      // further behind broadcast. Detect stalls/recovery and seek to the
      // live edge each time.
      const seekToLive = () => {
        try {
          const r = a.seekable;
          if (r && r.length > 0) {
            const liveEdge = r.end(r.length - 1);
            // Stay 2s behind the very edge to keep a small buffer.
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
  // We re-run whenever the active mode flips OR the URL config changes.
  // The picked URL is a function of urls + browser, so urls is enough.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, urls.hls, urls.mp3, urls.opus]);

  // 2. play() / pause() to follow `playing`.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    a.muted = false;
    if (playing) {
      const p = a.play();
      if (p && typeof p.catch === "function") {
        p.catch((err: unknown) => {
          // Real autoplay block (NotAllowedError) is the only case we surface
          // back to the UI; everything else is a transient that the audio
          // element will recover from on its own.
          const name = (err as { name?: string })?.name;
          if (name === "NotAllowedError") onPlayFail?.(err);
          else console.warn("[useLiveAudio] play() rejected:", err);
        });
      }
    } else {
      a.pause();
    }
  // playing is the only intent driver here. We intentionally do NOT depend
  // on src changes -- those are handled by the source-assignment effect,
  // which loads new media without restarting playback.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);
}
