import { PageHeader } from "@/design-system/patterns/PageHeader";

export default function BobTeamsComingSoonPage() {
  return (
    <div className="max-w-lg">
      <PageHeader
        eyebrow="Coming soon"
        title="Teams"
        description="Team rosters and pod assignments will live here in a future release."
      />
      <p className="text-sm text-gray-600">
        For now, use Roster and Pods in the sidebar for student and pod
        management.
      </p>
    </div>
  );
}
