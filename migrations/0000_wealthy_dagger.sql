CREATE TABLE "verification_table" (
	"id" varchar PRIMARY KEY NOT NULL,
	"verification_level" integer DEFAULT 0 NOT NULL,
	"query_count" integer DEFAULT 0 NOT NULL,
	"verification_priority" integer DEFAULT 0 NOT NULL,
	"common_query" text
);
