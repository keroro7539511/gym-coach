CREATE TABLE `coach_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`muscle_gain_steps_min` integer DEFAULT 5000 NOT NULL,
	`muscle_gain_steps_max` integer DEFAULT 7000 NOT NULL,
	`fat_loss_steps_min` integer DEFAULT 8000 NOT NULL,
	`fat_loss_steps_max` integer DEFAULT 12000 NOT NULL,
	`fitness_steps_min` integer DEFAULT 8000 NOT NULL,
	`fitness_steps_max` integer DEFAULT 10000 NOT NULL,
	`weight_adjust_pct` real DEFAULT 5 NOT NULL,
	`body_fat_warn_male` real DEFAULT 25 NOT NULL,
	`body_fat_warn_female` real DEFAULT 30 NOT NULL,
	`ai_diet_prompt_template` text,
	`ai_message_prompt_template` text,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`weekly_plan_id` integer NOT NULL,
	`date` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`is_class_day` integer DEFAULT false NOT NULL,
	`walking_steps_target` integer,
	`cardio_minutes_target` integer,
	`meal_breakfast` text,
	`meal_lunch` text,
	`meal_dinner` text,
	`meal_snacks` text,
	`water_target_ml` integer,
	`sleep_target_hours_min` integer,
	`sleep_target_hours_max` integer,
	`extra_exercises` text,
	`coach_message` text,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`weekly_plan_id`) REFERENCES `weekly_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `weekly_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`source_session_id` integer NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`coach_overall_message` text,
	`pdf_path` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`generated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
