import { PageChrome } from "@/components/PageChrome";
import { PortalLoginForm } from "@/components/PortalLoginForm";

export default function TeacherLoginPage() {
  return (
    <PageChrome>
      <main className="flex min-h-screen flex-col items-center justify-center pt-14">
        <PortalLoginForm initialRole="TEACHER" showBack backHref="/" />
      </main>
    </PageChrome>
  );
}
