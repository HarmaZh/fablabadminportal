import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { z } from 'zod';

const createAttendanceSchema = z.object({
  studentId: z.string().min(1),
  classId: z.string().min(1),
  date: z.string().datetime(),
  status: z.enum(['present', 'late', 'absent']).default('present'),
  notes: z.string().optional(),
});

const updateAttendanceSchema = z.object({
  status: z.enum(['present', 'late', 'absent']),
  notes: z.string().optional(),
});

export const getAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { classId, studentId, date, page = '1', limit = '50' } = req.query as Record<string, string>;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (classId) where.classId = classId;
  if (studentId) where.studentId = studentId;
  if (date) {
    const day = new Date(date);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    where.date = { gte: day, lt: next };
  }

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { date: 'desc' },
      include: {
        student: { select: { id: true, studentId: true, name: true } },
        class: { select: { id: true, name: true } },
      },
    }),
    prisma.attendance.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      records,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    },
  });
});

export const createAttendance = asyncHandler(async (req: Request, res: Response) => {
  const data = createAttendanceSchema.parse(req.body);

  const [student, cls] = await Promise.all([
    prisma.student.findUnique({ where: { id: data.studentId } }),
    prisma.class.findUnique({ where: { id: data.classId } }),
  ]);
  if (!student) throw new AppError(404, 'Student not found');
  if (!cls) throw new AppError(404, 'Class not found');

  const record = await prisma.attendance.create({
    data: { ...data, date: new Date(data.date) },
    include: {
      student: { select: { id: true, studentId: true, name: true } },
      class: { select: { id: true, name: true } },
    },
  });

  res.status(201).json({ success: true, message: 'Attendance recorded', data: record });
});

export const updateAttendance = asyncHandler(async (req: Request, res: Response) => {
  const data = updateAttendanceSchema.parse(req.body);
  const existing = await prisma.attendance.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError(404, 'Attendance record not found');

  const record = await prisma.attendance.update({ where: { id: req.params.id }, data });
  res.json({ success: true, message: 'Attendance updated', data: record });
});
