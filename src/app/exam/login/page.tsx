import { PageChrome } from "@/components/PageChrome";
import { PortalLoginForm } from "@/components/PortalLoginForm";

export default function ExamLoginPage() {
  return (
    <PageChrome>
      <main className="flex min-h-screen flex-col items-center justify-center pt-14">
        <PortalLoginForm initialRole="ADMIN" showBack backHref="/" />
      </main>
    </PageChrome>
  );
}
