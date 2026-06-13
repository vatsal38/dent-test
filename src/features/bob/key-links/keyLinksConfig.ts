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

/**
 * Staff resource links — update URLs as program folders are finalized.
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
        url: "https://drive.google.com",
      },
      {
        label: "Curriculum & lesson plans",
        description: "Weekly curriculum resources",
        url: "https://drive.google.com",
      },
    ],
  },
  {
    title: "Photo albums",
    description: "Team and program photo collections.",
    links: [
      {
        label: "Program photo album",
        url: "https://photos.google.com",
      },
    ],
  },
  {
    title: "Communication platforms",
    description: "Where we coordinate day-to-day.",
    links: [
      {
        label: "Staff Slack workspace",
        url: "https://slack.com",
      },
      {
        label: "Team email groups",
        url: "https://mail.google.com",
      },
    ],
  },
];
