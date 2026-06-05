import { createClient } from "@/utils/supabase/server";
import { MatrixDashboard } from "./MatrixDashboard";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MatrixPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Unauthorized</div>;

  const { data: requests, error } = await supabase
    .from('matrix_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    console.error(error);
    return <div>Error loading requests</div>;
  }

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-primary">MATRIX DASHBOARD 👁️</h1>
        <p className="text-muted-foreground">Human-in-the-loop AI Simulator. Fulfill pending AI requests manually to avoid Vercel timeouts.</p>
      </div>

      {(!requests || requests.length === 0) ? (
        <div className="p-12 border border-dashed border-white/10 rounded-xl text-center flex flex-col gap-4">
          <p className="text-2xl">💤</p>
          <p className="text-muted-foreground">No pending requests right now.</p>
        </div>
      ) : (
        <MatrixDashboard initialRequests={requests} />
      )}
    </div>
  );
}
