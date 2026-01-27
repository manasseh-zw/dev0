import { relations } from 'drizzle-orm'
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const projectStatusEnum = pgEnum('project_status', [
  'PLANNING',
  'READY',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'ARCHIVED',
])

export const taskStatusEnum = pgEnum('task_status', [
  'PENDING',
  'RUNNING',
  'REVIEW',
  'DONE',
  'FAILED',
  'SKIPPED',
])

export const geminiModelEnum = pgEnum('gemini_model', [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
])

export const sandboxStatusEnum = pgEnum('sandbox_status', [
  'READY',
  'RUNNING',
  'STOPPED',
])

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    status: projectStatusEnum('status').default('PLANNING').notNull(),
    repoUrl: text('repo_url'),
    repoName: text('repo_name'),
    techStack: text('tech_stack').default('tanstack-start').notNull(),
    theme: text('theme').default('slate').notNull(),
    vibeInput: text('vibe_input'),
    specContent: text('spec_content'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('projects_status_idx').on(table.status)],
)

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    phase: integer('phase').default(1).notNull(),
    order: integer('order').default(0).notNull(),
    status: taskStatusEnum('status').default('PENDING').notNull(),
    geminiModel: geminiModelEnum('gemini_model')
      .default('gemini-3-pro-preview')
      .notNull(),
    dependencies: text('dependencies').array().notNull().default([]),
    prUrl: text('pr_url'),
    prNumber: integer('pr_number'),
    logs: jsonb('logs').$type<{}[] | null>(),
    attempts: integer('attempts').default(0).notNull(),
    maxAttempts: integer('max_attempts').default(3).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('tasks_project_idx').on(table.projectId),
    index('tasks_status_idx').on(table.status),
    index('tasks_project_phase_order_idx').on(
      table.projectId,
      table.phase,
      table.order,
    ),
  ],
)

export const sandboxes = pgTable(
  'sandboxes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    daytonaId: text('daytona_id').notNull().unique(),
    status: sandboxStatusEnum('status').default('READY').notNull(),
    taskId: uuid('task_id').unique(),
    snapshotId: text('snapshot_id'),
    publicUrl: text('public_url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('sandboxes_project_idx').on(table.projectId),
    index('sandboxes_status_idx').on(table.status),
  ],
)

export const projectRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
  sandboxes: many(sandboxes),
}))

export const taskRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  sandbox: one(sandboxes, {
    fields: [tasks.id],
    references: [sandboxes.taskId],
  }),
}))

export const sandboxRelations = relations(sandboxes, ({ one }) => ({
  project: one(projects, {
    fields: [sandboxes.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [sandboxes.taskId],
    references: [tasks.id],
  }),
}))
