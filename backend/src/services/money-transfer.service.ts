import prisma from '../database/client';
import { Prisma } from '@prisma/client';

interface TransferQuery {
  tenantId: string;
  fromAccountId?: string;
  toAccountId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

interface CreateTransferData {
  tenantId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: Date;
  reference?: string;
  description?: string;
  createdBy?: string;
}

class MoneyTransferService {
  async findAll(query: TransferQuery) {
    const {
      tenantId,
      fromAccountId,
      toAccountId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query;

    const where: Prisma.MoneyTransferWhereInput = {
      tenantId,
      ...(fromAccountId && { fromAccountId }),
      ...(toAccountId && { toAccountId }),
      ...(startDate && endDate && {
        date: { gte: startDate, lte: endDate },
      }),
    };

    const [transfers, total] = await Promise.all([
      prisma.moneyTransfer.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          fromAccount: { select: { id: true, code: true, name: true } },
          toAccount: { select: { id: true, code: true, name: true } },
        },
      }),
      prisma.moneyTransfer.count({ where }),
    ]);

    return { transfers, total, page, limit };
  }

  async findById(id: string, tenantId: string) {
    const transfer = await prisma.moneyTransfer.findFirst({
      where: { id, tenantId },
      include: {
        fromAccount: true,
        toAccount: true,
      },
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    return transfer;
  }

  async create(data: CreateTransferData) {
    if (data.fromAccountId === data.toAccountId) {
      throw new Error('Cannot transfer to the same account');
    }

    // Verify accounts exist and belong to tenant
    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findFirst({ where: { id: data.fromAccountId, tenantId: data.tenantId } }),
      prisma.account.findFirst({ where: { id: data.toAccountId, tenantId: data.tenantId } }),
    ]);

    if (!fromAccount) {
      throw new Error('Source account not found');
    }

    if (!toAccount) {
      throw new Error('Destination account not found');
    }

    // Check sufficient balance
    if (Number(fromAccount.balance) < data.amount) {
      throw new Error('Insufficient balance in source account');
    }

    return prisma.$transaction(async (tx) => {
      const transfer = await tx.moneyTransfer.create({
        data,
        include: {
          fromAccount: true,
          toAccount: true,
        },
      });

      // Deduct from source account
      await tx.account.update({
        where: { id: data.fromAccountId },
        data: { balance: { decrement: data.amount } },
      });

      // Add to destination account
      await tx.account.update({
        where: { id: data.toAccountId },
        data: { balance: { increment: data.amount } },
      });

      // Create journal entries
      const description = data.description || `Transfer: ${fromAccount.name} → ${toAccount.name}`;

      // Credit from source
      await tx.journalEntry.create({
        data: {
          accountId: data.fromAccountId,
          date: data.date,
          credit: data.amount,
          description,
          refType: 'TRANSFER',
          refId: transfer.id,
          createdBy: data.createdBy,
        },
      });

      // Debit to destination
      await tx.journalEntry.create({
        data: {
          accountId: data.toAccountId,
          date: data.date,
          debit: data.amount,
          description,
          refType: 'TRANSFER',
          refId: transfer.id,
          createdBy: data.createdBy,
        },
      });

      return transfer;
    });
  }

  async delete(id: string, tenantId: string) {
    const transfer = await prisma.moneyTransfer.findFirst({
      where: { id, tenantId },
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    return prisma.$transaction(async (tx) => {
      // Reverse account balances
      await tx.account.update({
        where: { id: transfer.fromAccountId },
        data: { balance: { increment: Number(transfer.amount) } },
      });

      await tx.account.update({
        where: { id: transfer.toAccountId },
        data: { balance: { decrement: Number(transfer.amount) } },
      });

      // Delete journal entries
      await tx.journalEntry.deleteMany({
        where: { refType: 'TRANSFER', refId: id },
      });

      return tx.moneyTransfer.delete({ where: { id } });
    });
  }
}

export default new MoneyTransferService();

