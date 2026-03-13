import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { z } from 'zod';

const createStaffSchema = z.object({
  staffId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['INSTRUCTOR', 'ADMIN', 'COORDINATOR', 'VOLUNTEER']).default('INSTRUCTOR'),
  specialization: z.string().optional(),
  phone: z.string().optional(),
  active: z.boolean().default(true),
});

const updateStaffSchema = createStaffSchema.partial().omit({ staffId: true });

export const getAllStaff = asyncHandler(async (req: Request, res: Response) => {
  const { search, role, active } = req.query as Record<string, string>;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = role;
  if (active !== undefined) where.active = active === 'true';

  const staff = await prisma.staff.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { classes: true } },
    },
  });

  res.json({ success: true, data: staff });
});

export const getStaffById = asyncHandler(async (req: Request, res: Response) => {
  const member = await prisma.staff.findUnique({
    where: { id: req.params.id },
    include: {
      classes: { select: { id: true, name: true, status: true, ageGroup: true } },
    },
  });
  if (!member) throw new AppError(404, 'Staff member not found');
  res.json({ success: true, data: member });
});

export const createStaff = asyncHandler(async (req: Request, res: Response) => {
  const data = createStaffSchema.parse(req.body);

  const existing = await prisma.staff.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError(409, 'Staff member with this email already exists');

  const member = await prisma.staff.create({ data });
  res.status(201).json({ success: true, message: 'Staff member created', data: member });
});

export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
  const data = updateStaffSchema.parse(req.body);
  const existing = await prisma.staff.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Staff member not found');

  const member = await prisma.staff.update({ where: { id: req.params.id }, data });
  res.json({ success: true, message: 'Staff member updated', data: member });
});

export const deleteStaff = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.staff.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Staff member not found');

  await prisma.staff.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Staff member deleted' });
});
