// Auswahl-Logik der Filtergruppen der Kartenliste.
// Das Modell speichert je Option "eingeschlossen" (alle true = kein Filter) – so bleibt das URL-Format unverändert.
// In der Oberfläche heißt das: keine Option markiert = alles sichtbar; der erste Klick grenzt auf diese Option ein,
// weitere Klicks nehmen Optionen dazu oder wieder weg. Wird die letzte markierte Option abgewählt, ist wieder alles sichtbar.

export type Selection<K extends string> = Record<K, boolean>;

// True, wenn in dieser Gruppe nichts eingeschränkt ist
export function isUnfiltered<K extends string>(selection: Selection<K>, keys: ReadonlyArray<K>): boolean {
  return keys.every((key) => selection[key] === true);
}

// Markiert = gewählt, solange die Gruppe überhaupt einschränkt
export function isMarked<K extends string>(selection: Selection<K>, keys: ReadonlyArray<K>, key: K): boolean {
  return selection[key] === true && !isUnfiltered(selection, keys);
}

export function markedOptions<K extends string>(selection: Selection<K>, keys: ReadonlyArray<K>): Array<K> {
  return isUnfiltered(selection, keys) ? [] : keys.filter((key) => selection[key] === true);
}

export function resetOptions<K extends string>(selection: Selection<K>, keys: ReadonlyArray<K>): void {
  keys.forEach((key) => selection[key] = true);
}

export function toggleOption<K extends string>(selection: Selection<K>, keys: ReadonlyArray<K>, key: K): void {
  if (isUnfiltered(selection, keys)) {
    keys.forEach((other) => selection[other] = other === key);
    return;
  }
  selection[key] = !selection[key];
  // Nichts mehr markiert hieße "nichts sichtbar" – gemeint ist aber "Filter weg"
  if (keys.every((other) => selection[other] !== true)) {
    resetOptions(selection, keys);
  }
}
