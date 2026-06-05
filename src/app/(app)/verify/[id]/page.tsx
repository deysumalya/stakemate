import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { VerifyForm } from "./VerifyForm";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: userData } = await supabase
    .from("users")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (userData && !userData.onboarding_completed) {
    redirect("/onboarding");
  }

  const { data: goal } = await supabase
    .from("goals")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!goal) redirect("/dashboard");

  if (!["active", "in_quiz"].includes(goal.status)) {
    redirect("/dashboard");
  }

  // If the goal is already in_quiz, it means the user refreshed the page or navigated away and came back
  // This is treated as abandoning the quiz. We automatically fail them.
  if (goal.status === "in_quiz") {
    const { failAbandonedQuizAction } = await import("./abandonAction");
    await failAbandonedQuizAction(goal.id);
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full py-8">
      <div className="text-center flex flex-col gap-3 animate-sm-fade-in-up">
        <h1 className="text-3xl font-black tracking-tight">
          Prove Your Work
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
          &ldquo;{goal.goal_text}&rdquo;
        </p>
        <div className="flex items-center justify-center gap-3 mt-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
            {goal.category || "other"}
          </span>
          <span className="text-xs uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            ₹{(goal.pledge_amount || 0) / 100} pledged
          </span>
        </div>
      </div>

      <VerifyForm goal={{
        id: goal.id,
        goal_text: goal.goal_text,
        category: goal.category || "other",
        topic_list: goal.topic_list,
        negotiation_json: goal.negotiation_json,
        mcq_json: goal.mcq_json,
        deadline: goal.deadline,
      }} />
    </div>
  );
}
