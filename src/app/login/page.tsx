import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const params = await searchParams;
  return (
    <div className="flex flex-1 items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-primary">Stakemate</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <Button formAction={login} className="w-full">
              Send Magic Link
            </Button>
            
            {params?.message && (
              <p className="mt-4 p-4 bg-muted text-center text-sm">{params.message}</p>
            )}
            {params?.error && (
              <p className="mt-4 p-4 bg-destructive/10 text-destructive text-center text-sm">{params.error}</p>
            )}
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Note: Google OAuth requires Supabase dashboard setup, keeping UI for completeness */}
          <Button variant="outline" className="w-full" type="button">
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
