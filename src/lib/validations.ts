import { z } from 'zod';

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(3, 'Non konplè a dwe gen omwen 3 lèt')
      .max(100, 'Non an twò long'),
    email: z
      .string()
      .email('Tanpri mete yon adrès imèl ki valab'),
    password: z
      .string()
      .min(6, 'Modpas la dwe gen omwen 6 karaktè'),
    confirm_password: z
      .string()
      .min(6, 'Tanpri konfime modpas la'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'De modpas yo pa koresponn',
    path: ['confirm_password'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Tanpri mete yon adrès imèl ki valab'),
  password: z.string().min(1, 'Tanpri antre modpas ou'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const contributionSchema = z.object({
  work_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanpri chwazi yon dat travay ki valab'),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanpri chwazi yon dat peman ki valab'),
  amount_centavos: z
    .number()
    .int('Montan an dwe yon chif antye')
    .min(1, 'Montan kontribisyon an dwe siperyè a zewo.'),
  payment_method: z.enum(['PIX', 'Espès', 'Transfè', 'Lòt'], {
    message: 'Tanpri chwazi yon metòd peman valab',
  }),
  transaction_ref: z.string().max(100).optional(),
  receipt_url: z.string().optional(),
  note: z.string().max(500, 'Nòt la pa ka depase 500 karaktè').optional(),
});

export type ContributionInput = z.infer<typeof contributionSchema>;

export const rejectSubmissionSchema = z.object({
  rejection_reason: z
    .string()
    .min(5, 'Rezon refi a dwe gen omwen 5 karaktè pou enfòme chofè a')
    .max(500, 'Rezon an twò long'),
});

export type RejectSubmissionInput = z.infer<typeof rejectSubmissionSchema>;
