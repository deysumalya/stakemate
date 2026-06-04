'use server'

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function createGoal(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const goalText = formData.get("goalText") as string;
  const deadlineStr = formData.get("deadline") as string; // time string like "14:30"
  const stakeAmount = formData.get("stakeAmount") as string;
  
  if (!goalText || !deadlineStr || !stakeAmount) {
    redirect('/new-goal?error=Missing fields');
  }

  // Parse deadline for today
  const [hours, minutes] = deadlineStr.split(':').map(Number);
  const deadlineDate = new Date();
  deadlineDate.setHours(hours, minutes, 0, 0);

  // Validate deadline is at least 2 hours from now
  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
  if (deadlineDate < twoHoursFromNow) {
    redirect('/new-goal?error=Deadline must be at least 2 hours from now');
  }

  const { error } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      goal_text: goalText,
      deadline: deadlineDate.toISOString(),
      stake_amount: parseFloat(stakeAmount),
      stake_type: "virtual", // V1 scope is virtual only
      status: "active"
    });

  if (error) {
    redirect('/new-goal?error=' + error.message);
  }

  redirect('/dashboard');
}
