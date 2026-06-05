'use server'

import { createClient } from "@/utils/supabase/server";

export async function submitReport(goalId: string, description: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Check if report already exists
  const { data: existingReport } = await supabase
    .from('reports')
    .select('id')
    .eq('goal_id', goalId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingReport) {
    return { success: false, error: "You have already submitted a report for this goal." };
  }

  const { error } = await supabase
    .from('reports')
    .insert({
      goal_id: goalId,
      user_id: user.id,
      description: description,
      status: 'pending'
    });

  if (error) {
    console.error("Failed to submit report:", error);
    return { success: false, error: "Failed to submit report. Please try again." };
  }

  return { success: true };
}
