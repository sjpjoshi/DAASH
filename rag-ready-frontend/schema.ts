import { integer, pgTable, varchar, text } from 'drizzle-orm/pg-core';

export const verificationTable = pgTable('verification_table', {
  id: varchar('id').primaryKey(),
  verificationLevel: integer('verification_level')
    .notNull()
    .default(0),
  queryCount: integer('query_count')
    .notNull()
    .default(0),
  verificationPriority: integer('verification_priority')
    .notNull()
    .default(0),
  commonQuery: text('common_query'),
});

export type InsertDocument = typeof verificationTable.$inferInsert;
export type SelectDocument = typeof verificationTable.$inferSelect;
