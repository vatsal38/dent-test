export type KeyLinkItem = {
  label: string;
  description?: string;
  url: string;
};

export type KeyLinkSection = {
  id: string;
  title: string;
  description?: string;
  links: KeyLinkItem[];
};

function mailto(email: string, description?: string): KeyLinkItem {
  return {
    label: email,
    description,
    url: `mailto:${email}`,
  };
}

/**
 * Staff resource links — add URLs directly here.
 * Leave url empty until the link is ready; empty links render as inactive on the page.
 */
export const KEY_LINK_SECTIONS: KeyLinkSection[] = [
  {
    id: "curriculum",
    title: "Curriculum & youth portfolio folders",
    description:
      "Youth portfolios, syllabus, and track-specific docs and materials.",
    links: [
      {
        label: "Made@Dent (M@D) track folder",
        url: "https://drive.google.com/drive/folders/1AJY-4TgEmHM_xXpWqNyVHqEc1e1oOoz8?usp=sharing",
      },
      {
        label: "Denternship track folder",
        url: "https://drive.google.com/drive/folders/1mvxRSHnWUBn3Gvy760TuQFqUiZ7HgVQn?usp=drive_link",
      },
      {
        label: "Content & marketing track folder",
        url: "https://drive.google.com/drive/folders/1bC7aSgwGP7k2eq5H6Yu0jRRXJp0dFv9k?usp=drive_link",
      },
      {
        label: "Accelerate Your Dent (AYD) track folder",
        url: "https://drive.google.com/drive/folders/18tF1Oob54W3OdiXQQHJe59H6yBTseRpt?usp=drive_link",
      },
    ],
  },
  {
    id: "photos",
    title: "Google Photos albums",
    description: "Program and track photo collections.",
    links: [
      {
        label: '"Best Of" BoB \'26',
        url: "https://photos.app.goo.gl/RoQvBy1mpKcftub56",
      },
      {
        label: "Accelerate Your Dent (AYD) album",
        url: "https://photos.app.goo.gl/cuQoKE4PXnG93Fyw7",
      },
      {
        label: "Denternship album",
        url: "https://photos.app.goo.gl/DiWcKRQajdVMNpFJ6",
      },
      {
        label: "Content & marketing album",
        url: "https://photos.app.goo.gl/mreJ7bomLTQxmWnn9",
      },
      {
        label: "Made@Dent (M@D) album",
        url: "https://photos.app.goo.gl/xW6qQhvqTxWtX3j57",
      },
      {
        label: "Dent-wide event album",
        url: "https://photos.app.goo.gl/msHa6ewsAyurQLvo7",
      },
      {
        label: "BoB '26 staff socials album",
        url: "https://photos.app.goo.gl/pmikXamSPbJT1RXV6",
      },
    ],
  },
  {
    id: "onboarding",
    title: "Staff onboarding & meeting resources",
    links: [
      {
        label: "Employee handbook",
        description: "Onboarding",
        url: "https://sites.google.com/denteducation.org/employeehandbook/employee-handbook",
      },
      {
        label: "Onboarding slides",
        description: "Onboarding",
        url: "https://canva.link/g55j36bibl2wqsk",
      },
      {
        label: "Onboarding agenda",
        description: "Onboarding",
        url: "https://docs.google.com/spreadsheets/u/0/d/1zHX00kO6P1pSqNE12lu2a2C1PrHZ5zqecl8-mEtxuLc/edit",
      },
      {
        label: "Meeting notes / opening circle",
        description: "Meetings",
        url: "https://docs.google.com/document/u/0/d/1BcQtsYDV4V3shqyy_gFRtTpFrGHDkaO2Wc0vrfdaNvU/edit",
      },
      {
        label: "Site supporter ↔ coach/fellow 1-on-1 form",
        description: "Meetings",
        url: "https://airtable.com/appSOR9Kx522hppjF/tbl9s4nsF2jiIAP83/viwp6GJKwjzDWt4bi?blocks=hide",
      },
    ],
  },
  {
    id: "calendars",
    title: "Google calendars",
    description: "Overview and track-specific program calendars.",
    links: [
      {
        label: "BoB '26 calendar",
        description: "Overview of BoB weekly calendar",
        url: "https://docs.google.com/spreadsheets/d/1SHbQPRTbRemFAS6lN4GAcy7J96XV_jHV0aFr5yEYGPk/edit?usp=sharing",
      },
      {
        label: "Bet on Baltimore '26",
        url: "https://calendar.google.com/calendar/u/0?cid=Y184MmFjNTdhZWI0YzNhNTMwZTM4NDE5MmQ2YTQ5OTg2NmNlMjMzNmJiOWFiMzY2MTQzZTE4ZTViYmY3ZWYzZGZkQGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20",
      },
      {
        label: "AYD calendar",
        description: "Track calendar",
        url: "https://calendar.google.com/calendar/u/0?cid=Y184OTgxM2UxY2E3ZWZhYzUxZDdiYjQ2YjEwNjlhMDU0MTM5MzlhYWJhNjk0ZjRiOWU0NWQzODY4MjI4ZTI4YmRkQGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20",
      },
      {
        label: "Content & marketing calendar",
        description: "Track calendar",
        url: "https://calendar.google.com/calendar/u/0?cid=Y19kNzUwNjY3NWM0OTYyZWI3MTJmMTExZmJiYTI0MzY4OTJiMjk5ODk1YjRlOGJiNTk1NzNlMTc5NjMxMTUyYzJlQGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20",
      },
      {
        label: "Made@Dent (M@D) calendar",
        description: "Track calendar",
        url: "https://calendar.google.com/calendar/u/0?cid=Y182MjQyZDgwMjIxZDEyNTMwYjZiM2Q5MTQ2Yjc1Yjc5NTVjODc1NjE4ZDI5ZjFmNzczNWM4YTg2NDlhMTgwNzQ2QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20",
      },
      {
        label: "Denternship calendar",
        description: "Track calendar",
        url: "https://calendar.google.com/calendar/u/0?cid=Y19lZmZiMWE1ZjBhMDYwNDcxZmFjMmYwMGMyOWYyOWIxY2VkMWFhYzdlOWE0ZDcwNzI1NDk4OGFlMzgxNmY4NTI0QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20",
      },
    ],
  },
  {
    id: "restorative",
    title: "Restorative response & mental health resources",
    links: [
      {
        label: "Denter-related restorative behavior response steps",
        description: "Youth",
        url: "https://docs.google.com/document/d/1oV_wRqEQIBxtZ2B1wSJuiQBrL-DcCYDl5MAabWJdKoA/edit?tab=t.0",
      },
      {
        label: "Youth mental health first aid",
        description: "Youth",
        url: "https://sites.google.com/denteducation.org/employeehandbook/working-with-youth/mental-health-first-aid",
      },
      {
        label: "Staff-related behavior response SOP",
        description: "Staff",
        url: "https://docs.google.com/document/d/1HudSA-pXaO3ORDtLiE5QGBjcWpj0zRDZEDlyZJdXTyw/edit?usp=sharing",
      },
    ],
  },
  {
    id: "email-groups",
    title: "Google email groups",
    description: "Staff and track communication lists.",
    links: [
      mailto("all-staff-bob26@denteducation.org", "General staff"),
      mailto("support-squad-bob-26@denteducation.org", "General staff"),
      mailto("ayd-staff-bob26@denteducation.org", "AYD · staff"),
      mailto("ayd-bob26@denteducation.org", "AYD · youth & staff"),
      mailto("mad-staff-bob26@denteducation.org", "M@D · staff"),
      mailto("mad-bob26@denteducation.org", "M@D · youth & staff"),
      mailto(
        "content-marketing-staff-bob26@denteducation.org",
        "Content & marketing · staff",
      ),
      mailto(
        "content-marketing-bob26@denteducation.org",
        "Content & marketing · youth & staff",
      ),
      mailto(
        "denternship-staff-bob26@denteducation.org",
        "Denternship · staff",
      ),
      mailto(
        "denternship-bob26@denteducation.org",
        "Denternship · youth & staff",
      ),
    ],
  },
];

/** Youth-facing sections — no staff onboarding or email groups. */
export const STUDENT_KEY_LINK_SECTION_IDS = new Set([
  "curriculum",
  "photos",
  "calendars",
  "restorative",
]);

export function keyLinkSectionsForRole(
  role: import("@/platform/rbac/types").BobOpsRole,
): KeyLinkSection[] {
  if (role !== "student") return KEY_LINK_SECTIONS;
  return KEY_LINK_SECTIONS.filter((section) =>
    STUDENT_KEY_LINK_SECTION_IDS.has(section.id),
  ).map((section) => {
    if (section.id !== "restorative") return section;
    return {
      ...section,
      links: section.links.filter((link) => link.description === "Youth"),
    };
  });
}
