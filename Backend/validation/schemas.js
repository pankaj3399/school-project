import { z } from 'zod';

// Auth validation
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["Admin", "Teacher", "Student"])
  })
});

// Student validation
export const addStudentSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").trim(),
    email: z.string().email("Invalid email format").toLowerCase().trim(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    standard: z.string().min(1, "Standard is required"),
    grade: z.string().min(1, "Grade is required"),
    parentEmail: z.string().email("Invalid parent email").optional().nullable(),
    sendNotifications: z.boolean().default(false),
    guardian1: z.object({
      name: z.string().min(1, "Guardian name is required"),
      email: z.string().email("Invalid guardian email").optional().nullable()
    }).optional().nullable()
  })
});

export const updateStudentSchema = z.object({
  body: z.object({
    name: z.string().min(2).trim().optional(),
    email: z.string().email().toLowerCase().trim().optional(),
    standard: z.string().optional(),
    grade: z.string().optional(),
    parentEmail: z.string().email().optional().nullable(),
    sendNotifications: z.boolean().optional()
  })
});

// Teacher validation
export const addTeacherSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format").toLowerCase().trim(),
    type: z.enum(["Lead", "Special"], {
      required_error: "Teacher type is required"
    }),
    grade: z.string().optional().nullable(),
    recieveMails: z.boolean().default(false)
  }).refine(
    (data) => data.type !== "Lead" || data.grade, 
    {
      message: "Grade is required for Lead teachers",
      path: ["grade"]
    }
  )
});

export const updateTeacherSchema = z.object({
  body: z.object({
    name: z.string().min(2).trim().optional(),
    email: z.string().email().toLowerCase().trim().optional(),
    subject: z.string().min(2).optional().nullable(),
    type: z.enum(["Lead", "Special"]).optional(),
    grade: z.string().optional().nullable(),
    recieveMails: z.boolean().optional()
  })
});

// Form submission validation
export const submitFormSchema = z.object({
  body: z.object({
    answers: z.array(z.object({
      questionId: z.string(),
      answer: z.any(),
      points: z.number()
    })),
    submittedFor: z.string(),
    submittedAt: z.date().optional()
  })
});
