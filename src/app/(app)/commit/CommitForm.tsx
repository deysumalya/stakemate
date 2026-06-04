'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { negotiateGoalAction, acceptAndLockGoal } from "./actions"
import { Loader2, Sparkles, AlertTriangle } from "lucide-react"

export function CommitForm({ availableBalance }: { availableBalance: number }) {
  const [goalText, setGoalText] = useState("")
  const [proofText, setProofText] = useState("")
  const [hours, setHours] = useState("2")
  const [pledge, setPledge] = useState("20")
  
  const [isNegotiating, setIsNegotiating] = useState(false)
  const [negotiationResult, setNegotiationResult] = useState<any>(null)
  const [topicList, setTopicList] = useState("")
  const [error, setError] = useState("")
  const [isLocking, setIsLocking] = useState(false)

  const handleNegotiate = async () => {
    if (!goalText || !proofText) return;
    setIsNegotiating(true);
    setError("");
    setNegotiationResult(null);

    const res = await negotiateGoalAction(goalText, proofText);
    if (res.success) {
      setNegotiationResult(res.data);
    } else {
      setError(res.error || "Something went wrong.");
    }
    setIsNegotiating(false);
  }

  const handleLock = async () => {
    setIsLocking(true);
    // Calculate deadline
    const deadlineDate = new Date();
    deadlineDate.setHours(deadlineDate.getHours() + parseInt(hours));

    try {
      await acceptAndLockGoal(
        goalText,
        proofText,
        deadlineDate.toISOString(),
        parseInt(pledge),
        negotiationResult.category,
        negotiationResult.topic_list_required ? topicList : null,
        negotiationResult
      );
    } catch (e: any) {
      setError(e.message || "Failed to lock commitment");
      setIsLocking(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">I commit to:</label>
          <Textarea 
            placeholder="e.g., Study Thermodynamics Chapter 4 for JEE"
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            disabled={!!negotiationResult}
            className="text-lg resize-none"
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">I will prove it by:</label>
          <Textarea 
            placeholder="e.g., Uploading a photo of my rough calculations"
            value={proofText}
            onChange={(e) => setProofText(e.target.value)}
            disabled={!!negotiationResult}
            className="text-lg resize-none"
            rows={2}
          />
        </div>

        {!negotiationResult && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Deadline</label>
              <Select value={hours} onValueChange={setHours}>
                <SelectTrigger>
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">In 2 Hours</SelectItem>
                  <SelectItem value="4">In 4 Hours</SelectItem>
                  <SelectItem value="12">In 12 Hours</SelectItem>
                  <SelectItem value="24">In 24 Hours</SelectItem>
                  <SelectItem value="48">In 48 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pledge Amount</label>
              <Select value={pledge} onValueChange={setPledge}>
                <SelectTrigger>
                  <SelectValue placeholder="₹ Amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">₹10 (Tiny Sting)</SelectItem>
                  <SelectItem value="20">₹20 (Standard)</SelectItem>
                  <SelectItem value="50">₹50 (Serious)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm border border-destructive/20">
          {error}
        </div>
      )}

      {!negotiationResult ? (
        <Button 
          size="lg" 
          className="w-full font-bold text-lg" 
          onClick={handleNegotiate}
          disabled={isNegotiating || !goalText || !proofText}
        >
          {isNegotiating ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing Loophole...</>
          ) : (
            <><Sparkles className="mr-2 h-5 w-5" /> Negotiate with AI</>
          )}
        </Button>
      ) : (
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className={`p-6 rounded-xl border-2 ${negotiationResult.is_goal_acceptable ? 'border-primary/50 bg-primary/5' : 'border-destructive/50 bg-destructive/5'}`}>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${negotiationResult.is_goal_acceptable ? 'text-primary' : 'text-destructive'}`} />
              AI Interrogator Verdict
            </h3>
            
            {!negotiationResult.is_goal_acceptable ? (
              <div className="flex flex-col gap-4">
                <p className="text-destructive font-medium">{negotiationResult.rejection_reason}</p>
                <Button variant="outline" onClick={() => setNegotiationResult(null)}>Revise My Proof</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-foreground">{negotiationResult.ai_message_to_user}</p>
                
                <div className="mt-4 p-4 bg-background rounded border border-border">
                  <p className="text-sm font-bold text-muted-foreground uppercase mb-2">Final Verification Checklist</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {negotiationResult.verification_requirements.map((req: string, i: number) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                  {negotiationResult.timer_required_in_minutes > 0 && (
                    <p className="mt-4 text-xs font-bold text-orange-500 bg-orange-500/10 inline-block px-2 py-1 rounded">
                      ⏱️ TIMED TEST: {negotiationResult.timer_required_in_minutes} MINUTES
                    </p>
                  )}
                </div>

                {negotiationResult.topic_list_required && (
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-sm font-bold text-foreground">List the specific topics you will study (Comma separated):</label>
                    <Input 
                      placeholder="e.g. Newton's Laws, Friction, Kinematics" 
                      value={topicList}
                      onChange={(e) => setTopicList(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex gap-4 mt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setNegotiationResult(null)} disabled={isLocking}>Cancel</Button>
                  <Button 
                    className="flex-1 font-bold" 
                    onClick={handleLock}
                    disabled={isLocking || (negotiationResult.topic_list_required && !topicList)}
                  >
                    {isLocking ? <Loader2 className="w-5 h-5 animate-spin" /> : `Accept & Lock ₹${pledge}`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
