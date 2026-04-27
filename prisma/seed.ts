import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@campus.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@campus.com',
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
    },
  })

  // 2. Create Faculty
  const facultyUser = await prisma.user.upsert({
    where: { email: 'faculty@campus.com' },
    update: {},
    create: {
      name: 'Dr. Smith',
      email: 'faculty@campus.com',
      passwordHash,
      role: 'FACULTY',
      isVerified: true,
      department: 'Computer Science',
    },
  })

  const faculty = await prisma.faculty.upsert({
    where: { userId: facultyUser.id },
    update: {},
    create: {
      userId: facultyUser.id,
      department: 'Computer Science',
    },
  })

  // 3. Create Student
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@campus.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'student@campus.com',
      passwordHash,
      role: 'STUDENT',
      isVerified: true,
      department: 'Computer Science',
    },
  })

  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      enrollmentNumber: 'EN1001',
      department: 'Computer Science',
      currentSemester: 3,
    },
  })

  // 4. Create Course
  const course = await prisma.course.upsert({
    where: { courseCode: 'CS301' },
    update: {},
    create: {
      courseCode: 'CS301',
      courseName: 'Data Structures',
      department: 'Computer Science',
      semester: 3,
      credits: 4,
    },
  })

  // 5. Enroll Student
  await prisma.enrollment.upsert({
    where: {
      studentId_courseId: {
        studentId: student.id,
        courseId: course.id,
      },
    },
    update: {},
    create: {
      studentId: student.id,
      courseId: course.id,
      status: 'APPROVED',
    },
  })

  console.log('Seed data created successfully!')
  console.log('Admin: admin@campus.com / password123')
  console.log('Faculty: faculty@campus.com / password123')
  console.log('Student: student@campus.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
