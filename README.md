# Bambe Aine Chris — Portfolio

Personal software developer portfolio for **Bambe Aine Chris** (`Intango TSS · L4 SOD`, Busanza, Nyarutarama, Rwanda), focused on backend engineering with Node.js, Express.js, MySQL, SQLite, and real-world web systems including **SAMS** (School Attendance Management System).

## Tech Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Three.js, Lenis
- **Backend:** Express, Node.js (`node:sqlite` persistence)
- **Features:**
  - Interactive 3D smoked-glass hero (`FacetGlassHero`) & orbital WebGL Earth backdrop
  - Full-page scroll choreography with animated typography and dedicated routes (`/`, `/about`, `/skills`, `/projects`, `/youtube`, `/contact`, `/admin`)
  - 3 animated project showcase cards + interactive SAMS module explorer
  - `@VazukoYT` YouTube showcase with Slide Spectra animation
  - Contact inbox & protected `/admin` management dashboard

## Local Setup (Node.js 22+)
```bash
npm install
cp .env.example .env
npm run dev
```
Open `http://localhost:3000` (and `http://localhost:3000/admin` for the admin dashboard).
