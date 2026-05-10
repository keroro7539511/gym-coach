import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const students = sqliteTable("students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  coachId: integer("coach_id").notNull().default(1),
  name: text("name").notNull(),
  gender: text("gender", { enum: ["M", "F"] }).notNull(),
  birthday: text("birthday"), // ISO date string
  phone: text("phone"),
  email: text("email"),
  goal: text("goal", { mode: "json" }).$type<string[]>().notNull(),
  customGoal: text("custom_goal"),
  weeklyClassCount: integer("weekly_class_count").notNull(),
  weeklyGymCount: integer("weekly_gym_count").notNull(),
  dietaryRestrictions: text("dietary_restrictions"),
  notes: text("notes"),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const inbodyRecords = sqliteTable("inbody_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id),
  measuredAt: text("measured_at").notNull(),

  // 身體基本
  weightKg: real("weight_kg"),
  bodyFatPct: real("body_fat_pct"),
  skeletalMuscleKg: real("skeletal_muscle_kg"),
  bodyFatKg: real("body_fat_kg"),
  visceralFatLevel: real("visceral_fat_level"),
  bodyAge: real("body_age"),
  bmi: real("bmi"),

  // 代謝
  bmrKcal: real("bmr_kcal"),
  totalWaterL: real("total_water_l"),
  proteinKg: real("protein_kg"),

  // 部位肌肉
  muscleLeftArm: real("muscle_left_arm"),
  muscleRightArm: real("muscle_right_arm"),
  muscleTrunk: real("muscle_trunk"),
  muscleLeftLeg: real("muscle_left_leg"),
  muscleRightLeg: real("muscle_right_leg"),

  // 部位體脂
  fatLeftArm: real("fat_left_arm"),
  fatRightArm: real("fat_right_arm"),
  fatTrunk: real("fat_trunk"),
  fatLeftLeg: real("fat_left_leg"),
  fatRightLeg: real("fat_right_leg"),

  coachNotes: text("coach_notes"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type InBodyRecord = typeof inbodyRecords.$inferSelect;
export type NewInBodyRecord = typeof inbodyRecords.$inferInsert;

// ─── 訓練課相關 ─────────────────────────────────────────

export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  muscleGroup: text("muscle_group", {
    enum: ["chest", "back", "legs", "shoulder", "arm", "core", "small_muscles"],
  }).notNull(),
  equipment: text("equipment"),
  demoImageUrl: text("demo_image_url"),
  description: text("description"),
  isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
  wgerId: integer("wger_id"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id),
  sessionNumber: integer("session_number").notNull(), // 該學員的流水號
  scheduledAt: text("scheduled_at"),
  startedAt: text("started_at"),
  endedAt: text("ended_at"),
  targetMuscleGroups: text("target_muscle_groups", { mode: "json" })
    .$type<string[]>()
    .notNull(),
  status: text("status", {
    enum: ["scheduled", "in_progress", "completed"],
  })
    .notNull()
    .default("scheduled"),
  coachNotes: text("coach_notes"),
  nextSessionDate: text("next_session_date"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const sessionExercises = sqliteTable("session_exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id),
  orderIndex: integer("order_index").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const setLogs = sqliteTable("set_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionExerciseId: integer("session_exercise_id")
    .notNull()
    .references(() => sessionExercises.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  weightKg: real("weight_kg"),
  reps: integer("reps"),
  rpe: integer("rpe"), // 1-10
  toFailure: integer("to_failure", { mode: "boolean" }).notNull().default(false),
  heartRateBpm: integer("heart_rate_bpm"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type SessionExercise = typeof sessionExercises.$inferSelect;
export type NewSessionExercise = typeof sessionExercises.$inferInsert;
export type SetLog = typeof setLogs.$inferSelect;
export type NewSetLog = typeof setLogs.$inferInsert;

// ─── 週計劃相關 ─────────────────────────────────────────

export const weeklyPlans = sqliteTable("weekly_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id),
  sourceSessionId: integer("source_session_id")
    .notNull()
    .references(() => sessions.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  coachOverallMessage: text("coach_overall_message"),
  pdfPath: text("pdf_path"),
  status: text("status", { enum: ["draft", "approved"] })
    .notNull()
    .default("draft"),
  generatedAt: text("generated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const dailyPlans = sqliteTable("daily_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weeklyPlanId: integer("weekly_plan_id")
    .notNull()
    .references(() => weeklyPlans.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sun ... 6=Sat
  isClassDay: integer("is_class_day", { mode: "boolean" }).notNull().default(false),
  isGymDay: integer("is_gym_day", { mode: "boolean" }).notNull().default(false),
  walkingStepsTarget: integer("walking_steps_target"),
  cardioMinutesTarget: integer("cardio_minutes_target"),
  mealBreakfast: text("meal_breakfast"),
  mealLunch: text("meal_lunch"),
  mealDinner: text("meal_dinner"),
  mealSnacks: text("meal_snacks"),
  waterTargetMl: integer("water_target_ml"),
  sleepTargetHoursMin: integer("sleep_target_hours_min"),
  sleepTargetHoursMax: integer("sleep_target_hours_max"),
  nutritionCaloriesKcal: integer("nutrition_calories_kcal"),
  nutritionProteinG: integer("nutrition_protein_g"),
  nutritionCarbsG: integer("nutrition_carbs_g"),
  nutritionFatG: integer("nutrition_fat_g"),
  nutritionFiberG: integer("nutrition_fiber_g"),
  gymWorkout: text("gym_workout", { mode: "json" }).$type<
    { muscleGroup: string; sets: number; reps: number; weightKg: number | null; restSeconds: number; notes: string | null }[]
  >(),
  extraExercises: text("extra_exercises", { mode: "json" }).$type<
    { exerciseId: number | null; name: string; sets: number; reps: number }[]
  >(),
  coachMessage: text("coach_message"),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const coachSettings = sqliteTable("coach_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // 規則參數
  muscleGainStepsMin: integer("muscle_gain_steps_min").notNull().default(5000),
  muscleGainStepsMax: integer("muscle_gain_steps_max").notNull().default(7000),
  fatLossStepsMin: integer("fat_loss_steps_min").notNull().default(8000),
  fatLossStepsMax: integer("fat_loss_steps_max").notNull().default(12000),
  fitnessStepsMin: integer("fitness_steps_min").notNull().default(8000),
  fitnessStepsMax: integer("fitness_steps_max").notNull().default(10000),
  weightAdjustPct: real("weight_adjust_pct").notNull().default(5),
  bodyFatWarnMale: real("body_fat_warn_male").notNull().default(25),
  bodyFatWarnFemale: real("body_fat_warn_female").notNull().default(30),
  // AI prompts
  aiDietPromptTemplate: text("ai_diet_prompt_template"),
  aiMessagePromptTemplate: text("ai_message_prompt_template"),
  // AI 金鑰（儲存於 DB，不需寫在 .env）
  geminiApiKey: text("gemini_api_key"),
  // 教練帳號
  passwordHash: text("password_hash"),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── 認證相關 ─────────────────────────────────────────

export const coachAccounts = sqliteTable("coach_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  displayName: text("display_name"),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const studentAccounts = sqliteTable("student_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .unique()
    .references(() => students.id),
  passwordHash: text("password_hash").notNull(),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const pairingTokens = sqliteTable("pairing_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export type WeeklyPlan = typeof weeklyPlans.$inferSelect;
export type NewWeeklyPlan = typeof weeklyPlans.$inferInsert;
export type DailyPlan = typeof dailyPlans.$inferSelect;
export type NewDailyPlan = typeof dailyPlans.$inferInsert;
export type CoachSettings = typeof coachSettings.$inferSelect;
export type CoachAccount = typeof coachAccounts.$inferSelect;
export type StudentAccount = typeof studentAccounts.$inferSelect;
export type PairingToken = typeof pairingTokens.$inferSelect;
