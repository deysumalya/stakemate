import { createClient } from "@/utils/supabase/server";
import { CommitForm } from "./CommitForm";
import { redirect } from "next/navigation";

export default async function CommitPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("onboarding_completed, available_balance")
    .eq("id", user.id)
    .single();

  if (userData && !userData.onboarding_completed) {
    redirect("/onboarding");
  }

  const availableBalance = userData?.available_balance || 0;

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full py-8">
      <div className="text-center flex flex-col gap-3 animate-sm-fade-in-up">
        <h1 className="text-4xl font-black tracking-tight">
          Set a Commitment
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
          The AI will judge your proof. No shortcuts. No excuses.
        </p>
      </div>

      <CommitForm availableBalance={availableBalance} />
    </div>
  );
}
