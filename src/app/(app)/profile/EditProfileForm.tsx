'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateProfileAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, User, Briefcase, Target, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function EditProfileForm({ userDetails }: { userDetails: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    
    const formData = new FormData(e.currentTarget)
    try {
      await updateProfileAction(formData)
      setSuccess(true)
      router.refresh() // Force Next.js to re-fetch the server component data
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="glass-card border border-white/[0.06] animate-sm-fade-in-up">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Profile updated successfully!
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2 group">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" /> Full Name
              </label>
              <Input 
                name="full_name" 
                defaultValue={userDetails?.full_name || ""}
                placeholder="e.g., Aryan Sharma" 
                required 
                className="h-12 bg-card/50 border-white/[0.08] focus-glow transition-all duration-300"
              />
            </div>

            <div className="space-y-2 group">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Occupation
              </label>
              <Input 
                name="occupation" 
                defaultValue={userDetails?.occupation || ""}
                placeholder="e.g., JEE Dropper, 2nd Year CSE, Software Engineer" 
                required 
                className="h-12 bg-card/50 border-white/[0.08] focus-glow transition-all duration-300"
              />
            </div>

            <div className="space-y-2 group">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" /> Target Goal
              </label>
              <Textarea 
                name="target_goal" 
                defaultValue={userDetails?.target_goal || ""}
                placeholder="e.g., Clear JEE Advanced with < 5000 rank" 
                required 
                className="min-h-[100px] resize-none bg-card/50 border-white/[0.08] focus-glow transition-all duration-300"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-black mt-2 animate-sm-glow-ring"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
