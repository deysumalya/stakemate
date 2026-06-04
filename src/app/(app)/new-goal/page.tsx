import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createGoal } from "./actions";
import { redirect } from "next/navigation";

export default async function NewGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user already has an active goal
  const { data: activeGoals } = await supabase
    .from("goals")
    .select("id")
    .eq("user_id", user?.id)
    .eq("status", "active");

  if (activeGoals && activeGoals.length > 0) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Set Today's Goal</h1>
        <p className="text-muted-foreground">Put your virtual credits on the line. Complete the task or lose your stake.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Goal Details</CardTitle>
          <CardDescription>Make it specific and verifiable.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="goal-form" action={createGoal} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="goalText" className="text-sm font-medium">I commit to...</label>
              <Input 
                id="goalText" 
                name="goalText" 
                placeholder="e.g., Push 2 commits to GitHub" 
                required 
                minLength={20}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">Must be easily verifiable by a stranger (20-200 characters).</p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="deadline" className="text-sm font-medium">Today's Deadline</label>
              <Input 
                id="deadline" 
                name="deadline" 
                type="time" 
                required 
              />
              <p className="text-xs text-muted-foreground">Must be at least 2 hours from now.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="stakeAmount" className="text-sm font-medium">Virtual Stake Amount</label>
              <select 
                id="stakeAmount" 
                name="stakeAmount"
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                required
              >
                <option value="1">$1 Virtual Credit</option>
                <option value="2">$2 Virtual Credits</option>
                <option value="5">$5 Virtual Credits</option>
                <option value="10">$10 Virtual Credits</option>
                <option value="20">$20 Virtual Credits</option>
              </select>
            </div>

            {params?.error && (
              <p className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                {params.error}
              </p>
            )}
          </form>
        </CardContent>
        <CardFooter className="border-t border-border pt-6 flex justify-end gap-4">
          <Button variant="ghost" asChild>
            <a href="/dashboard">Cancel</a>
          </Button>
          <Button type="submit" form="goal-form">Lock It In</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
