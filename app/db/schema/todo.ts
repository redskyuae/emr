import { boolean, integer, pgTable, text, varchar } from "drizzle-orm/pg-core";

export const todoTable = pgTable("todo", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull().default(""),
  isCompleted: boolean("is_completed").notNull().default(false),
});
