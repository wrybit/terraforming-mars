// Es soll immer nur ein Overlay offen sein: Seitenleisten-Dialoge (SidebarModal), gespielte Karten
// eines Spielers (OtherPlayer) und das Log-Karten-Overlay (LogMessageInspector).
// Jedes Overlay meldet sich mit einer Schließ-Funktion an; wer öffnet, schließt vorher alle anderen.

type RegisteredOverlay = {
  // Overlays mit gleichem Schlüssel regeln ihr Miteinander selbst (z. B. die Kartenansichten aller Spieler)
  key: string;
  close: () => void;
};

const overlays = new Map<symbol, RegisteredOverlay>();

// Liefert die Abmelde-Funktion zurück
export function registerOverlay(key: string, close: () => void): () => void {
  const id = Symbol(key);
  overlays.set(id, {key, close});
  return () => overlays.delete(id);
}

// Vor dem Öffnen aufrufen: schließt alle Overlays mit anderem Schlüssel
export function closeOtherOverlays(key: string): void {
  for (const overlay of overlays.values()) {
    if (overlay.key !== key) {
      overlay.close();
    }
  }
}
