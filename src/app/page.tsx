import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Target, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
        <div className="font-bold text-xl tracking-tighter text-primary">STAKEMATE</div>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
            Login
          </Link>
          <Button asChild variant="default" size="sm">
            <Link href="/login">Start for Free</Link>
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto text-balance">
          Set a goal. Stake money. <br className="hidden md:inline" />
          <span className="text-primary">Get judged by strangers.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance">
          The ultimate productivity commitment contract platform. If you fail, you lose your stake. Can you prove you did the work?
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-24">
          <Button asChild size="lg" className="text-base font-semibold px-8">
            <Link href="/login">Start for Free</Link>
          </Button>
        </div>

        {/* How it Works */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full text-left">
          <div className="bg-card p-6 rounded-xl border border-border">
            <Target className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">1. Set a Binary Goal</h3>
            <p className="text-muted-foreground">Declare what you will accomplish today and put your money (or virtual credits) on the line.</p>
          </div>
          <div className="bg-card p-6 rounded-xl border border-border">
            <ShieldCheck className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">2. Submit Proof</h3>
            <p className="text-muted-foreground">Upload a screenshot, video, or link proving you finished the task before the deadline.</p>
          </div>
          <div className="bg-card p-6 rounded-xl border border-border">
            <Users className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">3. Face the Jury</h3>
            <p className="text-muted-foreground">Three anonymous peers will vote Pass or Fail. 2 out of 3 decides your fate. Fail, and we keep the money.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
