'use server'

import { createClient } from "@/utils/supabase/server";

export async function submitReport(goalId: string, description: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
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
