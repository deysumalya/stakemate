'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { submitReport } from "./reportActions"

export function GoalHistoryList({ pastGoals }: { pastGoals: any[] }) {
  const [selectedGoal, setSelectedGoal] = useState<any>(null)
  const [isReporting, setIsReporting] = useState(false)
  const [reportDescription, setReportDescription] = useState("")
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)

  const handleReport = async () => {
    if (!reportDescription.trim()) return;
    setIsSubmittingReport(true);
    const result = await submitReport(selectedGoal.id, reportDescription);
    if (result.success) {
      setReportSuccess(true);
      setTimeout(() => {
        setIsReporting(false);
        setReportSuccess(false);
        setReportDescription("");
      }, 2000);
    } else {
      alert(result.error);
    }
    setIsSubmittingReport(false);
  }

  if (!pastGoals || pastGoals.length === 0) {
    return <p className="text-muted-foreground text-sm">No past goals yet.</p>
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {pastGoals.map((goal: any, index: number) => {
          const isPass = goal.effectiveStatus === "pass";
          const isForfeited = goal.status !== "resolved_fail" && goal.effectiveStatus === "fail";
          return (
            <div
              key={goal.id}
              className="animate-sm-fade-in-up cursor-pointer"
              style={{ animationDelay: `${index * 0.06}s` }}
              onClick={() => setSelectedGoal(goal)}
            >
              <Card className={`overflow-hidden glass-card card-hover-lift border-l-4 ${
                isPass ? 'border-l-primary' : 'border-l-destructive'
              } border border-white/[0.06]`}>
                <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        isPass 
                          ? 'bg-primary/15 text-primary shadow-[0_0_10px_rgba(57,255,20,0.15)]' 
                          : 'bg-destructive/15 text-destructive shadow-[0_0_10px_rgba(255,59,48,0.15)]'
                      }`}>
                        {isPass ? "Passed" : isForfeited ? "Forfeited" : "Failed"}
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
                      {isPass ? "+" : "-"}₹{(goal.pledge_amount || 0) / 100}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedGoal} onOpenChange={(open) => {
        if (!open) {
          setSelectedGoal(null);
          setIsReporting(false);
          setReportSuccess(false);
          setReportDescription("");
        }
      }}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-white/[0.08]">
          {selectedGoal && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Goal Details</DialogTitle>
                <DialogDescription>
                  Review your commitment details and verification status.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Status</h4>
                  <span className={`px-3 py-1 inline-block rounded-full text-xs font-black uppercase tracking-wider ${
                    selectedGoal.effectiveStatus === "pass"
                      ? 'bg-primary/15 text-primary shadow-[0_0_10px_rgba(57,255,20,0.15)]' 
                      : 'bg-destructive/15 text-destructive shadow-[0_0_10px_rgba(255,59,48,0.15)]'
                  }`}>
                    {selectedGoal.effectiveStatus === "pass" ? "Passed" : (selectedGoal.status !== "resolved_fail" ? "Forfeited" : "Failed")}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Your Commitment</h4>
                  <p className="text-sm font-medium">{selectedGoal.goal_text}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Required Proof</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedGoal.proof_description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Deadline</h4>
                    <p className="text-sm font-medium tabular-nums">
                      {new Date(selectedGoal.deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Amount Pledged</h4>
                    <p className={`text-sm font-black tabular-nums ${selectedGoal.effectiveStatus === "pass" ? 'text-primary' : 'text-destructive'}`}>
                      ₹{(selectedGoal.pledge_amount || 0) / 100}
                    </p>
                  </div>
                </div>
              </div>

              {isReporting ? (
                <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-3">
                  <h4 className="text-sm font-bold">Report an Issue</h4>
                  <Textarea 
                    placeholder="Describe why this goal was wrongly graded..."
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    className="bg-background/50 border-white/[0.1] text-sm"
                    rows={3}
                  />
                  {reportSuccess ? (
                    <div className="text-sm text-primary font-medium p-2 bg-primary/10 rounded-md text-center">
                      Report submitted successfully!
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsReporting(false)} disabled={isSubmittingReport}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleReport} disabled={isSubmittingReport || !reportDescription.trim()}>
                        {isSubmittingReport ? "Submitting..." : "Submit Report"}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/[0.08]">
                  <Button variant="ghost" className="text-xs text-muted-foreground hover:text-white" onClick={() => setIsReporting(true)}>
                    Report Issue
                  </Button>
                  <Button variant="secondary" onClick={() => setSelectedGoal(null)}>Close</Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
