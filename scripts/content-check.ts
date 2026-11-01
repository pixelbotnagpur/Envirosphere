import { loadAll } from "../src/lib/content/index";
import { ContentError } from "../src/lib/content/read";

try {
  const { media, services, jobs, gallery, downloads, aboutPage, whyUsPage, contactPage, galleryPage, downloadsPage, careers, servicesPage } =
    loadAll();
  const pageFiles = [aboutPage, whyUsPage, contactPage, galleryPage, downloadsPage, careers, servicesPage].length;
  console.log(
    `Content OK: ${Object.keys(media).length} media items, ${services.length} services, ` +
      `${jobs.length} job openings, ${gallery.length} gallery items, ${downloads.length} downloads, ` +
      `${pageFiles} inner page files`,
  );
} catch (error) {
  if (error instanceof ContentError) {
    console.error(`\nContent problem(s) to fix:\n${error.message}\n`);
    process.exit(1);
  }
  throw error;
}
