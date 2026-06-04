'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function fulfillMatrixRequestAction(requestId: string, responseJson: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    const parsed = JSON.parse(responseJson);

    const { error } = await supabase
      .from('matrix_requests')
      .update({
        response_json: parsed,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) throw error;
    
    revalidatePath('/matrix');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to fulfill request" };
  }
}
