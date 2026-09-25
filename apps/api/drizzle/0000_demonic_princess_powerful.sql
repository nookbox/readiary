CREATE TABLE "book_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"round" integer DEFAULT 1 NOT NULL,
	"status" varchar(20) DEFAULT 'want' NOT NULL,
	"rating" smallint,
	"content" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "book_reports_user_book_round_uq" UNIQUE("user_id","book_id","round"),
	CONSTRAINT "book_reports_round_positive" CHECK ("book_reports"."round" >= 1),
	CONSTRAINT "book_reports_rating_range" CHECK ("book_reports"."rating" IS NULL OR "book_reports"."rating" BETWEEN 1 AND 5),
	CONSTRAINT "book_reports_status_allowed" CHECK ("book_reports"."status" IN ('want', 'reading', 'done', 'dropped'))
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"isbn13" varchar(13),
	"title" varchar(500) NOT NULL,
	"author" varchar(300),
	"publisher" varchar(200),
	"cover_url" text,
	"page_count" integer,
	"published_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "books_isbn13_unique" UNIQUE("isbn13"),
	CONSTRAINT "books_isbn13_format" CHECK ("books"."isbn13" IS NULL OR "books"."isbn13" ~ '^97[89][0-9]{10}$')
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idp_sub" varchar(255) NOT NULL,
	"display_name" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_idpSub_unique" UNIQUE("idp_sub")
);
--> statement-breakpoint
ALTER TABLE "book_reports" ADD CONSTRAINT "book_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_reports" ADD CONSTRAINT "book_reports_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "book_reports_user_status_idx" ON "book_reports" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "books_title_idx" ON "books" USING btree ("title");