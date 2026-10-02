/**
 * Schreibt die Einstellungen als kompakte Bytefolge für den Teilen-Link.
 *
 * Zahlen als LEB128 (kleine Werte = 1 Byte), Texte als UTF-8 mit Längenpräfix.
 */
export class ByteWriter {
  private readonly bytes: Array<number> = [];

  public writeUnsigned(value: number): void {
    // Negative oder gebrochene Werte kann der Link nicht abbilden; die Formularprüfung meldet sie ohnehin
    let rest = Math.max(0, Math.floor(value));
    do {
      let byte = rest % 128;
      rest = Math.floor(rest / 128);
      if (rest > 0) {
        byte += 128;
      }
      this.bytes.push(byte);
    } while (rest > 0);
  }

  /** Schalter als Bitfeld; die Anzahl vorneweg erlaubt es, später Schalter hinten anzuhängen. */
  public writeFlags(flags: ReadonlyArray<boolean>): void {
    this.writeUnsigned(flags.length);
    for (let start = 0; start < flags.length; start += 8) {
      let byte = 0;
      for (let bit = 0; bit < 8 && start + bit < flags.length; bit++) {
        if (flags[start + bit]) {
          byte |= 1 << bit;
        }
      }
      this.bytes.push(byte);
    }
  }

  public writeText(text: string): void {
    const encoded = new TextEncoder().encode(text);
    this.writeUnsigned(encoded.length);
    this.bytes.push(...encoded);
  }

  /**
   * Nullen am Ende fallen weg: Der ByteReader liest hinter dem Ende ohnehin 0,
   * leere Listen und Standardwerte am Schluss kosten so kein Zeichen.
   */
  public toBytes(): Uint8Array {
    let end = this.bytes.length;
    while (end > 0 && this.bytes[end - 1] === 0) {
      end--;
    }
    return Uint8Array.from(this.bytes.slice(0, end));
  }
}
