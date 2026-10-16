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
  // Misst erst, nachdem alle anderen Aufträge des Frames ihr Ergebnis geschrieben haben – für Messungen,
  // die vom Ergebnis anderer abhängen (z. B. Tab-Lücke nach dem Ausblenden der Icon-Beschriftungen)
  afterOthers?: boolean,
};

// Je Schlüssel (meist das Element) zählt nur der letzte Auftrag: mehrere Auslöser im selben Frame
// (updated, MutationObserver, ResizeObserver) messen nur einmal
const pendingJobs = new Map<object, LayoutJob<unknown>>();
// Vor dem Aufruf von requestAnimationFrame gesetzt: ruft es flush sofort auf (Test-Stubs), setzt flush
// die Markierung zurück, statt dass die Rückgabe sie danach wieder überschreibt und das Batching hängen bleibt
let framePending = false;

// Eine Runde: alle Vorbereitungen, alle Messungen, alle Ergebnisse
function runPass(jobs: Array<LayoutJob<unknown>>): void {
  jobs.forEach((job) => job.prepare?.());
  const measurements = jobs.map((job) => job.measure());
  jobs.forEach((job, index) => job.apply(measurements[index]));
}

function flush(): void {
  framePending = false;
  const jobs = [...pendingJobs.values()];
  pendingJobs.clear();
  // Zwei Runden: die zweite Messung kostet nur dann ein weiteres Layout, wenn es späte Aufträge gibt
  runPass(jobs.filter((job) => !job.afterOthers));
  runPass(jobs.filter((job) => job.afterOthers));
}

export function scheduleLayoutJob<Measurement>(key: object, job: LayoutJob<Measurement>): void {
  pendingJobs.set(key, job as LayoutJob<unknown>);
  // Testumgebung ohne requestAnimationFrame: sofort ausführen
  if (typeof requestAnimationFrame === 'undefined') {
    flush();
    return;
  }
  if (!framePending) {
    framePending = true;
    requestAnimationFrame(flush);
  }
}

export function cancelLayoutJob(key: object): void {
  pendingJobs.delete(key);
}
