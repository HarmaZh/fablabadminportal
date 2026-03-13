import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { z } from 'zod';

const createStudentSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  parentName: z.string().optional(),
  ageGroup: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

const updateStudentSchema = createStudentSchema.partial().omit({ studentId: true });

export const getAllStudents = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, ageGroup, page = '1', limit = '50' } = req.query as Record<string, string>;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (status) where.status = status;
  if (ageGroup) where.ageGroup = ageGroup;

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        enrollments: {
          include: { class: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.student.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      students,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    },
  });
});

export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  const student = await prisma.student.findUnique({
    where: { id: req.params.id },
    include: {
      enrollments: { include: { class: true } },
      attendances: { orderBy: { date: 'desc' }, take: 20 },
    },
  });
  if (!student) throw new AppError(404, 'Student not found');
  res.json({ success: true, data: student });
});

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const data = createStudentSchema.parse(req.body);

  const existing = await prisma.student.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError(409, 'Student with this email already exists');

  const student = await prisma.student.create({ data });
  res.status(201).json({ success: true, message: 'Student created', data: student });
});

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const data = updateStudentSchema.parse(req.body);
  const existing = await prisma.student.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Student not found');

  const student = await prisma.student.update({ where: { id: req.params.id }, data });
  res.json({ success: true, message: 'Student updated', data: student });
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.student.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Student not found');

  await prisma.student.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Student deleted' });
});
