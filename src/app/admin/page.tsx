import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminReportList } from "./AdminReportList"
import { adminLogout } from "./actions"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = await createClient()
  const sessionCookie = cookies().get("admin_2fa_session")

  // Verify Admin Authentication strictly
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== "sumalyadey@gmail.com" || sessionCookie?.value !== "verified") {
    redirect("/admin/login")
  }

  // Fetch pending reports with goal details
  const { data: pendingReports } = await supabase
    .from("reports")
    .select(`
      id,
      description,
      status,
      created_at,
      goals (
        id,
        goal_text,
        proof_description,
        pledge_amount,
        status,
        effective_status,
        deadline,
        created_at
      ),
      users (
        id,
        email,
        name
      )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span className="text-red-500">🛡️</span> Admin Command Center
            </h1>
            <p className="text-muted-foreground mt-1">Review user reports and override AI verdicts manually.</p>
          </div>
          
          <form action={adminLogout}>
            <Button variant="outline" className="border-white/[0.1] hover:bg-white/[0.05]">
              Lock Terminal (Logout)
            </Button>
          </form>
        </div>

        <div className="grid gap-6">
          <Card className="bg-card/50 border-white/[0.08] backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">Pending Reports ({pendingReports?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingReports && pendingReports.length > 0 ? (
                <AdminReportList reports={pendingReports} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <span className="text-4xl mb-4 inline-block opacity-50">☕</span>
                  <p>All caught up! No pending reports.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
