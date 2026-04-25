import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function AttendancePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return <div>Please log in</div>;
  }

  const userId = (session.user as any).id;

  // Fetch or Seed Demographic Data specifically for Demo
  let student = await prisma.student.findUnique({
    where: { userId },
    include: {
      attendances: { include: { course: true } }
    }
  });

  if (!student) {
    // 1. Create a dummy course if not exists
    const course1 = await prisma.course.upsert({
      where: { courseCode: "CS301" },
      update: {},
      create: { courseCode: "CS301", courseName: "Data Structures", credits: 4, department: "CS" }
    });
    const course2 = await prisma.course.upsert({
      where: { courseCode: "CS302" },
      update: {},
      create: { courseCode: "CS302", courseName: "Database Management", credits: 3, department: "CS" }
    });

    // 1b. Create dummy user & faculty for relations
    const dummyFacultyUser = await prisma.user.upsert({
      where: { email: "faculty@campuscore.edu" },
      update: {},
      create: { email: "faculty@campuscore.edu", passwordHash: "dummy", name: "Prof. Smith", role: "FACULTY" }
    });

    let facultyUser = await prisma.faculty.findUnique({ where: { userId: dummyFacultyUser.id }});
    if (!facultyUser) {
      facultyUser = await prisma.faculty.create({ data: { userId: dummyFacultyUser.id, department: "CS" } });
    }

    // 2. Upsert the student to prevent Unique Constraint Failure
    student = await prisma.student.upsert({
      where: { userId: userId },
      update: {},
      create: {
        userId: userId,
        enrollmentNumber: "ENR-" + Math.floor(Math.random() * 1000000),
        department: "CS",
        currentSemester: 3,
        attendances: {
          create: [
            { courseId: course1.id, facultyId: facultyUser.id, date: new Date(), status: "PRESENT" },
            { courseId: course1.id, facultyId: facultyUser.id, date: new Date(Date.now() - 86400000), status: "PRESENT" },
            { courseId: course2.id, facultyId: facultyUser.id, date: new Date(), status: "ABSENT" },
            { courseId: course2.id, facultyId: facultyUser.id, date: new Date(Date.now() - 86400000), status: "PRESENT" },
          ]
        }
      },
      include: {
        attendances: { include: { course: true } }
      }
    });
  }

  // Calculate stats from database attendances
  const courseStats = new Map();
  let totalPresent = 0;
  let totalRecords = student.attendances.length;

  student.attendances.forEach(att => {
    if (!courseStats.has(att.course.courseCode)) {
      courseStats.set(att.course.courseCode, { 
        name: att.course.courseName, 
        total: 0, 
        attended: 0 
      });
    }
    const stat = courseStats.get(att.course.courseCode);
    stat.total += 1;
    if (att.status === "PRESENT") {
      stat.attended += 1;
      totalPresent += 1;
    }
  });

  const overallPercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Attendance Records</h1>
        <div className={`px-4 py-2 rounded-lg text-sm font-medium border ${overallPercentage >= 75 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
          Overall: {overallPercentage}%
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-foreground/60 text-sm">
                <th className="py-4 font-medium">Course Code</th>
                <th className="py-4 font-medium">Course Name</th>
                <th className="py-4 font-medium">Total Classes</th>
                <th className="py-4 font-medium">Attended</th>
                <th className="py-4 font-medium text-right">Percentage</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {Array.from(courseStats.entries()).map(([code, stat]) => {
                const percentage = stat.total > 0 ? Math.round((stat.attended / stat.total) * 100) : 0;
                return (
                  <tr key={code} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 font-medium text-white">{code}</td>
                    <td className="py-4 text-foreground/80">{stat.name}</td>
                    <td className="py-4 text-foreground/80">{stat.total}</td>
                    <td className="py-4 text-foreground/80">{stat.attended}</td>
                    <td className="py-4 text-right">
                      <span className={`px-2 py-1 rounded ${percentage >= 75 ? 'text-green-400 bg-green-500/10' : percentage >= 50 ? 'text-orange-400 bg-orange-500/10' : 'text-red-400 bg-red-500/10'}`}>
                        {percentage}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {courseStats.size === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-foreground/50">No attendance records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
