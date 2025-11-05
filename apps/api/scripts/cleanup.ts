import { prisma } from "../src/prisma/client.js";

async function main() {
  const target = process.env.TARGET_NAME || "maccandy";
  const res = await prisma.playerState.deleteMany({
    where: {
      OR: [
        { name: { contains: target } },
        { name: { equals: target } },
        { name: { contains: `@${target}` } },
        { name: { equals: `@${target}` } },
      ],
    },
  });
  console.log(JSON.stringify({ ok: true, deleted: res.count, target }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
