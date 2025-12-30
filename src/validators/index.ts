import { z } from 'zod';

// User Details Validation
export const userDetailsSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    role: z.string().min(1, 'Role is required').max(255),
    description: z.string().optional().nullable(),
    socialMedias: z.array(z.string()).optional().nullable(),
    profilePhoto: z.string().optional().nullable(),
});

export type UserDetailsInput = z.infer<typeof userDetailsSchema>;

// Skills Validation
export const skillSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    icon: z.string().optional().nullable(),
});

export type SkillInput = z.infer<typeof skillSchema>;

// Experience Validation
export const experienceSchema = z.object({
    startYear: z.number().int().min(1900).max(2100),
    endYear: z.number().int().min(1900).max(2100).optional().nullable(),
    companyName: z.string().min(1, 'Company name is required').max(255),
    description: z.string().optional().nullable(),
    location: z.string().min(1, 'Location is required').max(255),
    skillIds: z.array(z.string().uuid()).default([]),
});

export type ExperienceInput = z.infer<typeof experienceSchema>;

// Education Validation
export const educationSchema = z.object({
    year: z.string().min(1, 'Year is required').max(50),
    institutionName: z.string().min(1, 'Institution name is required').max(255),
    description: z.string().optional().nullable(),
});

export type EducationInput = z.infer<typeof educationSchema>;

// Certifications Validation
export const certificationSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    issuingOrganization: z.string().min(1, 'Issuing organization is required').max(255),
    year: z.number().int().min(1900).max(2100),
    description: z.string().optional().nullable(),
    certificateLink: z.string().url().optional().nullable(),
    skillIds: z.array(z.string().uuid()).default([]),
});

export type CertificationInput = z.infer<typeof certificationSchema>;

// Projects Validation
export const projectSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
    slug: z.string().min(1, 'Slug is required').max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
    description: z.string().min(1, 'Description is required'),
    content: z.string().min(1, 'Content is required'),
    coverImage: z.string().optional().nullable(),
    contentImages: z.array(z.string()).optional().nullable(),
    published: z.preprocess(
        (val) => val === 'true' || val === true,
        z.boolean()
    ).default(false),
    highlighted: z.preprocess(
        (val) => val === 'true' || val === true,
        z.boolean()
    ).default(false),
    publishedAt: z.string().datetime().optional().nullable(),
    skillIds: z.array(z.string().uuid()).default([]),
});

export type ProjectInput = z.infer<typeof projectSchema>;
