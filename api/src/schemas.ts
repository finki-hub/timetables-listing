import { z } from 'zod';

/* eslint-disable camelcase -- EduPage response fields are snake_case. */

const idValueSchema = z.union([z.number(), z.string()]);
const stringArraySchema = z.array(idValueSchema).optional();

export const timetableIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/u, 'Invalid timetable ID'),
});

export const timetableListingResponseSchema = z.object({
  r: z.object({
    regular: z.object({
      timetables: z.array(
        z.object({
          datefrom: z.string(),
          hidden: z.boolean(),
          text: z.string(),
          tt_num: idValueSchema,
          year: z.coerce.number(),
        }),
      ),
    }),
  }),
});

export const upstreamErrorResponseSchema = z.object({
  r: z.object({
    error: z.string(),
  }),
});

export const tableSchema = z.object({
  data_rows: z
    .union([z.array(z.unknown()), z.record(z.string(), z.unknown())])
    .optional(),
  id: z.string(),
});

export const timetableTablesSchema = z.array(tableSchema);

export const rawCardSchema = z.object({
  classroomids: stringArraySchema,
  days: z.coerce.string(),
  id: idValueSchema,
  lessonid: idValueSchema,
  period: idValueSchema,
  weeks: z.coerce.string().optional(),
});

export const rawClassSchema = z.object({
  id: idValueSchema,
  name: z.string().optional(),
  short: z.string().optional(),
});

export const rawClassroomSchema = rawClassSchema;

export const rawGroupSchema = z.object({
  classid: idValueSchema.optional(),
  entireclass: z.boolean().optional(),
  id: idValueSchema,
  name: z.string().optional(),
});

export const rawLessonSchema = z.object({
  classids: stringArraySchema,
  durationperiods: z.coerce.number().optional(),
  groupids: stringArraySchema,
  groupnames: z.array(z.string()).optional(),
  id: idValueSchema,
  subjectid: idValueSchema,
  teacherids: stringArraySchema,
  weeks: z.coerce.string().optional(),
});

export const rawPeriodSchema = z.object({
  endtime: z.string(),
  id: idValueSchema,
  name: z.string().optional(),
  period: z.coerce.number(),
  short: z.string().optional(),
  starttime: z.string(),
});

export const rawSubjectSchema = rawClassSchema;
export const rawTeacherSchema = rawClassSchema.extend({
  firstname: z.string().optional(),
  lastname: z.string().optional(),
});

export type RawCard = z.infer<typeof rawCardSchema>;
export type RawEntity = z.infer<typeof rawClassSchema>;
export type RawGroup = z.infer<typeof rawGroupSchema>;
export type RawLesson = z.infer<typeof rawLessonSchema>;
export type RawPeriod = z.infer<typeof rawPeriodSchema>;
export type RawTeacher = z.infer<typeof rawTeacherSchema>;

/* eslint-enable camelcase -- Re-enable after EduPage schema definitions. */
