import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitProof } from "./actions";
import { redirect } from "next/navigation";
import { UploadCloud, Link as LinkIcon } from "lucide-react";

export default async function SubmitProofPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch active goal that hasn't been submitted yet
  const { data: activeGoals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user?.id)
    .eq("status", "active")
    .is("submitted_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  const activeGoal = activeGoals?.[0];

  if (!activeGoal) {
    redirect("/dashboard?error=No active goal ready for submission");
  }

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Submit Proof</h1>
        <p className="text-muted-foreground">Prove to the jury that you completed your task.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Goal: {activeGoal.goal_text}</CardTitle>
          <CardDescription>
            Deadline: {new Date(activeGoal.deadline).toLocaleTimeString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="proof-form" action={submitProof} className="flex flex-col gap-6">
            <input type="hidden" name="goalId" value={activeGoal.id} />
            
            <div className="flex flex-col gap-4 p-4 border border-dashed border-border rounded-lg bg-muted/50">
              <h3 className="font-medium flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary" />
                Upload Image or Video
              </h3>
              <Input 
                id="proofFile" 
                name="proofFile" 
                type="file" 
                accept="image/*,video/*"
                className="cursor-pointer file:cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">Max size: 50MB. Clear screenshots work best.</p>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm uppercase">OR</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="font-medium flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary" />
                Provide a Link
              </h3>
              <Input 
                id="proofUrl" 
                name="proofUrl" 
                type="url" 
                placeholder="https://github.com/..." 
              />
              <p className="text-xs text-muted-foreground">Make sure the link is publicly accessible to the jury.</p>
            </div>

            {params?.error && (
              <p className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                {params.error}
              </p>
            )}
          </form>
        </CardContent>
        <CardFooter className="border-t border-border pt-6 flex justify-end gap-4">
          <Button variant="ghost" asChild>
            <a href="/dashboard">Cancel</a>
          </Button>
          <Button type="submit" form="proof-form">Submit for Review</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
