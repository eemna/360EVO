// Disposable / throwaway email domain blocklist.
// Blocks known temp-mail providers at registration and Google-free signup.
// Extend freely; matching is on the domain part after "@".

const DISPOSABLE_DOMAINS = new Set([
  // Major temp-mail providers
  "mailinator.com",
  "mailinator.net",
  "mailinator.org",
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.org",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "guerrillamail.de",
  "guerrillamail.info",
  "tempmail.com",
  "temp-mail.org",
  "tempmailo.com",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.net",
  "trashmail.org",
  "fakeinbox.com",
  "sharklasers.com",
  "guerillamail.info",
  "getnada.com",
  "inboxkitten.com",
  "mohmal.com",
  "tempail.com",
  "tempr.email",
  "discard.email",
  "maildrop.cc",
  "dispostable.com",
  "mintemail.com",
  "mytemp.email",
  "tmpmail.org",
  "emailondeck.com",
  "spamgourmet.com",
  "mailnesia.com",
  "mailcatch.com",
  "jetable.org",
  "throwaway.email",
  "burnermail.io",
  "tempinbox.com",
  "anonymbox.com",
  "courrieltemporaire.com",
  "mailsac.com",
  "dropmail.me",
  "33mail.com",
]);

export const isDisposableEmail = (email) => {
  if (typeof email !== "string" || !email.includes("@")) return false;
  const domain = email.split("@").pop().toLowerCase().trim();
  return DISPOSABLE_DOMAINS.has(domain);
};
