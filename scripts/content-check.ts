import { loadAll } from "../src/lib/content/index";
import { ContentError } from "../src/lib/content/read";

try {
  const { media, services } = loadAll();
  console.log(`Content OK: ${Object.keys(media).length} media items, ${services.length} services`);
} catch (error) {
  if (error instanceof ContentError) {
    console.error(`\nContent problem(s) to fix:\n${error.message}\n`);
    process.exit(1);
  }
  throw error;
}
