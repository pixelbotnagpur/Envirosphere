import { loadAll } from "../src/lib/content/index";
import { ContentError } from "../src/lib/content/read";

try {
  const { media, services, jobs, gallery, downloads } = loadAll();
  console.log(
    `Content OK: ${Object.keys(media).length} media items, ${services.length} services, ` +
      `${jobs.length} job openings, ${gallery.length} gallery items, ${downloads.length} downloads`,
  );
} catch (error) {
  if (error instanceof ContentError) {
    console.error(`\nContent problem(s) to fix:\n${error.message}\n`);
    process.exit(1);
  }
  throw error;
}
