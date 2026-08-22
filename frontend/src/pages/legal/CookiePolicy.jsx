import LegalPage from "../../components/LegalPage";
import { LEGAL_CONTACT, LEGAL_UPDATED } from "../../lib/legal";

const SECTIONS = [
  {
    title: "1. What cookies are",
    body: `A cookie is a small text file a site stores on your device so it can remember something between page loads. Similar technologies — local storage, session storage and pixels — do much the same job, and this policy covers them all.`,
  },
  {
    title: "2. Strictly necessary",
    body: `These make the site work and cannot be switched off.

- Admin session cookie: set only when someone signs in to the private admin panel. It is not set for ordinary readers.
- Chat session identifier: kept in your browser's session storage so the assistant can follow a single conversation. It disappears when you close the tab.

Because these are required to deliver a service you asked for, they do not need consent.`,
  },
  {
    title: "3. Analytics",
    body: `We use a privacy-focused, self-hosted analytics tool to count page views and see which recipes are read. It is configured to work without advertising identifiers and does not follow you across other websites.`,
  },
  {
    title: "4. Advertising",
    body: `When advertising is enabled, Google and its partners may set and read cookies on this site to select ads, cap how often you see the same ad, and measure performance.

Google uses these cookies to serve ads based on your visit to this site and other sites on the internet. If you have not consented to personalised advertising, or you have opted out, you may still see ads — they will simply be non-personalised, chosen from general context rather than your browsing history.

You can manage this at any time:`,
    links: [
      { label: "Google Ads Settings — turn off personalised ads", href: "https://adssettings.google.com" },
      { label: "aboutads.info — industry opt-out page", href: "https://www.aboutads.info/choices/" },
      { label: "youronlinechoices.eu — EU opt-out page", href: "https://www.youronlinechoices.eu/" },
      { label: "Google's technologies and cookies used in advertising", href: "https://policies.google.com/technologies/ads" },
    ],
  },
  {
    title: "5. Third parties we do not control",
    body: `Some pages embed content from other services — for example a Google Maps frame on the contact page. Those providers may set their own cookies when the embedded content loads. We do not control them; their own policies apply.`,
  },
  {
    title: "6. Controlling cookies in your browser",
    body: `Every major browser lets you see the cookies a site has set, delete them, and refuse new ones. Look under Settings → Privacy. Blocking all cookies will not break the reading experience on this site, though the admin panel will stop working.

You can also browse in a private or incognito window, which clears everything when you close it.`,
    links: [
      { label: "allaboutcookies.org — browser-by-browser instructions", href: "https://www.allaboutcookies.org/" },
    ],
  },
  {
    title: "7. Consent in the EEA and the UK",
    body: `If you are in the European Economic Area, the United Kingdom or Switzerland, non-essential cookies — including advertising cookies — are only set once you have agreed to them.

When advertising is enabled on this site, that consent is collected through a Google-certified consent management platform, which appears before any advertising cookie is set. You can change or withdraw your choice from that same notice at any time.

While advertising is switched off, no advertising cookies are set at all.`,
  },
  {
    title: "8. Questions",
    body: `Ask us anything about this policy at ${LEGAL_CONTACT}.`,
  },
];

export default function CookiePolicy() {
  return (
    <LegalPage
      title="Cookie Policy"
      description="Which cookies Pulse Recipe uses, what each category does, and how to control or refuse them."
      updated={LEGAL_UPDATED}
      intro="This page lists every category of cookie this site uses and gives you a direct way to control each one."
      sections={SECTIONS}
    />
  );
}
