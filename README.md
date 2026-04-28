# 🎓 Campus Core – Academic Management System

A full-stack **College Academic Management System** designed to streamline academic workflows such as attendance tracking, marks management, exam scheduling, and communication between students, faculty, and parents.

---

## 🚀 Live Demo

🌐 https://campus-core-theta.vercel.app

---

## ✨ Features

### 👨‍🎓 Student

* View attendance and internal marks
* Raise appeals for marks
* Access timetable and notices
* Request academic support

### 👩‍🏫 Faculty

* Upload marks and attendance
* Respond to student appeals
* Manage course-related data

### 🏫 Admin / HOD

* Approve and manage appeals
* Configure academic workflows
* Monitor system activity

### 👨‍👩‍👧 Parent

* Track student performance
* Request meetings with faculty

---

## 🏗️ Tech Stack

**Frontend**

* Next.js 16 (App Router)
* Tailwind CSS

**Backend**

* Next.js API Routes
* Prisma ORM

**Database**

* PostgreSQL

**Authentication**

* NextAuth.js

**Deployment**

* Vercel

---

## 🧠 System Architecture

The system follows a **client-server architecture**:

* Web Application (Next.js frontend)
* Backend API (Next.js server routes)
* Prisma ORM (database access layer)
* PostgreSQL database

All business logic is handled via APIs, ensuring scalability and separation of concerns.

---

## 📦 Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/campus-core.git
cd campus-core
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create a `.env` file:

```env
DATABASE_URL=your_postgres_connection_string
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
```

---

### 4. Run development server

```bash
npm run dev
```

---

## 🏗️ Build for Production

```bash
npm run build
npm start
```

---

## 🚀 Deployment (Vercel)

1. Push code to GitHub

2. Import project in Vercel

3. Add environment variables:

   * `DATABASE_URL`
   * `NEXTAUTH_SECRET`
   * `NEXTAUTH_URL`

4. Deploy 🎉

---

## 📱 Mobile App (Planned)

A mobile version of the platform is planned using **Capacitor**.

### Status

🚧 Under Development

### Planned Features

* Android app using WebView
* Secure authentication handling
* Push notifications (marks, attendance, notices)
* Limited offline support

The mobile app will use the same backend APIs as the web platform.

---

## 📊 Core Modules

* Attendance Management
* Internal Marks Management
* Appeals Workflow
* Notices & Announcements
* Exam Scheduling
* Parent Portal

---

## 🔐 Validation Rules

* Only authorized users can modify academic data
* Marks editable only during review period
* Appeals allowed within defined timeframe
* Attendance linked to scheduled lectures

---

## 🔮 Future Enhancements

* 📊 Analytics dashboards (performance & attendance insights)
* 🤖 AI-based student performance prediction
* 🔔 Real-time notifications (push, email, SMS)
* 🏫 Integration with university ERP systems
* 📱 Full native mobile apps (Android & iOS)
* 📈 Advanced reporting (PDF/Excel export)
* 🔐 Enhanced security & audit logs
* 🌐 Scalability improvements (microservices, caching)

---

## 🤝 Contributing

Contributions are welcome. Please open an issue before making major changes.

---

## 📄 License

MIT License

---

## 👨‍💻 Author

**Yashraj Omar**
