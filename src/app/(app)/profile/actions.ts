'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const full_name = formData.get('full_name') as string;
  const occupation = formData.get('occupation') as string;
  const target_goal = formData.get('target_goal') as string;

  if (!full_name || !occupation || !target_goal) {
    throw new Error("All fields are required");
  }

  const { error } = await supabase.from('users').upsert({
    id: user.id,
    full_name,
    occupation,
    target_goal
  });

  if (error) {
    return { success: false, error: JSON.stringify(error) };
  }

  revalidatePath('/profile');
  return { success: true };
}
