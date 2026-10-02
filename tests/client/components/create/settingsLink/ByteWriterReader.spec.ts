import {expect} from 'chai';
import {ByteWriter} from '@/client/components/create/settingsLink/ByteWriter';
import {ByteReader} from '@/client/components/create/settingsLink/ByteReader';
import {base64UrlToBytes, bytesToBase64Url} from '@/client/components/create/settingsLink/base64Url';

describe('settings link bytes', () => {
  it('round-trips numbers, flags and text', () => {
    const writer = new ByteWriter();
    writer.writeUnsigned(0);
    writer.writeUnsigned(127);
    writer.writeUnsigned(128);
    writer.writeUnsigned(1021);
    writer.writeFlags([true, false, true, true, false, false, false, false, true]);
    writer.writeText('Jürgen 🚀');
    writer.writeUnsigned(5);

    const reader = new ByteReader(base64UrlToBytes(bytesToBase64Url(writer.toBytes())));
    expect(reader.readUnsigned()).eq(0);
    expect(reader.readUnsigned()).eq(127);
    expect(reader.readUnsigned()).eq(128);
    expect(reader.readUnsigned()).eq(1021);
    expect(reader.readFlags()).deep.eq([true, false, true, true, false, false, false, false, true]);
    expect(reader.readText()).eq('Jürgen 🚀');
    expect(reader.readUnsigned()).eq(5);
  });

  it('trims trailing zeros and reads them back as zero', () => {
    const writer = new ByteWriter();
    writer.writeUnsigned(3);
    writer.writeUnsigned(0);
    writer.writeText('');
    expect(Array.from(writer.toBytes())).deep.eq([3]);

    const reader = new ByteReader(writer.toBytes());
    expect(reader.readUnsigned()).eq(3);
    expect(reader.readUnsigned()).eq(0);
    expect(reader.readText()).eq('');
    expect(reader.readFlags()).deep.eq([]);
  });

  it('produces URL-safe text', () => {
    const text = bytesToBase64Url(Uint8Array.from([251, 255, 254, 62, 63]));
    expect(text).match(/^[A-Za-z0-9_-]+$/);
  });
});
