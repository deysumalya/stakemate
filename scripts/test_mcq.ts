import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Testing Matrix insertion...");
  const { data, error } = await supabase
    .from('matrix_requests')
    .insert({
      user_id: 'e6a88b50-3d12-4f36-93a8-8e6f1f50a8c2', // dummy or existing
      system_prompt: 'TEST',
      user_prompt: 'TEST',
      status: 'pending'
    })
    .select('id')
    .single();

  console.log(error || data);
}
run();
