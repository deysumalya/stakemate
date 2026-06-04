import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
      <header className="flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
        <Link href="/dashboard" className="font-bold text-xl tracking-tighter text-primary">
          STAKEMATE
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
          <Link href="/profile" className="hover:text-primary transition-colors">Profile</Link>
          <form action="/auth/signout" method="post">
            <Button variant="ghost" size="sm">Sign Out</Button>
          </form>
        </nav>
      </header>
      <main className="flex-1 flex flex-col p-6 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
