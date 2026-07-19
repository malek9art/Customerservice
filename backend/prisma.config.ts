import 'dotenv/config';
import { resolve } from 'node:path';
import { defineConfig, env } from 'prisma/config';

const fromBackendDirectory = process.cwd().endsWith('backend');

export default defineConfig({
  schema: resolve(
    process.cwd(),
    fromBackendDirectory
      ? 'prisma/schema.prisma'
      : 'backend/prisma/schema.prisma',
  ),
  datasource: {
    url: env('DATABASE_URL'),
  },
});
