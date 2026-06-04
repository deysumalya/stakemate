import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Target, Wallet, Flame } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch active goals
  const { data: activeGoals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user?.id)
    .in("status", ["negotiating", "active", "in_quiz", "judging"])
    .order("created_at", { ascending: false })
    .limit(1);

  const activeGoal = activeGoals?.[0];

  // Fetch user stats
  const { data: userData } = await supabase
    .from("users")
    .select("available_balance, pledged_balance, streak")
    .eq("id", user?.id)
    .single();

  const availableBalance = (userData?.available_balance || 0) / 100;
  const pledgedBalance = (userData?.pledged_balance || 0) / 100;
  const streak = userData?.streak || 0;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Wallet Card */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="w-5 h-5 text-primary" />
                Commitment Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-muted-foreground">Available to Pledge</p>
                  <p className="text-3xl font-bold">₹{availableBalance}</p>
                </div>
              </div>
              <div className="flex justify-between items-end pb-4 border-b border-border/50">
                <div>
                  <p className="text-sm text-muted-foreground">Currently Pledged</p>
                  <p className="text-xl font-medium text-orange-500">₹{pledgedBalance}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="w-full" variant="default">Load ₹50</Button>
                <Button className="w-full" variant="outline" asChild><Link href="/redeem">Redeem</Link></Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flame className="w-5 h-5 text-orange-500" />
                Discipline Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{streak} <span className="text-lg text-muted-foreground font-normal">Days</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Active Goal Card */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Current Commitment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeGoal ? (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-lg font-bold">Goal:</h3>
                    <p className="text-xl text-muted-foreground mt-1">{activeGoal.goal_text}</p>
                  </div>
                  
                  {activeGoal.status === "negotiating" && (
                    <div className="p-4 bg-muted rounded-lg border border-border">
                      <p className="font-medium text-sm text-primary mb-2">AI Interrogator is reviewing...</p>
                      <Button asChild className="mt-2"><Link href={`/commit/${activeGoal.id}`}>Resume Negotiation</Link></Button>
                    </div>
                  )}

                  {activeGoal.status === "active" && (
                    <div className="flex flex-col gap-4">
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="font-bold text-sm mb-1">AI Verified Proof Required:</p>
                        <p className="text-sm">{activeGoal.negotiation_json?.negotiated_proof_description || activeGoal.proof_description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-card border border-border rounded-md">
                          <p className="text-muted-foreground mb-1">Pledged</p>
                          <p className="font-bold text-lg">₹{(activeGoal.pledge_amount || 0) / 100}</p>
                        </div>
                        <div className="p-3 bg-card border border-border rounded-md">
                          <p className="text-muted-foreground mb-1">Deadline</p>
                          <p className="font-bold text-lg">{new Date(activeGoal.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>

                      <Button asChild size="lg" className="mt-2">
                        <Link href={`/verify/${activeGoal.id}`}>Ready to Prove It</Link>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-6 h-full border-2 border-dashed border-border rounded-xl">
                  <div className="flex flex-col gap-2">
                    <p className="text-xl font-medium">No active commitments.</p>
                    <p className="text-muted-foreground max-w-sm">Put your money where your mouth is. Set a goal and let the AI hold you accountable.</p>
                  </div>
                  <Button asChild size="lg" className="w-full max-w-xs font-bold">
                    <Link href="/commit">Start a New Commitment</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
