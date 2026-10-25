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
  console.log('Seeding compatibility scoring configuration...');

  // Create or activate the default configuration
  await prisma.compatibilityScoringConfig.upsert({
    where: { version: 'v1' },
    update: {
      technicalSkillsWeight: 30,
      experienceWeight: 20,
      projectsWeight: 15,
      toolsWeight: 10,
      roleAlignmentWeight: 15,
      educationWeight: 10,
      isActive: true,
    },
    create: {
      version: 'v1',
      technicalSkillsWeight: 30,
      experienceWeight: 20,
      projectsWeight: 15,
      toolsWeight: 10,
      roleAlignmentWeight: 15,
      educationWeight: 10,
      isActive: true,
    },
  });

  // Deactivate all other configurations
  await prisma.compatibilityScoringConfig.updateMany({
    where: { version: { not: 'v1' } },
    data: { isActive: false },
  });

  console.log('Compatibility scoring configuration seeded successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
