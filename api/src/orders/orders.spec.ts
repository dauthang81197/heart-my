import { OrdersService } from './orders.module';

/** Prisma giả tối thiểu để kiểm tra logic ghi nhận thanh toán. */
function fakePrisma(order: any) {
  const upserts: any[] = [];
  const tx = {
    order: {
      findUnique: async () => order,
      updateMany: async ({ where }: any) => { if (order && order.status === where.status) { order.status = 'PAID'; return { count: 1 }; } return { count: 0 }; },
    },
    userStamp: { upsert: async (a: any) => { upserts.push(a); } },
  };
  return { prisma: { $transaction: async (fn: any) => fn(tx) } as any, upserts };
}

describe('OrdersService.markPaid', () => {
  const base = () => ({ id: 'o1', code: 'HPABCDEFGH', userId: 'u1', stampId: 's1', quantity: 5, amount: 25000, status: 'PENDING' });

  it('đủ tiền → PAID và cộng tem đúng số lượng', async () => {
    const { prisma, upserts } = fakePrisma(base());
    expect(await new OrdersService(prisma).markPaid('HPABCDEFGH', 25000, 'tx1')).toBe('paid');
    expect(upserts[0].update.quantity.increment).toBe(5);
  });
  it('webhook gọi lại → duplicate, không cộng tem lần hai', async () => {
    const o = base();
    const { prisma, upserts } = fakePrisma(o);
    const svc = new OrdersService(prisma);
    await svc.markPaid(o.code, 25000, 'tx1');
    expect(await svc.markPaid(o.code, 25000, 'tx1')).toBe('duplicate');
    expect(upserts).toHaveLength(1);
  });
  it('thiếu tiền → underpaid, không cộng tem', async () => {
    const { prisma, upserts } = fakePrisma(base());
    expect(await new OrdersService(prisma).markPaid('HPABCDEFGH', 20000, 'tx2')).toBe('underpaid');
    expect(upserts).toHaveLength(0);
  });
  it('mã đơn không tồn tại → no-order', async () => {
    const { prisma } = fakePrisma(null);
    expect(await new OrdersService(prisma).markPaid('HPNOPE', 1, 'tx3')).toBe('no-order');
  });
});
