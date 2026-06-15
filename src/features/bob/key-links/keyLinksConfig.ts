export type KeyLinkItem = {
  label: string;
  description?: string;
  url: string;
};

export type KeyLinkSection = {
  title: string;
  description?: string;
  links: KeyLinkItem[];
};

function envUrl(key: string, fallback: string): string {
  const value = process.env[key]?.trim();
  return value || fallback;
}

/**
 * Staff resource links — override via NEXT_PUBLIC_BOB_KEY_LINK_* env vars.
 * Opens in a new tab from Key Links page.
 */
export const KEY_LINK_SECTIONS: KeyLinkSection[] = [
  {
    title: "Google Drives & curriculum",
    description: "Program folders, curriculum, and shared staff resources.",
    links: [
      {
        label: "SYP staff Google Drive",
        description: "Main summer program folder",
        url: envUrl(
          "NEXT_PUBLIC_BOB_KEY_LINK_SYP_DRIVE",
          "https://drive.google.com",
        ),
      },
      {
        label: "Curriculum & lesson plans",
        description: "Weekly curriculum resources",
        url: envUrl(
          "NEXT_PUBLIC_BOB_KEY_LINK_CURRICULUM",
          "https://drive.google.com",
        ),
      },
    ],
  },
  {
    title: "Photo albums",
    description: "Team and program photo collections.",
    links: [
      {
        label: "Program photo album",
        url: envUrl(
          "NEXT_PUBLIC_BOB_KEY_LINK_PHOTO_ALBUM",
          "https://photos.google.com",
        ),
      },
    ],
  },
  {
    title: "Communication platforms",
    description: "Where we coordinate day-to-day.",
    links: [
      {
        label: "Staff Slack workspace",
        url: envUrl("NEXT_PUBLIC_BOB_KEY_LINK_SLACK", "https://slack.com"),
      },
      {
        label: "Team email groups",
        url: envUrl(
          "NEXT_PUBLIC_BOB_KEY_LINK_EMAIL_GROUPS",
          "https://mail.google.com",
        ),
      },
    ],
  },
];
