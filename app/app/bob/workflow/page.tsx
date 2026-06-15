import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

/** Legacy route — opens submission detail on the inbox. */
export default async function WorkflowRedirectPage({ searchParams }: Props) {
  const sp = await searchParams;
  const id = sp.id?.trim();
  redirect(id ? `/app/bob/inbox?id=${encodeURIComponent(id)}` : "/app/bob/inbox");
}
