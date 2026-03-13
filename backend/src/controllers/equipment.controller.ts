import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { z } from 'zod';

const createEquipmentSchema = z.object({
  equipmentId: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(['3D_PRINTER', 'LASER', 'DRONE', 'ROBOTICS', 'ELECTRONICS', 'OTHER']),
  status: z.enum(['OPERATIONAL', 'MAINTENANCE', 'OUT_OF_SERVICE']).default('OPERATIONAL'),
  lastMaintenance: z.string().datetime().optional().nullable(),
  nextMaintenance: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
});

const updateEquipmentSchema = createEquipmentSchema.partial().omit({ equipmentId: true });

const statusUpdateSchema = z.object({
  status: z.enum(['OPERATIONAL', 'MAINTENANCE', 'OUT_OF_SERVICE']),
  notes: z.string().optional(),
});

export const getAllEquipment = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, category } = req.query as Record<string, string>;

  const where: any = {};
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (status) where.status = status;
  if (category) where.category = category;

  const equipment = await prisma.equipment.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  res.json({ success: true, data: equipment });
});

export const getEquipmentById = asyncHandler(async (req: Request, res: Response) => {
  const item = await prisma.equipment.findUnique({ where: { id: req.params.id } });
  if (!item) throw new AppError(404, 'Equipment not found');
  res.json({ success: true, data: item });
});

export const createEquipment = asyncHandler(async (req: Request, res: Response) => {
  const data = createEquipmentSchema.parse(req.body);

  const existing = await prisma.equipment.findUnique({ where: { equipmentId: data.equipmentId } });
  if (existing) throw new AppError(409, 'Equipment with this ID already exists');

  const item = await prisma.equipment.create({
    data: {
      ...data,
      lastMaintenance: data.lastMaintenance ? new Date(data.lastMaintenance) : null,
      nextMaintenance: data.nextMaintenance ? new Date(data.nextMaintenance) : null,
    },
  });
  res.status(201).json({ success: true, message: 'Equipment created', data: item });
});

export const updateEquipment = asyncHandler(async (req: Request, res: Response) => {
  const data = updateEquipmentSchema.parse(req.body);
  const existing = await prisma.equipment.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Equipment not found');

  const item = await prisma.equipment.update({
    where: { id: req.params.id },
    data: {
      ...data,
      lastMaintenance: data.lastMaintenance ? new Date(data.lastMaintenance) : undefined,
      nextMaintenance: data.nextMaintenance ? new Date(data.nextMaintenance) : undefined,
    },
  });
  res.json({ success: true, message: 'Equipment updated', data: item });
});

export const updateEquipmentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, notes } = statusUpdateSchema.parse(req.body);
  const existing = await prisma.equipment.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Equipment not found');

  const item = await prisma.equipment.update({
    where: { id: req.params.id },
    data: {
      status,
      notes: notes ?? existing.notes,
      lastMaintenance: status === 'OPERATIONAL' ? new Date() : existing.lastMaintenance,
    },
  });
  res.json({ success: true, message: 'Status updated', data: item });
});

export const deleteEquipment = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.equipment.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Equipment not found');

  await prisma.equipment.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Equipment deleted' });
});
