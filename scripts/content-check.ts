import { loadAll } from "../src/lib/content/index";
import { ContentError } from "../src/lib/content/read";

try {
  const { media, services, jobs, gallery, downloads, aboutPage, whyUsPage, contactPage, galleryPage, downloadsPage, careers, servicesPage, home, forms } =
    loadAll();
  const noImage = services.filter((service) => !service.image).length;
  const pageFiles = [aboutPage, whyUsPage, contactPage, galleryPage, downloadsPage, careers, servicesPage].length;
  console.log(
    `Content OK: ${Object.keys(media).length} media items, ${services.length} services, ` +
      `${jobs.length} job openings, ${gallery.length} gallery items, ${downloads.length} downloads, ` +
      `${pageFiles} inner page files, Home page (${services.length - noImage} of ${services.length} service rows have their own picture, ${noImage} show a placeholder, ` +
      `${home.fieldArchive.items.length} field photos, ${home.clients.logos.length} client logos), ` +
      `forms.yaml (${Object.keys(forms.inquiry.fields).length + Object.keys(forms.application.fields).length} form fields)`,
  );
} catch (error) {
  if (error instanceof ContentError) {
    console.error(`\nContent problem(s) to fix:\n${error.message}\n`);
    process.exit(1);
  }
  throw error;
}
