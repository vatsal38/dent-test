export type KeyLinkItem = {
  label: string;
  description?: string;
  url: string;
  /** Shared login password for tool-access email accounts. */
  password?: string;
  /** Extra guidance shown on the card (e.g. AI usage notes). */
  note?: string;
};

export type KeyLinkSection = {
  id: string;
  title: string;
  description?: string;
  links: KeyLinkItem[];
};

function mailto(email: string, description?: string, password?: string): KeyLinkItem {
  return {
    label: email,
    description,
    url: `mailto:${email}`,
    password,
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
    id: "ai-tools",
    title: "AI tools — key projects",
    description:
      "Claude projects and ChatGPT folders/GPTs for staff planning, coaching, and youth project support.",
    links: [
      {
        label: "Bet on Baltimore — staff planning project",
        description: "Claude · staff",
        note: "Has access to BoB '26 syllabi and other key resources. Create specific chats rather than one giant thread.",
        url: "https://claude.ai/project/019d8d19-fd49-764c-8a03-e917c4d438d4",
      },
      {
        label: "Dent people supporter project",
        description: "Claude · staff",
        note: "For staff, especially support squad. Guidance on navigating interpersonal dynamics.",
        url: "https://claude.ai/project/019f16f4-e728-75ea-8721-217c71c0fc91",
      },
      {
        label: "Dentie.ai project",
        description: "Claude · denters",
        note: "Supports Denters building projects with a questioning, youth-centered approach. Has access to BoB '26 syllabi, Dent Mindsets, Secret Sauce, etc.",
        url: "https://claude.ai/project/019f1705-fd3d-72f6-bc83-5707632c69dd",
      },
      {
        label: "BoB 2026 planning project",
        description: "ChatGPT · staff",
        note: "For staff; has access to BoB '26 syllabi and other key resources.",
        url: "https://chatgpt.com/g/g-p-68ffba5ac7008191bfb6e9a511d222f4-bob-2026-planning/project",
      },
      {
        label: "Made@Dent coach support chat",
        description: "ChatGPT · staff",
        url: "https://chatgpt.com/g/g-p-68ffba5ac7008191bfb6e9a511d222f4-bob-2026-planning/shared/c/6a0c72ff-1c8c-83ea-8969-cfeac3fc7d1f?owner_user_id=user-0MWMKtLMfcbLlpAPZVWxntwz",
      },
      {
        label: "Denternship coach support chat",
        description: "ChatGPT · staff",
        url: "https://chatgpt.com/g/g-p-68ffba5ac7008191bfb6e9a511d222f4-bob-2026-planning/shared/c/6a0b9665-fd84-83ea-a0bf-bae5559e118e?owner_user_id=user-0MWMKtLMfcbLlpAPZVWxntwz",
      },
      {
        label: "AYD coach support chat",
        description: "ChatGPT · staff",
        url: "https://chatgpt.com/g/g-p-68ffba5ac7008191bfb6e9a511d222f4-bob-2026-planning/shared/c/69ffaf05-ef24-83ea-b48a-46bbb5bed8e5?owner_user_id=user-0MWMKtLMfcbLlpAPZVWxntwz",
      },
      {
        label: "Content creation & marketing coach support chat",
        description: "ChatGPT · staff",
        url: "https://chatgpt.com/g/g-p-68ffba5ac7008191bfb6e9a511d222f4-bob-2026-planning/shared/c/6a255686-3f38-83ea-8068-982f3a3f272f?owner_user_id=user-0MWMKtLMfcbLlpAPZVWxntwz",
      },
      {
        label: "Dentie.ai GPT",
        description: "ChatGPT · denters",
        note: "Supports building projects with a questioning, youth-centered approach.",
        url: "https://chatgpt.com/g/g-684c673eaea481919448f217dd990c84-dentie-ai",
      },
      {
        label: "BoB coach support",
        description: "ChatGPT · staff",
        note: "For coaches. Plan and adapt curriculum, lessons, and scaffolding to support youth toward learning and deliverables.",
        url: "https://chatgpt.com/g/g-685a7aaba5688191adb592aac860f2df-bob-coach-support",
      },
      {
        label: "Dent HR: relational support hub",
        description: "ChatGPT · staff",
        note: "For staff, especially support squad. Guidance on navigating interpersonal dynamics.",
        url: "https://chatgpt.com/g/g-68654287b71881919ecff8f7e4961b6f-dent-hr-relational-support-hub",
      },
    ],
  },
  {
    id: "shared-emails",
    title: "Shared emails for tool access",
    description:
      "Shared login accounts for Canva, ChatGPT, and Claude. Staff are invited to Canva by their own email.",
    links: [
      mailto("denter-tech@denteducation.org", "Canva · denters · general", "DenterTech2024!"),
      mailto("ayd@denteducation.org", "Canva · denters · AYD", "Bob2026!"),
      mailto("madeatdent@denteducation.org", "Canva · denters · M@D", "Bob2026!"),
      mailto("denternship@denteducation.org", "Canva · denters · Denternship", "Bob2026!"),
      mailto(
        "content-and-marketing@denteducation.org",
        "Canva · denters · Content & marketing",
        "Bob2026!",
      ),
      mailto("denter-tech@denteducation.org", "ChatGPT · denters", "DenterTech2024!"),
      mailto("tech@denteducation.org", "ChatGPT · staff", "Makeadent2023!"),
      mailto("ayd@denteducation.org", "Claude · AYD", "Bob2026!"),
      mailto("madeatdent@denteducation.org", "Claude · M@D", "Bob2026!"),
      mailto("denternship@denteducation.org", "Claude · Denternship", "Bob2026!"),
      mailto(
        "content-and-marketing@denteducation.org",
        "Claude · Content & marketing",
        "Bob2026!",
      ),
      mailto("tech@denteducation.org", "Claude · coaches", "Makeadent2023!"),
      mailto("support-squad@denteducation.org", "Claude · support squad"),
    ],
  },
  {
    id: "email-groups",
    title: "Google email groups",
    description: "Staff and track communication lists.",
    links: [
      mailto("all-bob26@denteducation.org", "All students + staff"),
      mailto("all-staff-bob26@denteducation.org", "General staff"),
      {
        label: "support-squad-bob-26@denteducation.org",
        description: "General staff",
        url: "https://groups.google.com/a/denteducation.org/g/support-squad-bob-26",
      },
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

/** Youth-facing sections — no staff onboarding, credentials, or email groups. */
export const STUDENT_KEY_LINK_SECTION_IDS = new Set([
  "curriculum",
  "photos",
  "calendars",
  "restorative",
  "ai-tools",
]);

function isYouthFacingLink(link: KeyLinkItem): boolean {
  const text = `${link.label} ${link.description ?? ""}`.toLowerCase();
  return text.includes("denters") || text.includes("dentie");
}

export function keyLinkSectionsForRole(
  role: import("@/platform/rbac/types").BobOpsRole,
): KeyLinkSection[] {
  if (role !== "student") return KEY_LINK_SECTIONS;
  return KEY_LINK_SECTIONS.filter((section) =>
    STUDENT_KEY_LINK_SECTION_IDS.has(section.id),
  ).map((section) => {
    if (section.id === "restorative") {
      return {
        ...section,
        links: section.links.filter((link) => link.description === "Youth"),
      };
    }
    if (section.id === "ai-tools") {
      return {
        ...section,
        links: section.links.filter(isYouthFacingLink),
      };
    }
    return section;
  });
}
