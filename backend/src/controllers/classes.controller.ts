import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { z } from 'zod';

const createClassSchema = z.object({
  classId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  ageGroup: z.string().optional(),
  scheduleDescription: z.string().optional(),
  isRecurring: z.boolean().default(false),
  color: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  maxStudents: z.number().int().positive().optional(),
  instructorId: z.string().optional(),
});

const updateClassSchema = createClassSchema.partial().omit({ classId: true });

export const getAllClasses = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, ageGroup } = req.query as Record<string, string>;

  const where: any = {};
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (status) where.status = status;
  if (ageGroup) where.ageGroup = ageGroup;

  const classes = await prisma.class.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      instructor: { select: { id: true, name: true, specialization: true } },
      _count: { select: { enrollments: true } },
    },
  });

  res.json({ success: true, data: classes });
});

export const getClassById = asyncHandler(async (req: Request, res: Response) => {
  const cls = await prisma.class.findUnique({
    where: { id: req.params.id },
    include: {
      instructor: true,
      enrollments: {
        include: { student: { select: { id: true, name: true, email: true } } },
        orderBy: { registrationDate: 'desc' },
      },
      materialUsages: { orderBy: { sessionDate: 'desc' }, take: 10 },
      _count: { select: { enrollments: true, attendances: true } },
    },
  });
  if (!cls) throw new AppError(404, 'Class not found');
  res.json({ success: true, data: cls });
});

export const createClass = asyncHandler(async (req: Request, res: Response) => {
  const data = createClassSchema.parse(req.body);

  const existing = await prisma.class.findUnique({ where: { classId: data.classId } });
  if (existing) throw new AppError(409, 'Class with this ID already exists');

  const cls = await prisma.class.create({ data });
  res.status(201).json({ success: true, message: 'Class created', data: cls });
});

export const updateClass = asyncHandler(async (req: Request, res: Response) => {
  const data = updateClassSchema.parse(req.body);
  const existing = await prisma.class.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Class not found');

  const cls = await prisma.class.update({ where: { id: req.params.id }, data });
  res.json({ success: true, message: 'Class updated', data: cls });
});

export const deleteClass = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.class.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Class not found');

  await prisma.class.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Class deleted' });
});
