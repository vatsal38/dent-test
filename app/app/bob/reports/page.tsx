import { redirect } from "next/navigation";

export default function BobReportsRedirectPage() {
  redirect("/app/bob?tab=reports");
}
