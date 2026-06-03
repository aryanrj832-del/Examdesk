import { PageChrome } from "@/components/PageChrome";
import { PortalLoginForm } from "@/components/PortalLoginForm";

export default function Home() {
  return (
    <PageChrome>
      <main className="flex min-h-screen flex-col items-center justify-center pt-14">
        <h1 className="sr-only">EXAM DESK – Smart examination management</h1>
        <PortalLoginForm />
      </main>
    </PageChrome>
  );
}
