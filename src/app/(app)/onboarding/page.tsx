'use client'

import { useState } from "react";
import { completeOnboardingAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Rocket, Target, Briefcase, User } from "lucide-react";

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    try {
      await completeOnboardingAction(formData);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] w-full max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8 animate-sm-fade-in-up">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(57,255,20,0.15)]">
          <Rocket className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-3">Welcome to Stakemate</h1>
        <p className="text-muted-foreground text-lg">
          Before you start committing, let's personalize your AI judge.
        </p>
      </div>

      <Card className="w-full glass-strong animated-border animate-sm-slide-in-bottom delay-100">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
          <CardDescription className="text-base">
            The AI uses this context to verify your goals strictly and fairly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2 group">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" /> Full Name
                </label>
                <Input 
                  name="full_name" 
                  placeholder="e.g., Aryan Sharma" 
                  required 
                  className="h-12 bg-card/50 border-white/[0.08] focus-glow transition-all duration-300"
                />
              </div>

              <div className="space-y-2 group">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> What do you do?
                </label>
                <Input 
                  name="occupation" 
                  placeholder="e.g., JEE Dropper, 2nd Year CSE, Software Engineer" 
                  required 
                  className="h-12 bg-card/50 border-white/[0.08] focus-glow transition-all duration-300"
                />
                <p className="text-xs text-muted-foreground ml-1">
                  Be specific so the AI understands your daily routine.
                </p>
              </div>

              <div className="space-y-2 group">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Target className="w-4 h-4" /> What is your primary target this year?
                </label>
                <Textarea 
                  name="target_goal" 
                  placeholder="e.g., Clear JEE Advanced with < 5000 rank, or Land a remote dev job, or Get band 8 in IELTS" 
                  required 
                  className="min-h-[100px] resize-none bg-card/50 border-white/[0.08] focus-glow transition-all duration-300"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-black mt-4 animate-sm-glow-ring transition-transform hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                "Save & Enter Stakemate"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
