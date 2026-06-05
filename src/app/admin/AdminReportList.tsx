'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { adminResolveGoal } from "./actions"

export function AdminReportList({ reports }: { reports: any[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleOverride = async (reportId: string, goalId: string, userId: string, verdict: 'pass' | 'fail', pledgeAmount: number) => {
    if (!confirm(`Are you sure you want to FORCE ${verdict.toUpperCase()} this goal? This cannot be easily undone.`)) return;
    
    setProcessingId(reportId);
    const result = await adminResolveGoal(reportId, goalId, userId, verdict, pledgeAmount);
    
    if (result.success) {
      alert("Override successful!");
      window.location.reload(); // Quick way to refresh the list
    } else {
      alert(result.error);
    }
    setProcessingId(null);
  }

  return (
    <div className="space-y-6">
      {reports.map((report) => {
        const goal = report.goals;
        const user = report.users;
        const isProcessing = processingId === report.id;

        return (
          <div key={report.id} className="p-5 rounded-lg border border-white/[0.08] bg-black/40 space-y-4">
            
            {/* Header: User and Report Time */}
            <div className="flex justify-between items-start border-b border-white/[0.08] pb-3">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold mb-1">Reporter</p>
                <p className="font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground">{user?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{new Date(report.created_at).toLocaleString()}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-yellow-500/20 text-yellow-500">
                  Pending Review
                </span>
              </div>
            </div>

            {/* Issue Description */}
            <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-md">
              <p className="text-xs text-red-400 uppercase tracking-wider font-bold mb-1">User's Issue</p>
              <p className="text-sm whitespace-pre-wrap">{report.description}</p>
            </div>

            {/* Goal Details Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Original Goal</p>
                <p className="text-sm font-medium">{goal?.goal_text}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Current Status</p>
                <p className="text-sm font-medium capitalize">{goal?.status.replace('_', ' ')}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Required Proof</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{goal?.proof_description}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-white/[0.08] flex gap-3 justify-end">
              <Button 
                variant="destructive" 
                className="bg-red-900/50 hover:bg-red-900 text-red-200"
                onClick={() => handleOverride(report.id, goal.id, user.id, 'fail', goal.pledge_amount)}
                disabled={isProcessing}
              >
                Force Fail
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => handleOverride(report.id, goal.id, user.id, 'pass', goal.pledge_amount)}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Force Pass & Refund"}
              </Button>
            </div>

          </div>
        )
      })}
    </div>
  )
}
