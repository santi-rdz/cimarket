import { faker } from '@faker-js/faker';
import { createInterface } from 'node:readline';
import slugify from 'slugify';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Prisma } from '../src/generated/prisma-node/client.js';
// The main app generator (schema.prisma "client") targets Cloudflare Workers
// (wasm-compiler-edge) and fails when imported from plain Node — this script
// uses the "nodeClient" generator output instead, built for Node scripts.
import {
  PrismaClient,
  type ProductCondition,
  type ProductStatus,
  type PushPlatform,
} from '../src/generated/prisma-node/client.js';
import categoriesData from './seed-data/categories.json' with { type: 'json' };
import citiesData from './seed-data/cities.json' with { type: 'json' };

const USERS_COUNT = 25;
const PRODUCTS_COUNT = 60;
const CONVERSATIONS_COUNT = 15;
const FAVORITES_COUNT = 40;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not set');

// Guardrail: this script deletes real rows. Default to requiring confirmation
// for anything that isn't explicitly localhost — allowlisting remote hostname
// substrings (as opposed to this denylist of local ones) would silently skip
// the prompt for any provider we didn't think to list.
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

async function confirm(question: string) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>((resolve) => rl.question(question, resolve));
  rl.close();
  return answer.trim().toLowerCase() === 'yes';
}

const dbHost = new URL(databaseUrl).hostname;
if (!LOCAL_HOSTS.has(dbHost) && !process.env.SEED_ALLOW_REMOTE) {
  const confirmed = await confirm(
    `This looks like a remote database (${dbHost}). Type "yes" to continue: `,
  );
  if (!confirmed) throw new Error('Aborted: remote database not confirmed.');
}

const adapter = new PrismaNeon({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const PRODUCT_CONDITIONS: ProductCondition[] = ['NEW', 'LIKE_NEW', 'GOOD', 'DIGITAL'];
const PUSH_PLATFORMS: PushPlatform[] = ['IOS', 'ANDROID', 'WEB'];

function toProductSlug(title: string) {
  return `${slugify(title, { lower: true, strict: true })}-${faker.string.alphanumeric(6)}`;
}

async function importData() {
  console.log('Seeding catalog (categories, subcategories, cities, campuses)...');

  const subcategoryIds: number[] = [];
  for (const category of categoriesData) {
    const createdCategory = await prisma.category.create({ data: { name: category.name } });
    for (const subcategoryName of category.subcategories) {
      const createdSubcategory = await prisma.subcategory.create({
        data: { name: subcategoryName, categoryId: createdCategory.id },
      });
      subcategoryIds.push(createdSubcategory.id);
    }
  }

  const campusIds: number[] = [];
  for (const city of citiesData) {
    const createdCity = await prisma.city.create({ data: { name: city.name } });
    for (const campusName of city.campuses) {
      const createdCampus = await prisma.campus.create({
        data: { name: campusName, cityId: createdCity.id },
      });
      campusIds.push(createdCampus.id);
    }
  }

  console.log(`Seeding ${USERS_COUNT} users...`);
  const userIds: string[] = [];
  for (let i = 0; i < USERS_COUNT; i++) {
    const name = faker.person.fullName();
    const user = await prisma.user.create({
      data: {
        googleId: faker.string.numeric(21),
        email: faker.internet.email({ firstName: name.split(' ')[0] }).toLowerCase(),
        name,
        role: i === 0 ? 'ADMIN' : 'USER',
        avatarKey: faker.image.personPortrait({ size: 256 }),
        campuses: {
          connect: faker.helpers.arrayElements(campusIds, { min: 1, max: 2 }).map((id) => ({ id })),
        },
      },
    });
    userIds.push(user.id);
  }

  console.log(`Seeding ${PRODUCTS_COUNT} products (with 1-4 images each)...`);
  const productIds: string[] = [];
  const productOwnerById = new Map<string, string>();
  for (let i = 0; i < PRODUCTS_COUNT; i++) {
    const title = faker.commerce.productName();
    const ownerId = faker.helpers.arrayElement(userIds);
    const product = await prisma.product.create({
      data: {
        userId: ownerId,
        slug: toProductSlug(title),
        title,
        description: faker.commerce.productDescription(),
        price: faker.commerce.price({ min: 50, max: 5000 }),
        condition: faker.helpers.arrayElement(PRODUCT_CONDITIONS),
        status: 'AVAILABLE' as ProductStatus,
        subcategoryId: faker.helpers.arrayElement(subcategoryIds),
        campuses: { connect: [{ id: faker.helpers.arrayElement(campusIds) }] },
        images: {
          create: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, (_, index) => ({
            storageKey: faker.image.urlPicsumPhotos({ width: 800, height: 800 }),
            sortOrder: index,
          })),
        },
      },
    });
    productIds.push(product.id);
    productOwnerById.set(product.id, ownerId);
  }

  console.log(`Seeding ${FAVORITES_COUNT} favorites...`);
  for (let i = 0; i < FAVORITES_COUNT; i++) {
    const productId = faker.helpers.arrayElement(productIds);
    const ownerId = productOwnerById.get(productId)!;
    const buyerId = faker.helpers.arrayElement(userIds.filter((id) => id !== ownerId));
    await prisma.favorite.upsert({
      where: { userId_productId: { userId: buyerId, productId } },
      create: { userId: buyerId, productId },
      update: {},
    });
  }

  console.log(`Seeding ${CONVERSATIONS_COUNT} conversations with messages...`);
  for (let i = 0; i < CONVERSATIONS_COUNT; i++) {
    const productId = faker.helpers.arrayElement(productIds);
    const sellerId = productOwnerById.get(productId)!;
    const buyerId = faker.helpers.arrayElement(userIds.filter((id) => id !== sellerId));

    const conversation = await prisma.conversation
      .create({
        data: {
          buyerId,
          sellerId,
          productId,
          lastMessageAt: new Date(),
          messages: {
            create: Array.from({ length: faker.number.int({ min: 2, max: 6 }) }, (_, index) => ({
              senderId: index % 2 === 0 ? buyerId : sellerId,
              content: faker.lorem.sentence(),
            })),
          },
        },
      })
      .catch((error: unknown) => {
        // P2002: unique constraint violation — this buyer/seller/product combo
        // already exists, skip it. Anything else is a real bug, surface it.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          return null;
        }
        throw error;
      });

    // Half of the conversations end up as a completed sale with reviews.
    if (conversation && faker.datatype.boolean()) {
      const transaction = await prisma.transaction.create({
        data: {
          productId,
          sellerId,
          buyerId,
          conversationId: conversation.id,
          status: 'COMPLETED',
        },
      });
      await prisma.product.update({ where: { id: productId }, data: { status: 'SOLD' } });
      await prisma.review.createMany({
        data: [
          {
            transactionId: transaction.id,
            fromId: buyerId,
            toId: sellerId,
            rating: faker.number.int({ min: 3, max: 5 }),
            comment: faker.lorem.sentence(),
          },
          {
            transactionId: transaction.id,
            fromId: sellerId,
            toId: buyerId,
            rating: faker.number.int({ min: 3, max: 5 }),
            comment: faker.lorem.sentence(),
          },
        ],
      });
    }
  }

  console.log('Seeding push tokens and notifications...');
  for (const userId of userIds) {
    await prisma.pushToken.create({
      data: {
        userId,
        token: faker.string.alphanumeric(140),
        platform: faker.helpers.arrayElement(PUSH_PLATFORMS),
      },
    });
    await prisma.notification.create({
      data: {
        userId,
        type: 'PRODUCT_FAVORITED',
        title: 'Alguien guardó tu producto',
        body: faker.lorem.sentence(),
      },
    });
  }

  console.log('Done. Seeded catalog + fake users/products/conversations/transactions/reviews.');
}

// Auth data (Session, AdminAuditLog) is intentionally NOT seeded here: those
// rows are only meaningful when tied to a real login/refresh-token flow, so
// fake ones would be misleading rather than useful for local testing.
async function deleteData() {
  console.log('Deleting seeded data...');
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.report.deleteMany(),
    prisma.messageAttachment.deleteMany(),
    prisma.message.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.pushToken.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.product.deleteMany(),
    prisma.subcategory.deleteMany(),
    prisma.category.deleteMany(),
    prisma.campus.deleteMany(),
    prisma.city.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log('Data successfully deleted!');
}

const mode = process.argv[2];

if (mode === '--import') {
  await importData();
} else if (mode === '--delete') {
  await deleteData();
} else {
  throw new Error('Usage: tsx prisma/seed.ts --import | --delete');
}

await prisma.$disconnect();
