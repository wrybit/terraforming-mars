/**
 * Writes the settings as a compact byte sequence for the share link.
 *
 * Numbers as LEB128 (small values = 1 byte), strings as UTF-8 with a length prefix.
 */
export class ByteWriter {
  private readonly bytes: Array<number> = [];

  public writeUnsigned(value: number): void {
    // The link can't represent negative or fractional values; the form validation reports them anyway
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

  /** Switches as a bit field; the leading count allows appending switches at the end later. */
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
   * Trailing zeros are dropped: the ByteReader reads 0 past the end anyway,
   * so empty lists and default values at the end cost no character.
   */
  public toBytes(): Uint8Array {
    let end = this.bytes.length;
    while (end > 0 && this.bytes[end - 1] === 0) {
      end--;
    }
    return Uint8Array.from(this.bytes.slice(0, end));
  }
}
