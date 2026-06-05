'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { fulfillMatrixRequestAction } from "./actions"
import { Loader2 } from "lucide-react"

export function MatrixDashboard({ initialRequests }: { initialRequests: any[] }) {
  const [requests, setRequests] = useState(initialRequests)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const handleCopy = (req: any) => {
    const fullPrompt = `${req.system_prompt}\n\n---\n\n${req.user_prompt}`;
    navigator.clipboard.writeText(fullPrompt);
  }

  const handleSubmit = async (reqId: string) => {
    const jsonStr = responses[reqId];
    if (!jsonStr) return;

    setLoading(prev => ({ ...prev, [reqId]: true }));
    const res = await fulfillMatrixRequestAction(reqId, jsonStr);
    setLoading(prev => ({ ...prev, [reqId]: false }));

    if (res.success) {
      setRequests(prev => prev.filter(r => r.id !== reqId));
    } else {
      alert("Failed to submit: " + res.error);
    }
  }

  const getTemplate = (req: any) => {
    if (req.system_prompt?.includes("[TOPIC_VERIFICATION]")) {
      return '{\n  "is_valid": true,\n  "reason": null\n}';
    } else if (req.system_prompt?.includes("You are the final judge")) {
      return '{\n  "verdict": "PASS",\n  "reasoning": "Looks good.",\n  "mcq_score": 2,\n  "work_quality": "sufficient"\n}';
    } else if (req.system_prompt?.includes("You are generating a quiz")) {
      return '{\n  "questions": [\n    {\n      "question": "Sample Question",\n      "options": {"A": "1", "B": "2", "C": "3", "D": "4"},\n      "correct_answer": "A"\n    }\n  ]\n}';
    } else {
      return '{\n  "is_goal_acceptable": true,\n  ...\n}';
    }
  }

  const getTitle = (req: any) => {
    if (req.system_prompt?.includes("[TOPIC_VERIFICATION]")) return "Topic Verification";
    if (req.system_prompt?.includes("You are the final judge")) return "Proof Judgment";
    if (req.system_prompt?.includes("You are generating a quiz")) return "MCQ Generation";
    return "Goal Negotiation";
  }

  return (
    <div className="flex flex-col gap-6">
      {requests.map(req => {
        let displayPrompt = req.user_prompt;
        try {
          const parsed = JSON.parse(req.user_prompt);
          displayPrompt = JSON.stringify(parsed, null, 2);
        } catch(e) {}

        return (
          <div key={req.id} className="p-6 rounded-xl border border-primary/20 bg-primary/[0.02] flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-mono text-muted-foreground">ID: {req.id}</p>
                <p className="text-sm font-bold mt-1 text-primary">{getTitle(req)}</p>
              </div>
              <Button variant="outline" onClick={() => handleCopy(req)} className="shrink-0 border-primary/50 text-primary hover:bg-primary/10">
                Copy Full Prompt
              </Button>
            </div>
            
            <div className="bg-card/50 p-4 rounded-lg overflow-x-auto">
              <pre className="text-xs font-mono text-foreground/80">{displayPrompt}</pre>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Paste Claude's JSON Response here:</label>
              <Textarea 
                className="font-mono text-sm h-48 bg-card/50"
                value={responses[req.id] || ""}
                onChange={(e) => setResponses(prev => ({ ...prev, [req.id]: e.target.value }))}
                placeholder={getTemplate(req)}
              />
            </div>

            <Button 
              className="w-full font-black text-lg" 
              onClick={() => handleSubmit(req.id)}
              disabled={loading[req.id] || !responses[req.id]}
            >
              {loading[req.id] ? <Loader2 className="w-5 h-5 animate-spin" /> : "Fulfill Request"}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
