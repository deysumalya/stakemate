import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
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
    .select("available_balance, pledged_balance, streak, consecutive_fails, onboarding_completed")
    .eq("id", user?.id)
    .single();

  if (userData && !userData.onboarding_completed) {
    redirect("/onboarding");
  }

  const availableBalance = (userData?.available_balance || 0) / 100;
  const pledgedBalance = (userData?.pledged_balance || 0) / 100;
  const streak = userData?.streak || 0;

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Champion";

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Header */}
      <div className="animate-sm-fade-in-up">
        <p className="text-sm font-medium text-muted-foreground tracking-wider uppercase mb-1">Welcome back</p>
        <h1 className="text-3xl font-black tracking-tight">
          {displayName}{" "}
          <span className="text-primary animate-sm-pulse-glow inline-block">⚡</span>
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Wallet + Streak */}
        <div className="md:col-span-1 flex flex-col gap-6">

          {/* Wallet Card with Animated Gradient Border */}
          <div className="animate-sm-fade-in-up stagger-2">
            <div className="animate-sm-gradient-border gradient-border-wrapper rounded-xl">
              <Card className="glass-card border-0 rounded-xl overflow-hidden card-hover-lift">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wallet className="w-5 h-5 text-primary" />
                    Commitment Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm text-muted-foreground">Available to Pledge</p>
                      <p className="text-3xl font-black tabular-nums animate-sm-pulse-glow text-primary">
                        ₹{availableBalance}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-end pb-4 border-b border-white/[0.06]">
                    <div>
                      <p className="text-sm text-muted-foreground">Currently Pledged</p>
                      <p className="text-xl font-bold tabular-nums text-orange-400">₹{pledgedBalance}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="w-full font-bold" variant="default">Load ₹50</Button>
                    <Button className="w-full" variant="outline" asChild>
                      <Link href="/redeem">Redeem</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Streak Card */}
          <div className="animate-sm-fade-in-up stagger-3">
            <Card className="glass-card border border-white/[0.06] card-hover-lift">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className={`inline-block text-2xl ${streak > 0 ? 'animate-sm-fire-pulse' : ''}`}>🔥</span>
                  Discipline Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-black tabular-nums ${streak > 0 ? 'text-orange-400' : 'text-muted-foreground'}`}>
                    {streak}
                  </span>
                  <span className="text-lg text-muted-foreground font-normal">
                    {streak === 1 ? "Day" : "Days"}
                  </span>
                </div>
                {streak > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Keep the fire alive. Don&apos;t break the chain.
                  </p>
                )}
                {streak === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Complete a commitment to start your streak.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Active Goal Card */}
        <div className="md:col-span-2 animate-sm-fade-in-up stagger-4">
          <Card className="h-full glass-card border border-white/[0.06] card-hover-lift">
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
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Your Goal</p>
                    <p className="text-xl font-medium text-foreground leading-relaxed">{activeGoal.goal_text}</p>
                  </div>
                  
                  {activeGoal.status === "negotiating" && (
                    <div className="p-5 rounded-xl bg-primary/[0.05] border border-primary/20 animate-sm-glow-ring">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                        </span>
                        <p className="font-bold text-sm text-primary">AI Interrogator is reviewing…</p>
                      </div>
                      <Button asChild>
                        <Link href={`/commit/${activeGoal.id}`}>Resume Negotiation</Link>
                      </Button>
                    </div>
                  )}

                  {activeGoal.status === "active" && new Date(activeGoal.deadline) <= new Date() && (
                    <div className="flex flex-col gap-4">
                      <div className="p-5 rounded-xl bg-destructive/[0.06] border border-destructive/15 text-center">
                        <p className="font-bold text-xs uppercase tracking-wider text-destructive mb-2">
                          Deadline Missed
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          You did not verify this commitment in time. Your pledge of ₹{(activeGoal.pledge_amount || 0) / 100} has been forfeited.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeGoal.status === "active" && new Date(activeGoal.deadline) > new Date() && (
                    <div className="flex flex-col gap-4">
                      <div className="p-5 rounded-xl bg-primary/[0.06] border border-primary/15">
                        <p className="font-bold text-xs uppercase tracking-wider text-primary mb-2">
                          AI Verified Proof Required
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {activeGoal.negotiation_json?.negotiated_proof_description || activeGoal.proof_description}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-4 rounded-xl glass-card border border-white/[0.06]">
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Pledged</p>
                          <p className="font-black text-xl text-primary tabular-nums">₹{(activeGoal.pledge_amount || 0) / 100}</p>
                        </div>
                        <div className="p-4 rounded-xl glass-card border border-white/[0.06]">
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Deadline</p>
                          <p className="font-black text-xl tabular-nums text-foreground">
                            {new Date(activeGoal.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <Button asChild size="lg" className="mt-2 font-bold text-base animate-sm-glow-ring">
                        <Link href={`/verify/${activeGoal.id}`}>
                          Ready to Prove It →
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-8 h-full rounded-xl border border-dashed border-white/10">
                  {/* Empty state illustration */}
                  <div className="relative">
                    <span className="text-6xl animate-sm-float inline-block">🎯</span>
                    <span className="absolute -top-1 -right-3 text-2xl animate-sm-sparkle inline-block">✨</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-xl font-bold text-foreground">No active commitments</p>
                    <p className="text-muted-foreground max-w-sm leading-relaxed">
                      Ready to level up? Set a goal, put your deposit on the line, and let the AI hold you accountable.
                    </p>
                  </div>
                  <Button asChild size="lg" className="font-black text-lg px-10 animate-sm-shimmer relative overflow-hidden">
                    <Link href="/commit">
                      Start a New Commitment
                    </Link>
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
