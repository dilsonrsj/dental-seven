/** Helpers for opening/downloading blob or signed PDF URLs on mobile browsers. */

export function downloadPdfUrl(url: string, filename: string) {
  const safeName = filename.replace(/[^\w.\-(): ]+/g, "_").trim() || "documento";
  const withExt = safeName.toLowerCase().endsWith(".pdf")
    ? safeName
    : `${safeName}.pdf`;

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = withExt;
  anchor.rel = "noopener";
  anchor.target = "_blank";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function openPdfUrl(url: string): boolean {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (opened) return true;
  downloadPdfUrl(url, "documento.pdf");
  return false;
}

export function prefersExternalPdfViewer(): boolean {
  if (typeof window === "undefined") return false;
  const narrow = window.matchMedia("(max-width: 1023px)").matches;
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return narrow || mobileUa;
}
