import { sniff } from './uploads.module';

describe('sniff (magic bytes)', () => {
  it('nhận PNG thật, từ chối HTML giả PNG', () => {
    expect(sniff('image/png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toBe(true);
    expect(sniff('image/png', Buffer.from('<html><script>alert(1)</script>'))).toBe(false);
  });
  it('JPEG, GIF, WEBP, WAV', () => {
    expect(sniff('image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(sniff('image/gif', Buffer.from('GIF89a'))).toBe(true);
    expect(sniff('image/webp', Buffer.from('RIFF\0\0\0\0WEBPVP8 '))).toBe(true);
    expect(sniff('audio/wav', Buffer.from('RIFF\0\0\0\0WAVEfmt '))).toBe(true);
    expect(sniff('image/webp', Buffer.from('RIFF\0\0\0\0WAVEfmt '))).toBe(false);
  });
});
