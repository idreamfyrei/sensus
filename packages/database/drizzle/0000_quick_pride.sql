CREATE TYPE "public"."theme_key" AS ENUM('default', 'pixel', 'glitch', 'terminal', 'brutalist', 'glassmorphism', 'bauhaus', 'museum', 'vaporwave', 'nature_minimal', 'anime');--> statement-breakpoint
CREATE TYPE "public"."form_layout" AS ENUM('one_per_screen', 'single_page');--> statement-breakpoint
CREATE TYPE "public"."form_status" AS ENUM('draft', 'published', 'unpublished', 'archived');--> statement-breakpoint
CREATE TYPE "public"."form_visibility" AS ENUM('public', 'unlisted', 'invite_only');--> statement-breakpoint
CREATE TYPE "public"."field_type" AS ENUM('short_text', 'long_text', 'email', 'number', 'single_select', 'multi_select', 'checkbox', 'dropdown', 'rating', 'date');--> statement-breakpoint
CREATE TYPE "public"."condition_action" AS ENUM('show', 'hide', 'require', 'jump_to');--> statement-breakpoint
CREATE TYPE "public"."condition_operator" AS ENUM('eq', 'neq', 'contains', 'gt', 'lt', 'empty', 'not_empty');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('pending', 'sent', 'opened', 'submitted');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" "theme_key" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"bg" text NOT NULL,
	"surface" text NOT NULL,
	"primary" text NOT NULL,
	"accent" text NOT NULL,
	"text_color" text NOT NULL,
	"muted" text NOT NULL,
	"border_style" text NOT NULL,
	"border_radius" text NOT NULL,
	"font_heading" text NOT NULL,
	"font_body" text NOT NULL,
	"effects" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_seeded" boolean DEFAULT false NOT NULL,
	CONSTRAINT "themes_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"slug" varchar(280) NOT NULL,
	"slug_is_custom" boolean DEFAULT false NOT NULL,
	"status" "form_status" DEFAULT 'draft' NOT NULL,
	"visibility" "form_visibility" DEFAULT 'public' NOT NULL,
	"layout" "form_layout" DEFAULT 'one_per_screen' NOT NULL,
	"theme_id" uuid NOT NULL,
	"logo_url" text,
	"cover_image_url" text,
	"password_hash" text,
	"expires_at" timestamp,
	"max_responses" integer,
	"is_template" boolean DEFAULT false NOT NULL,
	"one_response_per_email" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "form_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"title" text,
	"description" text,
	"page_break_before" boolean DEFAULT false NOT NULL,
	"show_intro_screen" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "form_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"type" "field_type" NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"placeholder" text,
	"order" integer NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"min_length" integer,
	"max_length" integer,
	"min" integer,
	"max" integer,
	"pattern" text,
	"is_integer" boolean,
	"include_time" boolean,
	"max_rating" integer,
	"min_selected" integer,
	"max_selected" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "field_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "field_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"source_field_id" uuid NOT NULL,
	"operator" "condition_operator" NOT NULL,
	"value" text,
	"action" "condition_action" NOT NULL,
	"target_field_id" uuid,
	"target_section_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "field_conditions_target_xor" CHECK (("field_conditions"."target_field_id" IS NOT NULL AND "field_conditions"."target_section_id" IS NULL)
         OR ("field_conditions"."target_field_id" IS NULL AND "field_conditions"."target_section_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "response_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"form_field_id" uuid NOT NULL,
	"value_text" text,
	"value_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "form_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "invite_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"cloudinary_url" text NOT NULL,
	"original_filename" text NOT NULL,
	"total_count" integer NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "form_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"batch_id" uuid,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"opened_at" timestamp,
	"submitted_at" timestamp,
	"response_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "response_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invite_id" uuid,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_sections" ADD CONSTRAINT "form_sections_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_section_id_form_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."form_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_options" ADD CONSTRAINT "field_options_field_id_form_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."form_fields"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_conditions" ADD CONSTRAINT "field_conditions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_conditions" ADD CONSTRAINT "field_conditions_source_field_id_form_fields_id_fk" FOREIGN KEY ("source_field_id") REFERENCES "public"."form_fields"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_conditions" ADD CONSTRAINT "field_conditions_target_field_id_form_fields_id_fk" FOREIGN KEY ("target_field_id") REFERENCES "public"."form_fields"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_conditions" ADD CONSTRAINT "field_conditions_target_section_id_form_sections_id_fk" FOREIGN KEY ("target_section_id") REFERENCES "public"."form_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_answers" ADD CONSTRAINT "response_answers_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_answers" ADD CONSTRAINT "response_answers_form_field_id_form_fields_id_fk" FOREIGN KEY ("form_field_id") REFERENCES "public"."form_fields"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_views" ADD CONSTRAINT "form_views_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_batches" ADD CONSTRAINT "invite_batches_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_invites" ADD CONSTRAINT "form_invites_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_invites" ADD CONSTRAINT "form_invites_batch_id_invite_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."invite_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_invites" ADD CONSTRAINT "form_invites_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_drafts" ADD CONSTRAINT "response_drafts_invite_id_form_invites_id_fk" FOREIGN KEY ("invite_id") REFERENCES "public"."form_invites"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique" ON "user" USING btree ("email") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "user_deleted_at_idx" ON "user" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "forms_user_id_idx" ON "forms" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "forms_slug_unique" ON "forms" USING btree ("slug") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "forms_status_visibility_idx" ON "forms" USING btree ("status","visibility");--> statement-breakpoint
CREATE INDEX "forms_user_deleted_idx" ON "forms" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "form_sections_form_order_idx" ON "form_sections" USING btree ("form_id","order");--> statement-breakpoint
CREATE INDEX "form_fields_form_order_idx" ON "form_fields" USING btree ("form_id","order");--> statement-breakpoint
CREATE INDEX "form_fields_section_order_idx" ON "form_fields" USING btree ("section_id","order");--> statement-breakpoint
CREATE INDEX "field_options_field_order_idx" ON "field_options" USING btree ("field_id","order");--> statement-breakpoint
CREATE INDEX "field_conditions_form_source_idx" ON "field_conditions" USING btree ("form_id","source_field_id");--> statement-breakpoint
CREATE INDEX "field_conditions_target_field_idx" ON "field_conditions" USING btree ("target_field_id");--> statement-breakpoint
CREATE INDEX "field_conditions_target_section_idx" ON "field_conditions" USING btree ("target_section_id");--> statement-breakpoint
CREATE INDEX "responses_form_submitted_idx" ON "responses" USING btree ("form_id","submitted_at");--> statement-breakpoint
CREATE INDEX "response_answers_response_idx" ON "response_answers" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "response_answers_form_field_idx" ON "response_answers" USING btree ("form_field_id");--> statement-breakpoint
CREATE INDEX "form_views_form_viewed_idx" ON "form_views" USING btree ("form_id","viewed_at");--> statement-breakpoint
CREATE INDEX "invite_batches_form_created_idx" ON "invite_batches" USING btree ("form_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "form_invites_token_hash_unique" ON "form_invites" USING btree ("token_hash") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "form_invites_form_email_idx" ON "form_invites" USING btree ("form_id","email");--> statement-breakpoint
CREATE INDEX "form_invites_form_status_idx" ON "form_invites" USING btree ("form_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "response_drafts_invite_unique" ON "response_drafts" USING btree ("invite_id") WHERE deleted_at IS NULL AND invite_id IS NOT NULL;