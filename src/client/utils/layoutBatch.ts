// Bündelt DOM-Messungen mehrerer Komponenten in einem Frame: erst alle Vorbereitungen (Schreiben),
// dann alle Messungen (Lesen), dann alle Ergebnisse (Schreiben). So rechnet der Browser das Layout
// einmal statt einmal pro Komponente – sonst meldet Chrome "[Violation] Forced reflow".
// Läuft in requestAnimationFrame, also noch vor dem Zeichnen: nichts flackert.

export type LayoutJob<Measurement> = {
  // Setzt einen Messzustand her (z. B. ausgeblendete Beschriftungen wieder zeigen); schreibt nur
  prepare?: () => void,
  // Liest nur aus dem DOM, schreibt nichts
  measure: () => Measurement,
  // Schreibt das Ergebnis; liest nichts
  apply: (measurement: Measurement) => void,
};

// Je Schlüssel (meist das Element) zählt nur der letzte Auftrag: mehrere Auslöser im selben Frame
// (updated, MutationObserver, ResizeObserver) messen nur einmal
const pendingJobs = new Map<object, LayoutJob<unknown>>();
let frame: number | undefined;

function flush(): void {
  frame = undefined;
  const jobs = [...pendingJobs.values()];
  pendingJobs.clear();
  jobs.forEach((job) => job.prepare?.());
  const measurements = jobs.map((job) => job.measure());
  jobs.forEach((job, index) => job.apply(measurements[index]));
}

export function scheduleLayoutJob<Measurement>(key: object, job: LayoutJob<Measurement>): void {
  pendingJobs.set(key, job as LayoutJob<unknown>);
  // Testumgebung ohne requestAnimationFrame: sofort ausführen
  if (typeof requestAnimationFrame === 'undefined') {
    flush();
    return;
  }
  if (frame === undefined) {
    frame = requestAnimationFrame(flush);
  }
}

export function cancelLayoutJob(key: object): void {
  pendingJobs.delete(key);
}
