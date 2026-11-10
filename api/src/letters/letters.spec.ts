import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LettersService } from './letters.service';

const mail: any = { letterReceived: jest.fn().mockResolvedValue(undefined) };

describe('LettersService', () => {
  it('inbox rỗng với tài khoản chưa xác minh email', async () => {
    const prisma: any = { user: { findUnique: async () => ({ email: 'a@b.com', emailVerified: false }) }, letter: { findMany: jest.fn() } };
    expect(await new LettersService(prisma, mail).inbox('u1')).toEqual([]);
    expect(prisma.letter.findMany).not.toHaveBeenCalled();
  });
  it('inbox trả thư cho tài khoản đã xác minh', async () => {
    const prisma: any = { user: { findUnique: async () => ({ email: 'A@B.com', emailVerified: true }) }, letter: { findMany: jest.fn().mockResolvedValue([{ id: 1 }]) } };
    expect(await new LettersService(prisma, mail).inbox('u1')).toEqual([{ id: 1 }]);
    expect(prisma.letter.findMany.mock.calls[0][0].where.recipientEmail).toBe('a@b.com');
  });
  it('thư bị ẩn → 404 khi xem bằng link', async () => {
    const prisma: any = { letter: { findUnique: async () => ({ status: 'SENT', hidden: true }) } };
    await expect(new LettersService(prisma, mail).viewByToken('t')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('gửi thư lần hai (đã khoá/đã gửi) → lỗi và KHÔNG trừ tem', async () => {
    const letter = { id: 'l1', authorId: 'u1', type: 'PUBLIC', status: 'DRAFT' };
    const stampUpdate = jest.fn();
    const tx = { letter: { updateMany: async () => ({ count: 0 }), update: jest.fn() }, userStamp: { updateMany: stampUpdate } };
    const prisma: any = { letter: { findUnique: async () => letter }, $transaction: async (fn: any) => fn(tx) };
    await expect(new LettersService(prisma, mail).send('u1', 'l1', 's1')).rejects.toBeInstanceOf(BadRequestException);
    expect(stampUpdate).not.toHaveBeenCalled();
  });
  it('không có tem → lỗi, thư không đổi trạng thái', async () => {
    const letter = { id: 'l1', authorId: 'u1', type: 'PUBLIC', status: 'DRAFT' };
    const update = jest.fn();
    const tx = { letter: { updateMany: async () => ({ count: 1 }), update }, userStamp: { updateMany: async () => ({ count: 0 }) } };
    const prisma: any = { letter: { findUnique: async () => letter }, $transaction: async (fn: any) => fn(tx) };
    await expect(new LettersService(prisma, mail).send('u1', 'l1', 's1')).rejects.toThrow(/chưa có tem/);
    expect(update).not.toHaveBeenCalled();
  });
});
