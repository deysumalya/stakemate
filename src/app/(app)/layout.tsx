import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AppNav } from "@/components/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppNav />

      {/* Subtle ambient glow behind content */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/[0.02] rounded-full blur-[100px]" />
      </div>

      <main className="flex-1 flex flex-col p-6 max-w-6xl mx-auto w-full animate-sm-fade-in">
        {children}
      </main>
    </div>
  );
}
