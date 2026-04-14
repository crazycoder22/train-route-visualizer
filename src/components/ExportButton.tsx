"use client";

import { useState, useRef, useEffect } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

interface ExportButtonProps {
  targetRef: React.RefObject<HTMLElement | null>;
  filename: string;
}

export default function ExportButton({ targetRef, filename }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
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

  const captureNode = async () => {
    if (!targetRef.current) throw new Error("Target element not found");

    // Use background color matching current theme
    const isDark = document.documentElement.classList.contains("dark");
    const bgColor = isDark ? "#0a0f1a" : "#f8fafc";

    return await toPng(targetRef.current, {
      backgroundColor: bgColor,
      pixelRatio: 2,
      cacheBust: true,
      // Skip cross-origin tiles that can't be embedded (Leaflet tile fallback)
      filter: (node) => {
        if (node instanceof HTMLElement) {
          // Skip the actions bar itself and popups we don't need
          if (node.dataset?.exportSkip === "true") return false;
        }
        return true;
      },
    });
  };

  const handlePng = async () => {
    setOpen(false);
    setBusy("png");
    try {
      const dataUrl = await captureNode();
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG export failed:", err);
      alert("Failed to export as PNG. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const handlePdf = async () => {
    setOpen(false);
    setBusy("pdf");
    try {
      const dataUrl = await captureNode();

      // Load the image to get dimensions
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Determine page orientation based on aspect ratio
      const orientation = img.width > img.height ? "landscape" : "portrait";
      const pdf = new jsPDF({
        orientation,
        unit: "pt",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      // Fit image preserving aspect ratio
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
      const renderWidth = img.width * ratio;
      const renderHeight = img.height * ratio;
      const offsetX = (pageWidth - renderWidth) / 2;
      const offsetY = (pageHeight - renderHeight) / 2;

      pdf.addImage(dataUrl, "PNG", offsetX, offsetY, renderWidth, renderHeight);
      pdf.save(`${filename}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export as PDF. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div ref={menuRef} className="relative" data-export-skip="true">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy !== null}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-60"
      >
        {busy ? (
          <>
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Exporting {busy.toUpperCase()}...
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-20">
          <button
            onClick={handlePng}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Download PNG
          </button>
          <button
            onClick={handlePdf}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}
