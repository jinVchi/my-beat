import "dotenv/config";
import { db } from "../src/db/index";
import { test } from "../src/db/schema";

async function main() {
  const [row] = await db
    .insert(test)
    .values({
      name: "my-beat insert test",
      score: 1,
      createdAt: new Date(),
    })
    .returning();
  console.log("Inserted:", row);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
