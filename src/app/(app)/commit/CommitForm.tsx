'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { negotiateGoalAction, acceptAndLockGoal, pollMatrixRequestAction } from "./actions"
import { Loader2, Sparkles, AlertTriangle, FastForward } from "lucide-react"

export function CommitForm({ availableBalance }: { availableBalance: number }) {
  const router = useRouter()
  const [goalText, setGoalText] = useState("")
  const [proofText, setProofText] = useState("")
  const [hours, setHours] = useState("2")
  const [customDeadline, setCustomDeadline] = useState("")
  const [pledge, setPledge] = useState("20")
  const [customPledge, setCustomPledge] = useState("")
  
  const [isNegotiating, setIsNegotiating] = useState(false)
  const [negotiationResult, setNegotiationResult] = useState<any>(null)
  const [topicList, setTopicList] = useState("")
  const [error, setError] = useState("")
  const [isLocking, setIsLocking] = useState(false)
  const [matrixRequestId, setMatrixRequestId] = useState<string | null>(null)

  // Polling effect for Matrix
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (matrixRequestId && isNegotiating) {
      interval = setInterval(async () => {
        try {
          const res = await pollMatrixRequestAction(matrixRequestId);
          if (res.success && res.isComplete) {
            setNegotiationResult(res.data);
            setIsNegotiating(false);
            setMatrixRequestId(null);
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [matrixRequestId, isNegotiating]);

  const handleNegotiate = async () => {
    if (!goalText || !proofText) return;
    
    // Check deadline if custom
    if (hours === "custom") {
      if (!customDeadline) {
        setError("Please select a custom deadline.");
        return;
      }
      const selectedDate = new Date(customDeadline);
      const now = new Date();
      if (selectedDate <= now) {
        setError("Deadline must be in the future.");
        return;
      }
      const diffHours = (selectedDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours > 48) {
        setError("Deadline cannot be more than 48 hours in the future.");
        return;
      }
    }
    
    // Check balance before wasting AI credits
    const pledgeRupees = pledge === "custom" ? Number(customPledge) : Number(pledge);
    if (!pledgeRupees || pledgeRupees <= 0) {
      setError("Please enter a valid deposit amount.");
      return;
    }
    if (pledgeRupees > 1000) {
      setError("Maximum commitment deposit is ₹1000.");
      return;
    }
    
    const pledgePaise = pledgeRupees * 100;
    if (availableBalance < pledgePaise) {
      setError(`Insufficient balance. You need ₹${pledgeRupees} but only have ₹${availableBalance / 100}. Please load your wallet from the dashboard.`);
      return;
    }

    setIsNegotiating(true);
    setError("");
    setNegotiationResult(null);

    const res = await negotiateGoalAction(goalText, proofText);
    if (res.success) {
      if (res.isMatrix) {
        setMatrixRequestId(res.matrixRequestId);
      } else {
        setNegotiationResult(res.data);
        setIsNegotiating(false);
      }
    } else {
      setError(res.error || "Something went wrong.");
      setIsNegotiating(false);
    }
  }

  const handleBypass = async () => {
    // Check balance before bypassing
    const pledgeRupees = pledge === "custom" ? Number(customPledge) : Number(pledge);
    if (!pledgeRupees || pledgeRupees <= 0) return;
    
    const pledgePaise = pledgeRupees * 100;
    if (availableBalance < pledgePaise) {
      setError(`Insufficient balance. You need ₹${pledgeRupees} but only have ₹${availableBalance / 100}. Please load your wallet from the dashboard.`);
      return;
    }

    setIsLocking(true);
    let deadlineDate: Date;
    if (hours === "custom") {
      deadlineDate = new Date(customDeadline);
    } else {
      deadlineDate = new Date();
      deadlineDate.setHours(deadlineDate.getHours() + parseInt(hours));
    }

    try {
      const result = await acceptAndLockGoal(
        goalText,
        proofText,
        deadlineDate.toISOString(),
        pledgePaise,
        'other', // dummy category
        null,
        {
          is_goal_acceptable: true,
          category: 'other',
          negotiated_proof_description: 'Bypassed AI negotiation. Original proof: ' + proofText,
          verification_requirements: ['Manual Bypass'],
          timer_required_in_minutes: 0,
          topic_list_required: false,
          ai_message_to_user: 'You bypassed the AI.',
          rejection_reason: null
        }
      );
      
      if (result.success) {
        router.push('/dashboard');
      }
    } catch (e: any) {
      setError(e.message || "Failed to lock commitment");
      setIsLocking(false);
    }
  }

  const handleLock = async () => {
    setIsLocking(true);
    // Calculate deadline
    let deadlineDate: Date;
    if (hours === "custom") {
      deadlineDate = new Date(customDeadline);
    } else {
      deadlineDate = new Date();
      deadlineDate.setHours(deadlineDate.getHours() + parseInt(hours));
    }

    try {
      const pledgeRupees = pledge === "custom" ? Number(customPledge) : Number(pledge);
      const pledgePaise = pledgeRupees * 100;
      const result = await acceptAndLockGoal(
        goalText,
        proofText,
        deadlineDate.toISOString(),
        pledgePaise,
        negotiationResult.category,
        negotiationResult.topic_list_required ? topicList : null,
        negotiationResult
      );
      
      if (result.success) {
        router.push('/dashboard');
      }
    } catch (e: any) {
      setError(e.message || "Failed to lock commitment");
      setIsLocking(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">

      {/* Step 1: Goal Input */}
      <div className="flex flex-col gap-6 animate-sm-fade-in-up">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-[0.15em] text-primary/70 flex items-center gap-2">
            <span className="inline-block w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center border border-primary/20">1</span>
            I commit to
          </label>
          <Textarea 
            placeholder="e.g., Study Thermodynamics Chapter 4 for JEE"
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            disabled={!!negotiationResult}
            className="text-lg resize-none bg-card/50 border-white/[0.08] focus:border-primary/50 focus-glow transition-all duration-300 rounded-xl placeholder:text-muted-foreground/50"
            rows={3}
          />
        </div>

        {/* Step 2: Proof */}
        <div className="flex flex-col gap-2 animate-sm-fade-in-up stagger-2">
          <label className="text-xs font-black uppercase tracking-[0.15em] text-primary/70 flex items-center gap-2">
            <span className="inline-block w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center border border-primary/20">2</span>
            I will prove it by
          </label>
          <Textarea 
            placeholder="e.g., Uploading a photo of my rough calculations"
            value={proofText}
            onChange={(e) => setProofText(e.target.value)}
            disabled={!!negotiationResult}
            className="text-lg resize-none bg-card/50 border-white/[0.08] focus:border-primary/50 focus-glow transition-all duration-300 rounded-xl placeholder:text-muted-foreground/50"
            rows={2}
          />
        </div>

        {/* Step 3: Deadline + Pledge */}
        {!negotiationResult && (
          <div className="grid grid-cols-2 gap-4 animate-sm-fade-in-up stagger-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-[0.15em] text-primary/70 flex items-center gap-2">
                <span className="inline-block w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center border border-primary/20">3</span>
                Deadline
              </label>
              <Select value={hours} onValueChange={setHours}>
                <SelectTrigger className="bg-card/50 border-white/[0.08] rounded-xl focus:border-primary/50">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/[0.08] rounded-xl">
                  <SelectItem value="2">In 2 Hours</SelectItem>
                  <SelectItem value="4">In 4 Hours</SelectItem>
                  <SelectItem value="12">In 12 Hours</SelectItem>
                  <SelectItem value="24">In 24 Hours</SelectItem>
                  <SelectItem value="48">In 48 Hours</SelectItem>
                  <SelectItem value="custom">Custom Date & Time</SelectItem>
                </SelectContent>
              </Select>
              
              {hours === "custom" && (
                <div className="mt-2 relative animate-sm-fade-in-up">
                  <Input 
                    type="datetime-local"
                    value={customDeadline}
                    onChange={(e) => setCustomDeadline(e.target.value)}
                    className="bg-card/50 border-white/[0.08] focus:border-primary/50 focus-glow rounded-xl h-10 w-full text-sm font-medium text-foreground"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-[0.15em] text-primary/70 flex items-center gap-2">
                <span className="inline-block w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center border border-primary/20">4</span>
                Deposit
              </label>
              <Select value={pledge} onValueChange={setPledge}>
                <SelectTrigger className="bg-card/50 border-white/[0.08] rounded-xl focus:border-primary/50">
                  <SelectValue placeholder="₹ Amount" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/[0.08] rounded-xl">
                  <SelectItem value="10">₹10 (Tiny Sting)</SelectItem>
                  <SelectItem value="20">₹20 (Standard)</SelectItem>
                  <SelectItem value="50">₹50 (Serious)</SelectItem>
                  <SelectItem value="100">₹100 (Painful)</SelectItem>
                  <SelectItem value="500">₹500 (Extreme)</SelectItem>
                  <SelectItem value="1000">₹1000 (Maximum)</SelectItem>
                  <SelectItem value="custom">Custom Amount</SelectItem>
                </SelectContent>
              </Select>
              
              {pledge === "custom" && (
                <div className="mt-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                  <Input 
                    type="number"
                    min="1"
                    max="1000"
                    placeholder="Enter amount"
                    value={customPledge}
                    onChange={(e) => setCustomPledge(e.target.value)}
                    className="pl-8 bg-card/50 border-white/[0.08] focus:border-primary/50 focus-glow rounded-xl h-10"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm border border-destructive/20 animate-sm-fade-in-up flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Negotiate Button */}
      {!negotiationResult ? (
        <div className="flex flex-col gap-3">
          <Button 
            size="lg" 
            className={`w-full font-black text-lg rounded-xl h-14 relative overflow-hidden transition-all duration-300 ${
              !isNegotiating && goalText && proofText 
                ? 'animate-sm-shimmer' 
                : ''
            }`}
            onClick={handleNegotiate}
            disabled={isNegotiating || !goalText || !proofText}
          >
            {isNegotiating ? (
              <span className="flex items-center gap-3">
                {/* Brain loading animation */}
                <span className="relative">
                  <span className="text-2xl animate-sm-brain-pulse inline-block">🧠</span>
                  <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1 animate-sm-sparkle" />
                </span>
                <span>{matrixRequestId ? "Awaiting MATRIX (Check Admin)..." : "Analyzing Loopholes…"}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Negotiate with AI
              </span>
            )}
          </Button>

          <Button 
            size="lg" 
            variant="outline"
            className="w-full font-bold rounded-xl border-dashed border-white/20 text-muted-foreground hover:text-foreground hover:bg-white/5"
            onClick={handleBypass}
            disabled={isNegotiating || !goalText || !proofText || isLocking}
          >
            <FastForward className="w-4 h-4 mr-2" />
            Bypass AI (Dev Mode)
          </Button>
        </div>
      ) : (
        /* AI Verdict */
        <div className="flex flex-col gap-6 animate-sm-slide-in-bottom">
          <div className={`p-6 rounded-2xl border-2 relative overflow-hidden ${
            negotiationResult.is_goal_acceptable 
              ? 'border-primary/30 bg-primary/[0.04]' 
              : 'border-destructive/30 bg-destructive/[0.04]'
          }`}>
            {/* Ambient glow */}
            <div className={`absolute inset-0 pointer-events-none ${
              negotiationResult.is_goal_acceptable 
                ? 'bg-gradient-to-br from-primary/[0.05] to-transparent' 
                : 'bg-gradient-to-br from-destructive/[0.05] to-transparent'
            }`} />

            <h3 className="font-black text-lg mb-3 flex items-center gap-2 relative">
              <span className={`p-1.5 rounded-lg ${
                negotiationResult.is_goal_acceptable ? 'bg-primary/10' : 'bg-destructive/10'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  negotiationResult.is_goal_acceptable ? 'text-primary' : 'text-destructive'
                }`} />
              </span>
              AI Interrogator Verdict
            </h3>
            
            {!negotiationResult.is_goal_acceptable ? (
              <div className="flex flex-col gap-4 relative">
                <div className="flex flex-col gap-2">
                  <p className="text-destructive font-bold leading-relaxed">{negotiationResult.rejection_reason}</p>
                  {negotiationResult.ai_message_to_user && (
                    <p className="text-foreground/80 text-sm leading-relaxed border-l-2 border-primary/30 pl-3 py-1 bg-white/[0.02] rounded-r">
                      <span className="font-bold text-primary block mb-1">AI Coach Note:</span>
                      {negotiationResult.ai_message_to_user}
                    </p>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setNegotiationResult(null)}
                  className="rounded-xl border-white/[0.08]"
                >
                  Revise My Proof
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-5 relative">
                <p className="text-foreground/90 leading-relaxed">{negotiationResult.ai_message_to_user}</p>
                
                {/* Verification Checklist */}
                <div className="mt-2 p-5 bg-background/40 rounded-xl border border-white/[0.06]">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Final Verification Checklist
                  </p>
                  <ul className="space-y-2">
                    {negotiationResult.verification_requirements.map((req: string, i: number) => (
                      <li 
                        key={i} 
                        className="animate-sm-check-in flex items-start gap-3 text-sm text-foreground/80"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        <span className="text-primary mt-0.5 shrink-0">▸</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                  {negotiationResult.timer_required_in_minutes > 0 && (
                    <div className="mt-4 inline-flex items-center gap-2 text-xs font-black text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20">
                      ⏱️ TIMED TEST: {negotiationResult.timer_required_in_minutes} MINUTES
                    </div>
                  )}
                </div>

                {/* Topic list input */}
                {negotiationResult.topic_list_required && (
                  <div className="flex flex-col gap-2 animate-sm-fade-in-up">
                    <label className="text-sm font-bold text-foreground">
                      List the specific topics you will study (Comma separated):
                    </label>
                    <Input 
                      placeholder="e.g. Newton's Laws, Friction, Kinematics" 
                      value={topicList}
                      onChange={(e) => setTopicList(e.target.value)}
                      className="bg-card/50 border-white/[0.08] focus:border-primary/50 focus-glow rounded-xl"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 mt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl border-white/[0.08]" 
                    onClick={() => setNegotiationResult(null)} 
                    disabled={isLocking}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 font-black rounded-xl relative overflow-hidden animate-sm-glow-ring"
                    onClick={handleLock}
                    disabled={isLocking || (negotiationResult.topic_list_required && !topicList)}
                  >
                    {isLocking ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>🔒</span>
                        Accept & Lock ₹{pledge === "custom" ? customPledge : pledge}
                      </span>
                    )}
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
