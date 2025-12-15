import { pgTable, uuid, text, varchar, timestamp, integer, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users Table
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User Details Table
export const userDetails = pgTable('user_details', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    role: varchar('role', { length: 255 }).notNull(),
    description: text('description').notNull(),
    socialMedias: json('social_medias').$type<string[]>().notNull().default([]),
    profilePhoto: text('profile_photo'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Skills Table
export const skills = pgTable('skills', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    icon: text('icon').notNull(), // URL to image hosting
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Experience Table
export const experience = pgTable('experience', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    startYear: integer('start_year').notNull(),
    endYear: integer('end_year'), // null means currently employed
    companyName: varchar('company_name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    location: varchar('location', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Education Table
export const education = pgTable('education', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    year: varchar('year', { length: 50 }).notNull(), // e.g., "2001-2008"
    institutionName: varchar('institution_name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Certifications Table
export const certifications = pgTable('certifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    issuingOrganization: varchar('issuing_organization', { length: 255 }).notNull(),
    year: integer('year').notNull(),
    description: text('description').notNull(),
    certificateLink: text('certificate_link'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Projects Table (Medium-style articles)
export const projects = pgTable('projects', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description').notNull(),
    content: text('content').notNull(), // Rich text/markdown content
    coverImage: text('cover_image'), // URL to image hosting
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Junction Tables for Many-to-Many Relationships

// Experience-Skills Junction Table
export const experienceSkills = pgTable('experience_skills', {
    id: uuid('id').defaultRandom().primaryKey(),
    experienceId: uuid('experience_id').notNull().references(() => experience.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id').notNull().references(() => skills.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Certification-Skills Junction Table
export const certificationSkills = pgTable('certification_skills', {
    id: uuid('id').defaultRandom().primaryKey(),
    certificationId: uuid('certification_id').notNull().references(() => certifications.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id').notNull().references(() => skills.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Project-Skills Junction Table
export const projectSkills = pgTable('project_skills', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id').notNull().references(() => skills.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations

export const experienceRelations = relations(experience, ({ many }) => ({
    experienceSkills: many(experienceSkills),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
    experienceSkills: many(experienceSkills),
    certificationSkills: many(certificationSkills),
    projectSkills: many(projectSkills),
}));

export const experienceSkillsRelations = relations(experienceSkills, ({ one }) => ({
    experience: one(experience, {
        fields: [experienceSkills.experienceId],
        references: [experience.id],
    }),
    skill: one(skills, {
        fields: [experienceSkills.skillId],
        references: [skills.id],
    }),
}));

export const certificationsRelations = relations(certifications, ({ many }) => ({
    certificationSkills: many(certificationSkills),
}));

export const certificationSkillsRelations = relations(certificationSkills, ({ one }) => ({
    certification: one(certifications, {
        fields: [certificationSkills.certificationId],
        references: [certifications.id],
    }),
    skill: one(skills, {
        fields: [certificationSkills.skillId],
        references: [skills.id],
    }),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
    projectSkills: many(projectSkills),
}));

export const projectSkillsRelations = relations(projectSkills, ({ one }) => ({
    project: one(projects, {
        fields: [projectSkills.projectId],
        references: [projects.id],
    }),
    skill: one(skills, {
        fields: [projectSkills.skillId],
        references: [skills.id],
    }),
}));
