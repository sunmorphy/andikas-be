# Portfolio Backend API Documentation

Base URL: `http://localhost:3000/api`

## Health Check

### GET /health
Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Portfolio API is running"
}
```

---

## User Details

### GET /api/user
Get user profile details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "role": "Full Stack Developer",
    "description": "Passionate developer...",
    "socialMedias": ["GithubLogo|https://github.com/johndoe", "LinkedinLogo|https://linkedin.com/in/johndoe"],
    "profilePhoto": "https://ik.imagekit.io/...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/user
Create user profile (only if doesn't exist).

**Request Body:**
```json
{
  "name": "John Doe",
  "role": "Full Stack Developer",
  "description": "Passionate developer with 5+ years of experience...",
  "socialMedias": ["GithubLogo|https://github.com/johndoe"],
  "profilePhoto": "https://ik.imagekit.io/your-image.jpg"
}
```

### PUT /api/user
Update user profile.

**Request Body:** Same as POST

---

## Skills

### GET /api/skills
Get all skills.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "TypeScript",
      "icon": "https://ik.imagekit.io/typescript-icon.png",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /api/skills/:id
Get skill by ID.

### POST /api/skills
Create new skill.

**Request Body:**
```json
{
  "name": "TypeScript",
  "icon": "https://ik.imagekit.io/typescript-icon.png"
}
```

### PUT /api/skills/:id
Update skill.

### DELETE /api/skills/:id
Delete skill.

---

## Experience

### GET /api/experience
Get all work experience with related skills.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "startYear": 2020,
      "endYear": null,
      "companyName": "Tech Corp",
      "description": "Led development of...",
      "location": "San Francisco, CA",
      "experienceSkills": [
        {
          "skill": {
            "id": "uuid",
            "name": "TypeScript",
            "icon": "https://..."
          }
        }
      ]
    }
  ]
}
```

### GET /api/experience/:id
Get experience by ID with skills.

### POST /api/experience
Create new experience.

**Request Body:**
```json
{
  "startYear": 2020,
  "endYear": 2023,
  "companyName": "Tech Corp",
  "description": "Led development of microservices architecture...",
  "location": "San Francisco, CA",
  "skillIds": ["skill-uuid-1", "skill-uuid-2"]
}
```

**Note:** `endYear` can be `null` for current employment.

### PUT /api/experience/:id
Update experience.

### DELETE /api/experience/:id
Delete experience.

---

## Education

### GET /api/education
Get all education.

### GET /api/education/:id
Get education by ID.

### POST /api/education
Create new education.

**Request Body:**
```json
{
  "year": "2015-2019",
  "institutionName": "University of Technology",
  "description": "Bachelor of Science in Computer Science"
}
```

### PUT /api/education/:id
Update education.

### DELETE /api/education/:id
Delete education.

---

## Certifications

### GET /api/certifications
Get all certifications with related skills.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "AWS Certified Solutions Architect",
      "issuingOrganization": "Amazon Web Services",
      "year": 2023,
      "description": "Professional level certification...",
      "certificateLink": "https://aws.amazon.com/verify/...",
      "certificationSkills": [
        {
          "skill": {
            "id": "uuid",
            "name": "AWS",
            "icon": "https://..."
          }
        }
      ]
    }
  ]
}
```

### GET /api/certifications/:id
Get certification by ID with skills.

### POST /api/certifications
Create new certification.

**Request Body:**
```json
{
  "name": "AWS Certified Solutions Architect",
  "issuingOrganization": "Amazon Web Services",
  "year": 2023,
  "description": "Professional level certification for AWS architecture",
  "certificateLink": "https://aws.amazon.com/verify/...",
  "skillIds": ["skill-uuid-1", "skill-uuid-2"]
}
```

### PUT /api/certifications/:id
Update certification.

### DELETE /api/certifications/:id
Delete certification.

---

## Projects

### GET /api/projects
Get all projects with related skills.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "E-Commerce Platform",
      "slug": "e-commerce-platform",
      "description": "A full-stack e-commerce solution...",
      "content": "# Project Overview\n\nDetailed markdown content...",
      "coverImage": "https://ik.imagekit.io/project-cover.jpg",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "projectSkills": [
        {
          "skill": {
            "id": "uuid",
            "name": "React",
            "icon": "https://..."
          }
        }
      ]
    }
  ]
}
```

### GET /api/projects/:slug
Get project by slug with skills.

### POST /api/projects
Create new project.

**Request Body:**
```json
{
  "title": "E-Commerce Platform",
  "slug": "e-commerce-platform",
  "description": "A full-stack e-commerce solution built with modern technologies",
  "content": "# Project Overview\n\nDetailed markdown content about the project...",
  "coverImage": "https://ik.imagekit.io/project-cover.jpg",
  "publishedAt": "2024-01-01T00:00:00.000Z",
  "skillIds": ["skill-uuid-1", "skill-uuid-2"]
}
```

**Note:** `slug` must be lowercase with hyphens only (e.g., `my-awesome-project`).

### PUT /api/projects/:id
Update project.

### DELETE /api/projects/:id
Delete project.

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

---

## ImageKit Integration

All image fields accept ImageKit URLs:
- `userDetails.profilePhoto`
- `skills.icon`
- `projects.coverImage`

Upload images to ImageKit and use the returned URLs in your API requests.

---

## Social Media Format

The `socialMedias` field in user details accepts an array of strings in this format:

```
"PhosphorIconName|URL"
```

Examples:
```json
[
  "GithubLogo|https://github.com/username",
  "LinkedinLogo|https://linkedin.com/in/username",
  "TwitterLogo|https://twitter.com/username",
  "Globe|https://yourwebsite.com"
]
```

Use Phosphor icon names from: https://phosphoricons.com
