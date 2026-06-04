import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Target, Trophy, Flame } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch active goal
  const { data: activeGoals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user?.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  const activeGoal = activeGoals?.[0];

  // Fetch user stats (correct_vote_tally)
  const { data: userData } = await supabase
    .from("users")
    .select("correct_vote_tally")
    .eq("id", user?.id)
    .single();

  const voteTally = userData?.correct_vote_tally || 0;
  const progressPercent = Math.min((voteTally / 500) * 100, 100);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Active Goal Card */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Today's Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeGoal ? (
                <div className="flex flex-col gap-4">
                  <p className="text-xl font-medium">{activeGoal.goal_text}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div>Stake: <span className="font-bold text-foreground">${activeGoal.stake_amount} {activeGoal.stake_type}</span></div>
                    <div>Deadline: <span className="font-bold text-foreground">{new Date(activeGoal.deadline).toLocaleTimeString()}</span></div>
                  </div>
                  <Button asChild className="mt-4 self-start">
                    <Link href="/submit-proof">Submit Proof</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
                  <p className="text-muted-foreground">You don't have an active goal right now.</p>
                  <Button asChild>
                    <Link href="/new-goal">Set Today's Goal</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Card */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="w-5 h-5 text-primary" />
                Jury Tally
              </CardTitle>
              <CardDescription>Correct votes this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between font-bold">
                  <span>{voteTally}</span>
                  <span className="text-muted-foreground">/ 500</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {voteTally >= 500 && (
                  <p className="text-xs text-primary mt-2">Free month unlocked!</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flame className="w-5 h-5 text-orange-500" />
                Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0 <span className="text-lg text-muted-foreground font-normal">Days</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
