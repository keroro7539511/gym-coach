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
  goal: text("goal", {
    enum: ["muscle_gain", "fat_loss", "fitness", "custom"],
  }).notNull(),
  customGoal: text("custom_goal"),
  weeklyClassCount: integer("weekly_class_count").notNull(),
  weeklyGymCount: integer("weekly_gym_count").notNull(),
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
