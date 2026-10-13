import 'dotenv/config';

import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log(
    'Seeding compatibility scoring configuration...',
  );

  // Deactivate existing configurations
  await prisma.compatibilityScoringConfig.updateMany({
    data: {
      isActive: false,
    },
  });

  // Create the active configuration
  const config =
    await prisma.compatibilityScoringConfig.create({
      data: {
        version: '1',

        technicalSkillsWeight: 30,
        experienceWeight: 20,
        projectsWeight: 15,
        toolsWeight: 10,
        roleAlignmentWeight: 15,
        educationWeight: 10,

        isActive: true,
      },
    });

  console.log(
    'Compatibility scoring configuration created:',
  );
  console.log(config);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
