/** `tel:` link: spaces are not allowed inside a tel: URI. */
export const telHref = (phone: string): string => `tel:${phone.replace(/\s/g, "")}`;

export const mailtoHref = (email: string, subject?: string): string =>
  subject ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : `mailto:${email}`;
