import { z } from "zod";

export const studentInputSchema = z
  .object({
    name: z.string().min(1, "姓名必填"),
    gender: z.enum(["M", "F"]),
    birthday: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    goal: z.array(z.enum(["muscle_gain", "fat_loss", "fitness", "custom"])).min(1, "請至少選一個目標"),
    customGoal: z.string().optional(),
    weeklyClassCount: z.number().int().min(0).max(7),
    weeklyGymCount: z.number().int().min(0).max(7),
    dietaryRestrictions: z.string().optional(),
    notes: z.string().optional(),
    // 建立時選填：同步建立學員登入帳號
    initialPassword: z.string().min(4, "密碼至少 4 個字元").optional().or(z.literal("")),
  })
  .refine(
    (data) => !data.goal.includes("custom") || !!data.customGoal?.trim(),
    {
      message: "選擇『其他』時必須填入自訂目標",
      path: ["customGoal"],
    }
  );

export type StudentInput = z.infer<typeof studentInputSchema>;
