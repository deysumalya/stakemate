import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, Wallet, Trophy, UserCog, BarChart3 } from "lucide-react";
import Link from "next/link";
import { EditProfileForm } from "./EditProfileForm";

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string, tab?: string }>
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch past goals (V2: resolved_pass / resolved_fail)
  const { data: pastGoals } = await supabase
    .from("goals")
    .select("id, goal_text, pledge_amount, status, created_at, deadline, category")
    .eq("user_id", user?.id)
    .in("status", ["resolved_pass", "resolved_fail"])
    .order("created_at", { ascending: false });

  // Fetch user details (V2 columns)
  const { data: userData } = await supabase
    .from("users")
    .select("available_balance, pledged_balance, streak, consecutive_fails, category, full_name, occupation, target_goal, onboarding_completed")
    .eq("id", user?.id)
    .single();

  if (userData && !userData.onboarding_completed) {
    redirect("/onboarding");
  }

  // Calculate stats
  const safePastGoals = pastGoals || [];
  const totalGoals = safePastGoals.length;
  const passedGoals = safePastGoals.filter((g: any) => g.status === "resolved_pass").length;
  const passRate = totalGoals > 0 ? Math.round((passedGoals / totalGoals) * 100) : 0;
  const totalPledged = safePastGoals.reduce((sum: number, g: any) => sum + (g.pledge_amount || 0), 0);
  const totalWonBack = safePastGoals
    .filter((g: any) => g.status === "resolved_pass")
    .reduce((sum: number, g: any) => sum + (g.pledge_amount || 0), 0);

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
      {/* Header */}
      <div className="animate-sm-fade-in-up flex flex-col items-start gap-1">
        <h1 className="text-3xl font-black tracking-tight mb-1">
          {userData?.full_name || "Profile & Stats"}
        </h1>
        <p className="text-muted-foreground">
          {userData?.occupation ? `${userData.occupation} • ${user?.email}` : user?.email}
        </p>
        {userData?.target_goal && (
          <div className="mt-3 bg-primary/10 border border-primary/20 text-primary text-sm font-medium px-4 py-2 rounded-xl flex items-start gap-2 max-w-2xl">
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{userData.target_goal}</p>
          </div>
        )}
      </div>

      {/* Message */}
      {params?.message && (
        <div className="p-4 bg-primary/10 text-primary border border-primary/30 rounded-xl font-medium text-sm animate-sm-fade-in-up">
          {params.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-2 bg-card/30 p-1.5 rounded-xl border border-white/[0.06] w-fit animate-sm-fade-in-up stagger-1">
        <Link 
          href="/profile?tab=stats" 
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            params?.tab !== 'edit' 
              ? 'bg-primary/20 text-primary shadow-[0_0_10px_rgba(57,255,20,0.1)]' 
              : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Stats & History
        </Link>
        <Link 
          href="/profile?tab=edit" 
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            params?.tab === 'edit' 
              ? 'bg-primary/20 text-primary shadow-[0_0_10px_rgba(57,255,20,0.1)]' 
              : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'
          }`}
        >
          <UserCog className="w-4 h-4" /> Edit Profile
        </Link>
      </div>

      {params?.tab === 'edit' ? (
        <div className="animate-sm-fade-in-up stagger-2">
          <EditProfileForm userDetails={userData} />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-sm-fade-in-up stagger-2">
            <StatCard
              icon={<Target className="w-4 h-4 text-primary" />}
              label="Total Goals"
              value={totalGoals.toString()}
              delay={1}
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
              label="Pass Rate"
              value={`${passRate}%`}
              accent={passRate >= 70 ? "text-emerald-400" : passRate >= 40 ? "text-orange-400" : "text-destructive"}
              delay={2}
            />
            <StatCard
              icon={<Wallet className="w-4 h-4 text-orange-400" />}
              label="Total Pledged"
              value={`₹${totalPledged / 100}`}
              delay={3}
            />
            <StatCard
              icon={<Trophy className="w-4 h-4 text-yellow-400" />}
              label="Won Back"
              value={`₹${totalWonBack / 100}`}
              accent="text-primary"
              delay={4}
            />
          </div>

          {/* User Info Bar */}
          <div className="animate-sm-fade-in-up stagger-3">
            <Card className="glass-card border border-white/[0.06]">
              <CardContent className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Balance</p>
                  <p className="font-bold text-primary">₹{(userData?.available_balance || 0) / 100}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Pledged</p>
                  <p className="font-bold text-orange-400">₹{(userData?.pledged_balance || 0) / 100}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Streak</p>
                  <p className="font-bold">
                    {userData?.streak || 0} {(userData?.streak || 0) > 0 && <span className="text-orange-400">🔥</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Category</p>
                  <p className="font-bold capitalize">{userData?.category || "General"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Goal History */}
          <div className="animate-sm-fade-in-up stagger-4">
            <h2 className="text-2xl font-black tracking-tight mb-4">Goal History</h2>
            {pastGoals && pastGoals.length > 0 ? (
              <div className="flex flex-col gap-3">
                {pastGoals.map((goal: any, index: number) => {
                  const isPass = goal.status === "resolved_pass";
                  return (
                    <div
                      key={goal.id}
                      className="animate-sm-fade-in-up"
                      style={{ animationDelay: `${index * 0.06}s` }}
                    >
                      <Card className={`overflow-hidden glass-card card-hover-lift border-l-4 ${
                        isPass ? 'border-l-primary' : 'border-l-destructive'
                      } border border-white/[0.06]`}>
                        <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              {/* Status badge with glow */}
                              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                isPass 
                                  ? 'bg-primary/15 text-primary shadow-[0_0_10px_rgba(57,255,20,0.15)]' 
                                  : 'bg-destructive/15 text-destructive shadow-[0_0_10px_rgba(255,59,48,0.15)]'
                              }`}>
                                {isPass ? "Passed" : "Failed"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(goal.created_at).toLocaleDateString()}
                              </span>
                              {goal.category && (
                                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                  {goal.category}
                                </span>
                              )}
                            </div>
                            <p className="font-medium text-foreground/90 truncate">{goal.goal_text}</p>
                          </div>
                          
                          <div className="shrink-0 text-right">
                            <p className="text-xs text-muted-foreground mb-0.5">Deposit</p>
                            <p className={`font-black text-lg tabular-nums ${isPass ? 'text-primary' : 'text-destructive'}`}>
                              {isPass ? '+' : '-'}₹{(goal.pledge_amount || 0) / 100}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card className="glass-card border border-white/[0.06]">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
                  <span className="text-5xl animate-sm-float inline-block">📋</span>
                  <p className="text-muted-foreground">No completed goals yet. Start your first commitment!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* Stat Card Helper Component */
function StatCard({ 
  icon, 
  label, 
  value, 
  accent, 
  delay 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  accent?: string; 
  delay: number;
}) {
  return (
    <div
      className="animate-sm-fade-in-up card-hover-lift"
      style={{ animationDelay: `${delay * 0.08}s` }}
    >
      <Card className="glass-card border border-white/[0.06]">
        <CardContent className="p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {icon}
            <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
          </div>
          <p className={`text-2xl font-black tabular-nums ${accent || 'text-foreground'}`}>
            {value}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
