# 🎓 CampusCore - Next-Gen Academic Management System

![CampusCore Banner](https://img.shields.io/badge/CampusCore-Next--Gen_Management-blue?style=for-the-badge&logo=next.js)

CampusCore is a comprehensive, full-stack Academic Management System designed to streamline university operations. It provides role-based dashboards, academic tracking, timetable management, and automated workflows for students, faculty, and administrators.

## 🚀 Features

- **Role-Based Access Control (RBAC):** Secure, specialized dashboards for Admins, HODs, Coordinators, Faculty, Students, and Parents.
- **Academic Management:** End-to-end management of Courses, Enrollments, and Timetables.
- **Attendance & Grading:** Real-time attendance tracking and marks management with draft/publish workflows.
- **Automated Workflows:** Multi-tier appeal system for grade reviews (Student -> Faculty -> Coordinator -> HOD).
- **Communication:** Interactive notice boards and parent-teacher meeting requests.
- **Mobile Ready:** Designed with a responsive, glassmorphic UI and encapsulated as a native Android app using Capacitor.

## 🛠️ Tech Stack

- **Frontend:** [Next.js 15](https://nextjs.org/) (App Router), React 19, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Next.js API Routes (Serverless)
- **Database:** PostgreSQL (hosted on [Neon](https://neon.tech/)), [Prisma ORM](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) with secure credential-based login and OTP verification via Resend.
- **Mobile:** [Capacitor](https://capacitorjs.com/) for native Android deployment
- **Testing:** Vitest, React Testing Library

## 📋 Architecture & Security

- **Strict Type Safety:** Fully typed with TypeScript, using Zod for robust API request validation.
- **Security:** Passwords hashed with `bcryptjs`, protected API routes, and environment variable isolation.
- **Optimized Performance:** Leverages Next.js server components, Turbopack, and connection pooling via Prisma Accelerate.

## 💻 Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon connection string)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YashrajOmar/Campus-Core---Next-Gen-Academic-Management-System.git
   cd Campus-Core---Next-Gen-Academic-Management-System/web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `web` directory:
   ```env
   DATABASE_URL="your_postgresql_connection_string"
   NEXTAUTH_SECRET="your_secure_random_string"
   NEXTAUTH_URL="http://localhost:3000"
   RESEND_API_KEY="your_resend_api_key"
   ```

4. **Initialize the Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run seed  # Populates initial admin, faculty, and student accounts
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📱 Android App (Capacitor)

The platform is wrapped into a native Android APK using Capacitor, seamlessly rendering the live Next.js production build for a native mobile experience.

```bash
npx cap sync android
npx cap open android
```

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

---
*Built with ❤️ for modern education.*
