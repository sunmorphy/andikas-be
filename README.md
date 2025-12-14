# Portfolio Backend API

A TypeScript-based backend API for a portfolio website using Neon PostgreSQL and Drizzle ORM.

## Database Schema

This project includes a comprehensive database schema for a portfolio website with the following entities:

### Tables

1. **user_details** - Personal information (singleton table)
   - name, role, description
   - social_medias (JSON array: `["IconName|URL", ...]`)
   - profile_photo (URL)

2. **skills** - Reusable skills library
   - name, icon (URL)

3. **experience** - Work experience
   - start_year, end_year (null = currently employed)
   - company_name, description, location
   - Related to skills via `experience_skills` junction table

4. **education** - Educational background
   - year (e.g., "2001-2008")
   - institution_name, description

5. **certifications** - Professional certifications
   - name, issuing_organization, year
   - description, certificate_link
   - Related to skills via `certification_skills` junction table

6. **projects** - Portfolio projects (blog-style)
   - title, slug, description, content
   - cover_image, published_at
   - Related to skills via `project_skills` junction table

### Junction Tables (Many-to-Many Relationships)

- **experience_skills** - Links experience to skills
- **certification_skills** - Links certifications to skills
- **project_skills** - Links projects to skills

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and add your Neon database URL:

```bash
cp .env.example .env
```

Edit `.env` and replace `your_neon_database_url_here` with your actual Neon PostgreSQL connection string from [Neon Console](https://console.neon.tech).

Example:
```
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### 3. Generate Migration Files

```bash
npm run db:generate
```

This will create SQL migration files in the `./drizzle` directory based on your schema.

### 4. Run Migrations

```bash
npm run db:migrate
```

This will apply the migrations to your Neon database and create all the tables.

### 5. Verify Database (Optional)

Open Drizzle Studio to visually inspect your database:

```bash
npm run db:studio
```

This will open a web interface where you can view and edit your database tables.

## Available Scripts

- `npm run db:generate` - Generate migration files from schema
- `npm run db:migrate` - Apply migrations to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Usage Example

```typescript
import { db } from './db';
import { userDetails, skills, experience } from './db/schema';

// Query user details
const user = await db.select().from(userDetails).limit(1);

// Query all skills
const allSkills = await db.select().from(skills);

// Query experience with related skills
const experienceWithSkills = await db.query.experience.findMany({
  with: {
    experienceSkills: {
      with: {
        skill: true,
      },
    },
  },
});
```

## Tech Stack

- **TypeScript** - Type-safe development
- **Drizzle ORM** - Type-safe SQL query builder
- **Neon PostgreSQL** - Serverless PostgreSQL database
- **Drizzle Kit** - Database migrations and management

## Database Schema Diagram

```
user_details (singleton)
├── id (uuid, pk)
├── name
├── role
├── description
├── social_medias (json)
└── profile_photo

skills
├── id (uuid, pk)
├── name
└── icon

experience                    experience_skills (junction)
├── id (uuid, pk)            ├── experience_id (fk)
├── start_year               └── skill_id (fk)
├── end_year
├── company_name
├── description
└── location

education
├── id (uuid, pk)
├── year
├── institution_name
└── description

certifications               certification_skills (junction)
├── id (uuid, pk)           ├── certification_id (fk)
├── name                    └── skill_id (fk)
├── issuing_organization
├── year
├── description
└── certificate_link

projects                     project_skills (junction)
├── id (uuid, pk)           ├── project_id (fk)
├── title                   └── skill_id (fk)
├── slug
├── description
├── content
├── cover_image
└── published_at
```

## Next Steps

After setting up the database, you can:

1. Create API routes/controllers to expose the data
2. Implement CRUD operations for each entity
3. Add authentication and authorization
4. Build the frontend to consume the API
5. Deploy to your preferred hosting platform

## License

ISC
