import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.passwordResetToken.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.invigilationSlot.deleteMany();
  await prisma.seatAssignment.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("demo123", 10);

  const admin = await prisma.user.create({
    data: {
      username: "examadmin",
      passwordHash: password,
      role: Role.ADMIN,
    },
  });

  const studentUsers = await Promise.all(
    ["21CS001", "21CS002", "21CS003", "21CS004"].map((usn, i) =>
      prisma.user.create({
        data: {
          username: usn,
          email: `${usn.toLowerCase()}@student.atria.edu`,
          passwordHash: password,
          role: Role.STUDENT,
          studentProfile: {
            create: {
              fullName: `Student ${i + 1}`,
              program: "CSE",
              section: i % 2 === 0 ? "A" : "B",
              answerSheetCode: `ANS-${usn}`,
            },
          },
        },
        include: { studentProfile: true },
      })
    )
  );

  const teacher1 = await prisma.user.create({
    data: {
      username: "TCH-AVerma",
      email: "averma@atria.edu",
      passwordHash: password,
      role: Role.TEACHER,
      teacherProfile: {
        create: {
          fullName: "Dr. A. Verma",
          department: "Computer Science & Engineering",
          profileImageUrl: "/default-avatar.svg",
        },
      },
    },
    include: { teacherProfile: true },
  });

  const teacher2 = await prisma.user.create({
    data: {
      username: "TCH-BRao",
      email: "brao@atria.edu",
      passwordHash: password,
      role: Role.TEACHER,
      teacherProfile: {
        create: {
          fullName: "Prof. B. Rao",
          department: "Electronics & Communication",
          profileImageUrl: "/default-avatar.svg",
        },
      },
    },
    include: { teacherProfile: true },
  });

  const hallA = "Hall A-101";
  const hallB = "Hall B-204";

  for (const u of studentUsers) {
    const sp = u.studentProfile!;
    const hall = sp.fullName.endsWith("1") || sp.fullName.endsWith("3") ? hallA : hallB;
    await prisma.seatAssignment.create({
      data: {
        studentProfileId: sp.id,
        hallRoom: hall,
        hallTicketNumber: `HT-${u.username}`,
      },
    });
  }

  await prisma.invigilationSlot.createMany({
    data: [
      { hallRoom: hallA, csvTeacherLabel: teacher1.teacherProfile!.fullName, teacherWebsite: "https://atria.edu/averma" },
      { hallRoom: hallB, csvTeacherLabel: teacher2.teacherProfile!.fullName, teacherWebsite: "https://atria.edu/brao" },
      { hallRoom: "Hall C-305", csvTeacherLabel: "", teacherWebsite: "https://atria.edu" },
    ],
  });

  void admin;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
