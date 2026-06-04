import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { castVote } from "./actions";
import { Check, X } from "lucide-react";
import Image from "next/image";

export default async function JuryPage({
  searchParams,
}: {
  searchParams: Promise<{ warning?: string }>
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch a proof to review
  // 1. Must be active and submitted
  // 2. Not my own
  // 3. I haven't voted on it yet
  
  // Note: Complex queries like this are best done via DB functions, but for V1 we do it here.
  const { data: myVotes } = await supabase.from('jury_votes').select('goal_id').eq('juror_id', user.id);
  const votedGoalIds = myVotes?.map(v => v.goal_id) || [];

  let query = supabase
    .from('goals')
    .select('*')
    .eq('status', 'active')
    .neq('user_id', user.id)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: true })
    .limit(1);

  if (votedGoalIds.length > 0) {
    query = query.not('id', 'in', `(${votedGoalIds.join(',')})`);
  }

  const { data: pendingGoals } = await query;
  const goal = pendingGoals?.[0];

  // Honeypot injection logic (simplified for V1: 5% chance if we have honeypots)
  const isHoneypotRoll = Math.random() < 0.05;
  let displayItem = null;

  if (isHoneypotRoll) {
    const { data: honeypots } = await supabase.from('honeypot_proofs').select('*').eq('active', true).limit(1);
    if (honeypots && honeypots.length > 0) {
      displayItem = {
        id: honeypots[0].id,
        goal_text: honeypots[0].goal_text,
        proof_url: honeypots[0].proof_url,
        proof_type: 'image',
        isHoneypot: true,
        expectedVerdict: honeypots[0].expected_verdict
      };
    }
  }

  if (!displayItem && goal) {
    displayItem = {
      id: goal.id,
      goal_text: goal.goal_text,
      proof_url: goal.proof_url,
      proof_type: goal.proof_type,
      isHoneypot: false
    };
  }

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Jury Duty</h1>
        <p className="text-muted-foreground">Review submitted proofs. 2-out-of-3 consensus decides the verdict.</p>
      </div>

      {params?.warning && (
        <div className="p-4 bg-destructive text-destructive-foreground rounded-lg font-medium">
          {params.warning}
        </div>
      )}

      {displayItem ? (
        <Card className="overflow-hidden border-2 border-border shadow-lg">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardDescription className="text-sm uppercase tracking-wider font-semibold text-primary">Goal to verify</CardDescription>
            <CardTitle className="text-2xl">{displayItem.goal_text}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {displayItem.proof_type === 'image' ? (
              <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
                {/* Fallback img tag for simplicity if remote patterns not set in next.config */}
                <img 
                  src={displayItem.proof_url} 
                  alt="Proof submitted by user" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : displayItem.proof_type === 'video' ? (
              <video 
                src={displayItem.proof_url} 
                controls 
                className="w-full aspect-video bg-black"
              />
            ) : (
              <div className="p-12 flex flex-col items-center justify-center text-center gap-4 bg-muted/20">
                <p className="text-muted-foreground">User submitted a link as proof:</p>
                <a 
                  href={displayItem.proof_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all px-8 text-lg font-medium"
                >
                  {displayItem.proof_url}
                </a>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex p-6 gap-4 bg-muted/10 border-t border-border">
            <form action={castVote} className="flex-1">
              <input type="hidden" name="goalId" value={displayItem.id} />
              <input type="hidden" name="vote" value="pass" />
              <input type="hidden" name="isHoneypot" value={displayItem.isHoneypot ? 'true' : 'false'} />
              {displayItem.isHoneypot && (
                <input type="hidden" name="expectedVerdict" value={displayItem.expectedVerdict} />
              )}
              <Button type="submit" variant="outline" className="w-full h-16 text-lg border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all">
                <Check className="mr-2 h-6 w-6" /> Pass
              </Button>
            </form>

            <form action={castVote} className="flex-1">
              <input type="hidden" name="goalId" value={displayItem.id} />
              <input type="hidden" name="vote" value="fail" />
              <input type="hidden" name="isHoneypot" value={displayItem.isHoneypot ? 'true' : 'false'} />
              {displayItem.isHoneypot && (
                <input type="hidden" name="expectedVerdict" value={displayItem.expectedVerdict} />
              )}
              <Button type="submit" variant="outline" className="w-full h-16 text-lg border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all">
                <X className="mr-2 h-6 w-6" /> Fail
              </Button>
            </form>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">Queue Empty!</h2>
            <p className="text-muted-foreground max-w-sm">
              You've reviewed all available proofs. Check back later to earn more tally points towards your free subscription.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
