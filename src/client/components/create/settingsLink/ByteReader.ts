/**
 * Liest die Bytefolge des Teilen-Links (Gegenstück zum ByteWriter).
 *
 * Hinter dem Ende liefert jede Lesefunktion 0 bzw. leer, weil der ByteWriter
 * Nullen am Schluss abschneidet und neuere Felder hinten angehängt werden.
 */
export class ByteReader {
  private position = 0;

  constructor(private readonly bytes: Uint8Array) {
  }

  public readUnsigned(): number {
    let value = 0;
    let factor = 1;
    while (this.position < this.bytes.length) {
      const byte = this.bytes[this.position++];
      value += (byte % 128) * factor;
      if (byte < 128) {
        break;
      }
      factor *= 128;
    }
    return value;
  }

  public readFlags(): Array<boolean> {
    const count = this.readUnsigned();
    const flags: Array<boolean> = [];
    for (let index = 0; index < count; index++) {
      const byte = this.bytes[this.position + Math.floor(index / 8)] ?? 0;
      flags.push((byte & (1 << (index % 8))) !== 0);
    }
    this.position += Math.ceil(count / 8);
    return flags;
  }

  public readText(): string {
    // Länge auf den Rest begrenzen, damit kaputte Links nicht riesige Puffer anlegen
    const length = Math.min(this.readUnsigned(), Math.max(0, this.bytes.length - this.position));
    const text = new TextDecoder().decode(this.bytes.subarray(this.position, this.position + length));
    this.position += length;
    return text;
  }
}
