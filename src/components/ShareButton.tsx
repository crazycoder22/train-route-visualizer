"use client";

import { useState, useRef, useEffect } from "react";
import { toPng } from "html-to-image";

interface ShareButtonProps {
  trainNo: string;
  trainName: string;
  states: string[];
  targetRef: React.RefObject<HTMLElement | null>;
}

export default function ShareButton({
  trainNo,
  trainName,
  states,
  targetRef,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const getShareUrl = () => {
    const url = new URL(window.location.origin);
    url.searchParams.set("train", trainNo);
    return url.toString();
  };

  const getShareText = () => {
    return `Check out train ${trainNo} (${trainName}) — passes through ${states.length} states! 🚂\n${getShareUrl()}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = getShareUrl();
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setOpen(false);
  };

  const handleShareImage = async () => {
    if (!targetRef.current) return;
    setSharing(true);
    setOpen(false);

    try {
      const isDark = document.documentElement.classList.contains("dark");
      const dataUrl = await toPng(targetRef.current, {
        backgroundColor: isDark ? "#0a0f1a" : "#f8fafc",
        pixelRatio: 2,
        cacheBust: true,
        filter: (node) => {
          if (node instanceof HTMLElement && node.dataset?.exportSkip === "true")
            return false;
          return true;
        },
      });

      // Convert to blob for sharing
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `train-${trainNo}-route.png`, {
        type: "image/png",
      });

      // Try Web Share API with files (works on mobile)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Train ${trainNo} Route`,
          text: `${trainName} passes through ${states.length} states!`,
          files: [file],
        });
      } else {
        // Fallback: download the image
        const link = document.createElement("a");
        link.download = `train-${trainNo}-route.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      // User cancelled share or error
      console.error("Share failed:", err);
    } finally {
      setSharing(false);
    }
  };

  const handleNativeShare = async () => {
    setOpen(false);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Train ${trainNo} Route`,
          text: getShareText(),
          url: getShareUrl(),
        });
      } catch {
        // User cancelled
      }
    }
  };

  const handleWhatsApp = () => {
    setOpen(false);
    const text = encodeURIComponent(getShareText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleTwitter = () => {
    setOpen(false);
    const text = encodeURIComponent(
      `Train ${trainNo} (${trainName}) passes through ${states.length} states! 🚂`
    );
    const url = encodeURIComponent(getShareUrl());
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank"
    );
  };

  return (
    <div ref={menuRef} className="relative" data-export-skip="true">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={sharing}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-60"
      >
        {sharing ? (
          <>
            <svg
              className="w-3.5 h-3.5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Sharing...
          </>
        ) : (
          <>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Share
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-20">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Copy Link
              </>
            )}
          </button>
          <button
            onClick={handleShareImage}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <svg
              className="w-4 h-4 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Share as Image
          </button>
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="text-base leading-none">💬</span>
            WhatsApp
          </button>
          <button
            onClick={handleTwitter}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="text-base leading-none">🐦</span>
            Twitter / X
          </button>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700"
            >
              <svg
                className="w-4 h-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              More options...
            </button>
          )}
        </div>
      )}
    </div>
  );
}
