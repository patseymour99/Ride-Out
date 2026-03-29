import { PrismaClient, RidingStyle, BikeType, DifficultyLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test users
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@rideout.app' },
    update: {},
    create: {
      email: 'alice@rideout.app',
      passwordHash,
      emailVerified: true,
      profile: {
        create: {
          displayName: 'Alice Rider',
          bio: 'On-road enthusiast. BMW GS1250 owner. Love the Scottish Highlands.',
          location: 'Edinburgh, Scotland',
          latitude: 55.9533,
          longitude: -3.1883,
          ridingStyle: RidingStyle.ON_ROAD,
        },
      },
      bikes: {
        create: [
          { make: 'BMW', model: 'R 1250 GS', year: 2022, type: BikeType.ON_ROAD },
        ],
      },
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@rideout.app' },
    update: {},
    create: {
      email: 'bob@rideout.app',
      passwordHash,
      emailVerified: true,
      profile: {
        create: {
          displayName: 'Bob Offroader',
          bio: 'Enduro obsessed. KTM 500 EXC-F. Mud is my natural habitat.',
          location: 'Manchester, England',
          latitude: 53.4808,
          longitude: -2.2426,
          ridingStyle: RidingStyle.OFF_ROAD,
        },
      },
      bikes: {
        create: [
          { make: 'KTM', model: '500 EXC-F', year: 2023, type: BikeType.OFF_ROAD },
          { make: 'Honda', model: 'CRF450R', year: 2021, type: BikeType.OFF_ROAD },
        ],
      },
    },
  });

  // Alice follows Bob
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: alice.id, followingId: bob.id } },
    update: {},
    create: { followerId: alice.id, followingId: bob.id },
  });

  // Create a sample event
  await prisma.event.upsert({
    where: { id: 'seed-event-1' },
    update: {},
    create: {
      id: 'seed-event-1',
      hostId: alice.id,
      title: 'Peak District Sunday Blast',
      description: 'A scenic on-road ride through the Peak District. All welcome, intermediate pace.',
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      meetingPoint: 'Snake Pass Inn, A57, Sheffield',
      meetingLat: 53.4419,
      meetingLng: -1.7837,
      bikeType: BikeType.ON_ROAD,
      difficulty: DifficultyLevel.INTERMEDIATE,
      maxParticipants: 20,
    },
  });

  console.log('Seed complete!');
  console.log('Test credentials: alice@rideout.app / Password123!');
  console.log('                  bob@rideout.app   / Password123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
