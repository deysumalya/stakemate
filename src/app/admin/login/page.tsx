'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { verifyAdmin2FA } from "../actions"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const [key, setKey] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData()
    formData.append("secretKey", key)

    const result = await verifyAdmin2FA(formData)
    
    if (result.success) {
      router.push("/admin")
      router.refresh()
    } else {
      setError(result.error || "Authentication failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-black z-0" />
      
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-white/[0.08] relative z-10 shadow-2xl shadow-red-900/20">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
            <span className="text-2xl">🛡️</span>
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-white">Admin 2FA Gateway</CardTitle>
          <CardDescription className="text-red-200/60">
            You must be logged in as sumalyadey@gmail.com and provide the Admin Secret Key.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Secret Key</label>
              <Input 
                type="password" 
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="••••••••"
                className="bg-black/50 border-white/[0.1] text-center text-lg tracking-widest focus:border-red-500/50 focus:ring-red-500/20"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm text-center font-medium">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Authorize Access"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
