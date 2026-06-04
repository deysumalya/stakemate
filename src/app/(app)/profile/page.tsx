import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fileDispute } from "./actions";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch past goals
  const { data: pastGoals } = await supabase
    .from("goals")
    .select("*, disputes(status, claude_verdict, claude_reasoning)")
    .eq("user_id", user?.id)
    .in("status", ["pass", "fail"])
    .order("created_at", { ascending: false });

  // Fetch user details
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user?.id)
    .single();

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Profile & History</h1>
        <p className="text-muted-foreground">{user?.email}</p>
      </div>

      {params?.message && (
        <div className="p-4 bg-primary/20 text-primary border border-primary/50 rounded-lg font-medium">
          {params.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Subscription Status</p>
            <p className="font-medium capitalize">{userData?.subscription_status?.replace('_', ' ') || 'Free Trial'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Category</p>
            <p className="font-medium">{userData?.interest_category || 'Software/Code'}</p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4 mt-8">Goal History</h2>
        {pastGoals && pastGoals.length > 0 ? (
          <div className="flex flex-col gap-4">
            {pastGoals.map((goal: any) => {
              const isPass = goal.status === 'pass';
              const dispute = goal.disputes?.[0];

              return (
                <Card key={goal.id} className={`overflow-hidden border-l-4 ${isPass ? 'border-l-primary' : 'border-l-destructive'}`}>
                  <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isPass ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
                        }`}>
                          {goal.status}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(goal.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-medium text-lg">{goal.goal_text}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-sm text-muted-foreground">
                        Staked: <span className="font-bold text-foreground">${goal.stake_amount}</span>
                      </div>
                      
                      {/* Dispute UI */}
                      {goal.status === 'fail' && !dispute && (
                        <form action={fileDispute}>
                          <input type="hidden" name="goalId" value={goal.id} />
                          <input type="hidden" name="goalText" value={goal.goal_text} />
                          <input type="hidden" name="proofUrl" value={goal.proof_url} />
                          <Button size="sm" variant="outline" type="submit">
                            File Dispute
                          </Button>
                        </form>
                      )}
                      
                      {dispute && (
                        <div className="text-sm px-3 py-2 bg-muted rounded-md max-w-xs text-right">
                          <span className="font-semibold block mb-1">
                            Dispute {dispute.status === 'resolved' ? (dispute.claude_verdict === 'pass' ? 'Won' : 'Lost') : 'Pending'}
                          </span>
                          {dispute.claude_reasoning && (
                            <span className="text-muted-foreground text-xs leading-tight block">
                              "{dispute.claude_reasoning}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No past goals found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
