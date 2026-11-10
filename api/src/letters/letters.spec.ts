import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { LettersService } from './letters.service';

const mail: any = { letterReceived: jest.fn().mockResolvedValue(undefined), letterCode: jest.fn().mockResolvedValue(undefined) };
const jwt: any = { sign: jest.fn(() => 'VIEW.TOKEN'), verify: jest.fn() };

describe('LettersService', () => {
  it('inbox rỗng với tài khoản chưa xác minh email', async () => {
    const prisma: any = { user: { findUnique: async () => ({ email: 'a@b.com', emailVerified: false }) }, letter: { findMany: jest.fn() } };
    expect(await new LettersService(prisma, mail, jwt).inbox('u1')).toEqual([]);
    expect(prisma.letter.findMany).not.toHaveBeenCalled();
  });
  it('inbox trả thư cho tài khoản đã xác minh', async () => {
    const prisma: any = { user: { findUnique: async () => ({ email: 'A@B.com', emailVerified: true }) }, letter: { findMany: jest.fn().mockResolvedValue([{ id: 1 }]) } };
    expect(await new LettersService(prisma, mail, jwt).inbox('u1')).toEqual([{ id: 1 }]);
    expect(prisma.letter.findMany.mock.calls[0][0].where.recipientEmail).toBe('a@b.com');
  });
  it('thư bị ẩn → 404 khi xem bằng link', async () => {
    const prisma: any = { letter: { findUnique: async () => ({ status: 'SENT', hidden: true }) } };
    await expect(new LettersService(prisma, mail, jwt).viewByToken('t')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('gửi thư lần hai (đã khoá/đã gửi) → lỗi và KHÔNG trừ tem', async () => {
    const letter = { id: 'l1', authorId: 'u1', type: 'PUBLIC', status: 'DRAFT' };
    const stampUpdate = jest.fn();
    const tx = { letter: { updateMany: async () => ({ count: 0 }), update: jest.fn() }, userStamp: { updateMany: stampUpdate } };
    const prisma: any = { letter: { findUnique: async () => letter }, $transaction: async (fn: any) => fn(tx) };
    await expect(new LettersService(prisma, mail, jwt).send('u1', 'l1', 's1')).rejects.toBeInstanceOf(BadRequestException);
    expect(stampUpdate).not.toHaveBeenCalled();
  });
  it('không có tem → lỗi, thư không đổi trạng thái', async () => {
    const letter = { id: 'l1', authorId: 'u1', type: 'PUBLIC', status: 'DRAFT' };
    const update = jest.fn();
    const tx = { letter: { updateMany: async () => ({ count: 1 }), update }, userStamp: { updateMany: async () => ({ count: 0 }) } };
    const prisma: any = { letter: { findUnique: async () => letter }, $transaction: async (fn: any) => fn(tx) };
    await expect(new LettersService(prisma, mail, jwt).send('u1', 'l1', 's1')).rejects.toThrow(/chưa có tem/);
    expect(update).not.toHaveBeenCalled();
  });

  describe('thư riêng tư (cổng xác minh)', () => {
    const priv = (over: any = {}) => ({ id: 'l1', authorId: 'author', recipientEmail: 'dauthang811@gmail.com', status: 'SENT', hidden: false, type: 'PRIVATE', shareToken: 't', author: { name: 'Hậu' }, ...over });

    it('mask email', () => { expect(LettersService.mask('dauthang811@gmail.com')).toBe('d***1@gmail.com'); });
    it('chưa xác minh → 403 locked kèm email đã che, không lộ email thật', async () => {
      const prisma: any = { letter: { findUnique: async () => priv() } };
      const err: any = await new LettersService(prisma, mail, jwt).viewByToken('t').catch((e) => e);
      expect(err).toBeInstanceOf(ForbiddenException);
      expect(err.getResponse()).toMatchObject({ locked: true, maskedEmail: 'd***1@gmail.com' });
      expect(JSON.stringify(err.getResponse())).not.toContain('dauthang811');
    });
    it('có view-token đúng thư → xem được, không trả recipientEmail', async () => {
      const prisma: any = { letter: { findUnique: async () => priv() } };
      const j: any = { ...jwt, verify: jest.fn(() => ({ lid: 'l1' })) };
      const r: any = await new LettersService(prisma, mail, j).viewByToken('t', { viewToken: 'x' });
      expect(r.recipientEmail).toBeUndefined(); expect(r.id).toBeUndefined(); expect(r.shareToken).toBe('t');
    });
    it('view-token của thư khác → vẫn bị khoá', async () => {
      const prisma: any = { letter: { findUnique: async () => priv() } };
      const j: any = { ...jwt, verify: jest.fn(() => ({ lid: 'khac' })) };
      await expect(new LettersService(prisma, mail, j).viewByToken('t', { viewToken: 'x' })).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('tác giả đăng nhập luôn xem được; tài khoản chưa xác minh đúng email thì không', async () => {
      const j: any = { ...jwt, verify: jest.fn(() => ({ sub: 'author', v: 0 })) };
      const prisma: any = { letter: { findUnique: async () => priv() }, user: { findUnique: async () => ({ id: 'author', tokenVersion: 0, emailVerified: false, email: 'a@x.com' }) } };
      await expect(new LettersService(prisma, mail, j).viewByToken('t', { authorization: 'Bearer z' })).resolves.toBeDefined();
      const j2: any = { ...jwt, verify: jest.fn(() => ({ sub: 'u9', v: 0 })) };
      const prisma2: any = { letter: { findUnique: async () => priv() }, user: { findUnique: async () => ({ id: 'u9', tokenVersion: 0, emailVerified: false, email: 'dauthang811@gmail.com' }) } };
      await expect(new LettersService(prisma2, mail, j2).viewByToken('t', { authorization: 'Bearer z' })).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('thư công khai không cần xác minh', async () => {
      const prisma: any = { letter: { findUnique: async () => priv({ type: 'PUBLIC', recipientEmail: null }) } };
      await expect(new LettersService(prisma, mail, jwt).viewByToken('t')).resolves.toBeDefined();
    });
    it('mã sai tăng số lần thử, đúng 5 lần sai thì chặn', async () => {
      const row = { id: 'c1', codeHash: 'x', attempts: 5, expiresAt: new Date(Date.now() + 60_000) };
      const prisma: any = { letter: { findUnique: async () => priv() }, viewCode: { findFirst: async () => row, update: jest.fn() } };
      await expect(new LettersService(prisma, mail, jwt).verifyViewCode('t', '000000')).rejects.toThrow(/quá nhiều/);
      expect(prisma.viewCode.update).not.toHaveBeenCalled();
    });
  });
});
