import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('records', {
 id: text('id').primaryKey(), owner: text('owner').notNull(), kind: text('kind').notNull(),
 title: text('title').notNull(), content: text('content').notNull().default(''),
 tags: text('tags').notNull().default('[]'), data: text('data').notNull().default('{}'),
 date: text('date').notNull(), favorite: integer('favorite').notNull().default(0),
 deleted: integer('deleted').notNull().default(0), revision: integer('revision').notNull().default(1),
 updated: text('updated').notNull()
});
export const assets = sqliteTable('assets', {
 id: text('id').primaryKey(), owner: text('owner').notNull(), name: text('name').notNull(),
 type: text('type').notNull(), size: integer('size').notNull(), created: text('created').notNull()
});
export const preferences = sqliteTable('preferences', {
 owner: text('owner').primaryKey(), initialized: integer('initialized').notNull().default(0)
});

export const walls = sqliteTable('walls', {
 owner: text('owner').primaryKey(),
 doc: text('doc').notNull(),
 revision: integer('revision').notNull().default(1),
 updated: text('updated').notNull()
});

export const chronologies = sqliteTable('chronologies', {
 owner: text('owner').primaryKey(), doc: text('doc').notNull(),
 revision: integer('revision').notNull().default(1), updated: text('updated').notNull()
});
