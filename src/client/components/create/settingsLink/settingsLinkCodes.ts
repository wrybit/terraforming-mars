import codeTables from './settingsLinkCodes.json';
import {ByteReader} from './ByteReader';
import {ByteWriter} from './ByteWriter';

export type CodeTableName = keyof typeof codeTables;

/** Code 0 heißt: Wert steht als Text dahinter (z. B. Karte, die neuer ist als die Tabelle). */
const TEXT_FALLBACK_CODE = 0;

const codesByValue = new Map<CodeTableName, Map<string, number>>();

function codeIndex(table: CodeTableName): Map<string, number> {
  let index = codesByValue.get(table);
  if (index === undefined) {
    // Code = Position + 1, weil 0 für den Text-Ersatz reserviert ist
    index = new Map(codeTables[table].map((value, position) => [value, position + 1]));
    codesByValue.set(table, index);
  }
  return index;
}

export function codeTableValues(table: CodeTableName): ReadonlyArray<string> {
  return codeTables[table];
}

export function writeCodedValue(writer: ByteWriter, table: CodeTableName, value: string): void {
  const code = codeIndex(table).get(value) ?? TEXT_FALLBACK_CODE;
  writer.writeUnsigned(code);
  if (code === TEXT_FALLBACK_CODE) {
    writer.writeText(value);
  }
}

export function readCodedValue(reader: ByteReader, table: CodeTableName): string {
  const code = reader.readUnsigned();
  if (code === TEXT_FALLBACK_CODE) {
    return reader.readText();
  }
  // Unbekannter Code (Link von neuerer Version): leer lassen, die Formularprüfung meldet es
  return codeTables[table][code - 1] ?? '';
}

export function writeCodedList(writer: ByteWriter, table: CodeTableName, values: ReadonlyArray<string>): void {
  writer.writeUnsigned(values.length);
  for (const value of values) {
    writeCodedValue(writer, table, value);
  }
}

export function readCodedList(reader: ByteReader, table: CodeTableName): Array<string> {
  const count = reader.readUnsigned();
  const values: Array<string> = [];
  for (let index = 0; index < count; index++) {
    const value = readCodedValue(reader, table);
    if (value !== '') {
      values.push(value);
    }
  }
  return values;
}
