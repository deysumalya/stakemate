'use server'

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function completeOnboardingAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const full_name = formData.get('full_name') as string;
  const occupation = formData.get('occupation') as string;
  const target_goal = formData.get('target_goal') as string;

  if (!full_name || !occupation || !target_goal) {
    throw new Error("All fields are required");
  }

  const { error } = await supabase.from('users').update({
    full_name,
    occupation,
    target_goal,
    onboarding_completed: true
  }).eq('id', user.id);

  if (error) {
    console.error("Onboarding error:", error);
    throw new Error("Failed to save profile details.");
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
