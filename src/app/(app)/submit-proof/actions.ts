'use server'

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { v4 as uuidv4 } from 'uuid';

export async function submitProof(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const goalId = formData.get("goalId") as string;
  const proofUrl = formData.get("proofUrl") as string;
  const proofFile = formData.get("proofFile") as File;

  if (!goalId || (!proofUrl && (!proofFile || proofFile.size === 0))) {
    redirect('/submit-proof?error=Please provide a URL or upload a file');
  }

  let finalProofUrl = proofUrl;
  let proofType = 'link';

  // Handle file upload if present
  if (proofFile && proofFile.size > 0) {
    const fileExt = proofFile.name.split('.').pop();
    const fileName = `${user.id}/${uuidv4()}.${fileExt}`;

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('proofs')
      .upload(fileName, proofFile);

    if (uploadError) {
      redirect(`/submit-proof?error=Failed to upload file: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('proofs')
      .getPublicUrl(fileName);

    finalProofUrl = publicUrl;
    proofType = proofFile.type.startsWith('video/') ? 'video' : 'image';
  }

  // Update goal
  const { error: updateError } = await supabase
    .from('goals')
    .update({
      proof_url: finalProofUrl,
      proof_type: proofType,
      submitted_at: new Date().toISOString(),
      // Status remains active until jury votes
    })
    .eq('id', goalId)
    .eq('user_id', user.id);

  if (updateError) {
    redirect(`/submit-proof?error=Failed to update goal: ${updateError.message}`);
  }

  redirect('/dashboard?message=Proof submitted successfully! Waiting for jury verdict.');
}
