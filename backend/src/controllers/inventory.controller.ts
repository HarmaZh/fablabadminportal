import { Request, Response } from 'express';
import { prisma } from '../config/database';
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  stockAdjustmentSchema,
  inventoryQuerySchema,
} from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export const getAllItems = asyncHandler(async (req: Request, res: Response) => {
  const { search, type, status, page = '1', limit = '50' } = inventoryQuerySchema.parse(req.query);

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { itemId: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  // Get items and total count
  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
  });
});

export const getItemById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      logs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!item) {
    throw new AppError(404, 'Item not found');
  }

  res.json({
    success: true,
    data: item,
  });
});

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createInventoryItemSchema.parse(req.body);
  const userId = req.user?.userId;

  // Check if itemId already exists
  const existing = await prisma.inventoryItem.findUnique({
    where: { itemId: validatedData.itemId },
  });

  if (existing) {
    throw new AppError(409, 'Item with this ID already exists');
  }

  // Create item and log in a transaction
  const item = await prisma.$transaction(async (tx) => {
    const newItem = await tx.inventoryItem.create({
      data: {
        ...validatedData,
        createdBy: userId,
      },
    });

    await tx.inventoryLog.create({
      data: {
        itemId: newItem.id,
        userId,
        action: 'CREATED',
        newValue: newItem,
      },
    });

    return newItem;
  });

  res.status(201).json({
    success: true,
    message: 'Item created successfully',
    data: item,
  });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateInventoryItemSchema.parse(req.body);
  const userId = req.user?.userId;

  // Get old item
  const oldItem = await prisma.inventoryItem.findUnique({ where: { id } });

  if (!oldItem) {
    throw new AppError(404, 'Item not found');
  }

  // Update item and create log
  const item = await prisma.$transaction(async (tx) => {
    const updatedItem = await tx.inventoryItem.update({
      where: { id },
      data: validatedData,
    });

    await tx.inventoryLog.create({
      data: {
        itemId: id,
        userId,
        action: 'UPDATED',
        oldValue: oldItem,
        newValue: updatedItem,
      },
    });

    return updatedItem;
  });

  res.json({
    success: true,
    message: 'Item updated successfully',
    data: item,
  });
});

export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  const item = await prisma.inventoryItem.findUnique({ where: { id } });

  if (!item) {
    throw new AppError(404, 'Item not found');
  }

  await prisma.$transaction(async (tx) => {
    await tx.inventoryLog.create({
      data: {
        itemId: id,
        userId,
        action: 'DELETED',
        oldValue: item,
      },
    });

    await tx.inventoryItem.delete({ where: { id } });
  });

  res.json({
    success: true,
    message: 'Item deleted successfully',
  });
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity, notes } = stockAdjustmentSchema.parse(req.body);
  const userId = req.user?.userId;

  const item = await prisma.inventoryItem.findUnique({ where: { id } });

  if (!item) {
    throw new AppError(404, 'Item not found');
  }

  const newQuantity = item.quantity + quantity;

  if (newQuantity < 0) {
    throw new AppError(400, 'Insufficient stock');
  }

  // Determine new status based on quantity
  let newStatus = item.status;
  if (newQuantity === 0) {
    newStatus = 'OUT_OF_STOCK';
  } else if (newQuantity < item.minStock) {
    newStatus = 'LOW_STOCK';
  } else {
    newStatus = 'IN_STOCK';
  }

  const updatedItem = await prisma.$transaction(async (tx) => {
    const updated = await tx.inventoryItem.update({
      where: { id },
      data: {
        quantity: newQuantity,
        status: newStatus,
      },
    });

    await tx.inventoryLog.create({
      data: {
        itemId: id,
        userId,
        action: quantity > 0 ? 'STOCK_ADDED' : 'STOCK_REMOVED',
        quantity: Math.abs(quantity),
        notes,
        oldValue: { quantity: item.quantity },
        newValue: { quantity: newQuantity },
      },
    });

    return updated;
  });

  res.json({
    success: true,
    message: 'Stock adjusted successfully',
    data: updatedItem,
  });
});

export const getLowStockAlerts = asyncHandler(async (req: Request, res: Response) => {
  const items = await prisma.inventoryItem.findMany({
    where: {
      OR: [
        { status: 'LOW_STOCK' },
        { status: 'OUT_OF_STOCK' },
      ],
    },
    orderBy: { quantity: 'asc' },
  });

  res.json({
    success: true,
    data: items,
  });
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const [total, inStock, lowStock, outOfStock, totalValue] = await Promise.all([
    prisma.inventoryItem.count(),
    prisma.inventoryItem.count({ where: { status: 'IN_STOCK' } }),
    prisma.inventoryItem.count({ where: { status: 'LOW_STOCK' } }),
    prisma.inventoryItem.count({ where: { status: 'OUT_OF_STOCK' } }),
    prisma.inventoryItem.aggregate({
      _sum: {
        quantity: true,
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      total,
      inStock,
      lowStock,
      outOfStock,
      totalItems: totalValue._sum.quantity || 0,
    },
  });
});
