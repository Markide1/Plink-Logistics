import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'user4@yomail.com';
  const adminPassword = 'asasada';

  const existingAdmin = await prisma.user.findFirst({
    where: {
      email: adminEmail,
      role: UserRole.ADMIN,
      isDeleted: false,
    },
  });

  if (existingAdmin) {
    console.log('Admin user already exists:', existingAdmin.email);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admininstrator',
      role: UserRole.ADMIN,
    },
  });

  console.log('Admin user created:', admin.email);
  console.log('Change this password:', adminPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
