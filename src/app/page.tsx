"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  Target,
  Bot,
  Camera,
  Trophy,
  ChevronDown,
  Sparkles,
  GraduationCap,
  Code2,
  Globe,
  ArrowRight,
  Star,
  Shield,
  Zap,
  Clock,
} from "lucide-react";

/* ─────────────────────────────────────────
   Floating Particles Background
   ───────────────────────────────────────── */
function Particles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100 + 100}%`,
            background: `rgba(57, 255, 20, ${Math.random() * 0.3 + 0.1})`,
            animation: `particle-drift ${
              Math.random() * 15 + 10
            }s linear infinite`,
            animationDelay: `${Math.random() * 10}s`,
          }}
        />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={`cyan-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100 + 100}%`,
            background: `rgba(34, 211, 238, ${Math.random() * 0.2 + 0.1})`,
            animation: `particle-drift ${
              Math.random() * 20 + 12
            }s linear infinite`,
            animationDelay: `${Math.random() * 8}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Staggered Hero Text
   ───────────────────────────────────────── */
function StaggeredText({
  words,
  className = "",
}: {
  words: string[];
  className?: string;
}) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((c) => {
        if (c >= words.length) {
          clearInterval(interval);
          return c;
        }
        return c + 1;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block transition-all duration-500"
          style={{
            opacity: i < visibleCount ? 1 : 0,
            transform:
              i < visibleCount ? "translateY(0)" : "translateY(16px)",
          }}
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
}

/* ─────────────────────────────────────────
   FAQ Accordion Item
   ───────────────────────────────────────── */
function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/30">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left text-foreground font-medium hover:bg-muted/30 transition-colors"
      >
        <span>{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="px-5 pb-5 text-muted-foreground leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Scroll-Reveal Wrapper
   ───────────────────────────────────────── */
function RevealOnScroll({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ═════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═════════════════════════════════════════ */

const STEPS = [
  {
    icon: Target,
    title: "Set a Commitment",
    desc: "Pick your goal, set a deadline, and deposit as little as ₹20 as your commitment fee.",
    color: "text-primary",
  },
  {
    icon: Bot,
    title: "AI Negotiation",
    desc: "Our AI challenges your goal — making sure it's specific, measurable, and not too easy.",
    color: "text-info",
  },
  {
    icon: Camera,
    title: "Prove Your Work",
    desc: "Submit a screenshot, selfie, or link. AI verifies your proof before the deadline.",
    color: "text-accent",
  },
  {
    icon: Trophy,
    title: "Get Rewarded",
    desc: "Pass the challenge? Unlock your deposit + earn reward points. Fail? You lose the deposit.",
    color: "text-primary",
  },
];

const AUDIENCES = [
  {
    icon: GraduationCap,
    label: "JEE / NEET Droppers",
    desc: "Finally finish those daily problem sets",
  },
  {
    icon: Code2,
    label: "Coders & Builders",
    desc: "Ship that side-project, solve 5 DSA problems",
  },
  {
    icon: Globe,
    label: "Language Learners",
    desc: "30 min of Duolingo or lose your money",
  },
  {
    icon: Clock,
    label: "Exam Preppers",
    desc: "UPSC, GATE, CAT — consistent daily study",
  },
];

const TESTIMONIALS = [
  {
    name: "Arjun S.",
    role: "JEE Aspirant, Kota",
    quote:
      "I used to waste 4 hours daily. Now I deposit ₹50 and actually finish my Physics revision. Lost money twice — never again.",
    avatar: "AS",
  },
  {
    name: "Priya M.",
    role: "NEET Dropper, Chennai",
    quote:
      "The AI actually pushes back on vague goals. It forced me to be specific. My scores improved 30% in two months.",
    avatar: "PM",
  },
  {
    name: "Rahul K.",
    role: "Full-Stack Developer, Pune",
    quote:
      "I committed to solving 3 LeetCode problems daily. The deposit system is genius — nothing else worked for me.",
    avatar: "RK",
  },
];

const FAQS = [
  {
    q: "Is this legal? Am I really losing money?",
    a: "Yes, this is completely legal. You're making a voluntary commitment deposit to yourself. If you complete your goal, you get it back. If you don't, the deposit is forfeited — think of it as an accountability fee, not a penalty.",
  },
  {
    q: "How does the AI verify my proof?",
    a: "Our AI analyzes your submitted screenshots, photos, or links using vision models. It checks whether the proof matches your declared goal. If the AI is unsure, a human review is triggered.",
  },
  {
    q: "What's the minimum commitment fee?",
    a: "You can start with as little as ₹20. Most users find that ₹50–₹100 is the sweet spot — enough to feel the pinch, but not enough to stress about.",
  },
  {
    q: "Can I get a refund if something goes wrong?",
    a: "If there's a genuine technical issue or unfair AI judgment, you can appeal within 24 hours. Our support team reviews all appeals manually.",
  },
  {
    q: "Do I need to pay to use the app?",
    a: "The platform itself is free. You only deposit money when you create a commitment. No subscriptions, no hidden fees.",
  },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative">
      <Particles />

      {/* ──── Navbar ──── */}
      <header className="sticky top-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <Sparkles className="w-6 h-6 text-primary group-hover:animate-pulse-glow transition-all" />
            <span className="font-bold text-xl tracking-tighter text-primary">
              STAKEMATE
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-all animate-pulse-glow"
            >
              Start for Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* ──── Hero Section ──── */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-32 text-center overflow-hidden">
        {/* Gradient mesh orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-float pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-info/5 rounded-full blur-[100px] animate-float pointer-events-none" style={{ animationDelay: "1.5s" }} />

        <div
          className={`transition-all duration-1000 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-muted-foreground mb-8">
            <Zap className="w-4 h-4 text-accent" />
            <span>India&apos;s #1 AI Accountability Platform</span>
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 max-w-5xl mx-auto leading-[1.1]">
          {mounted ? (
            <>
              <StaggeredText words={["Commit.", "Prove", "it."]} />
              <br className="hidden sm:inline" />
              <span className="text-primary">
                <StaggeredText words={["Or", "lose", "₹20."]} />
              </span>
            </>
          ) : (
            <>
              Commit. Prove it.
              <br className="hidden sm:inline" />
              <span className="text-primary">Or lose ₹20.</span>
            </>
          )}
        </h1>

        <p
          className={`text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 text-balance transition-all duration-1000 delay-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          The only study app that makes you pay for procrastinating. Deposit
          money, complete your goal, or lose it forever.
        </p>

        <div
          className={`flex flex-col sm:flex-row gap-4 mb-4 transition-all duration-1000 delay-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-lg px-10 py-4 rounded-xl hover:bg-primary/90 transition-all animate-pulse-glow hover:scale-105"
          >
            Start Your First Commitment
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <p
          className={`text-sm text-muted-foreground/60 transition-all duration-1000 delay-1000 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          No sign-up fee · Deposits start at ₹20 · Works with UPI
        </p>
      </section>

      {/* ──── How It Works — 4 Steps ──── */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                How It{" "}
                <span className="text-gradient-primary">Works</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Four simple steps to becoming the most productive version of yourself.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <RevealOnScroll key={step.title}>
                <div
                  className="group relative glass rounded-2xl p-6 h-full transition-all duration-500 hover:translate-y-[-4px] glow-border-hover cursor-default"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  {/* Step number */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                    {i + 1}
                  </div>

                  <step.icon
                    className={`w-10 h-10 ${step.color} mb-4 transition-transform duration-300 group-hover:scale-110`}
                  />
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Built For Section ──── */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Built for{" "}
                <span className="text-gradient-warm">India&apos;s Grinders</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Whether you&apos;re prepping for exams, building projects, or learning new skills — we&apos;ve got you.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AUDIENCES.map((a, i) => (
              <RevealOnScroll key={a.label}>
                <div className="group glass rounded-2xl p-6 text-center transition-all duration-500 hover:translate-y-[-4px] glow-border-hover cursor-default">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <a.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{a.label}</h3>
                  <p className="text-muted-foreground text-sm">{a.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Social Proof / Testimonials ──── */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Real Students,{" "}
                <span className="text-gradient-primary">Real Results</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Join thousands of students who stopped procrastinating.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <RevealOnScroll key={t.name}>
                <div className="glass rounded-2xl p-6 h-full flex flex-col transition-all duration-500 hover:translate-y-[-4px] glow-border-hover">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        className="w-4 h-4 text-accent fill-accent"
                      />
                    ))}
                  </div>
                  <p className="text-foreground/90 leading-relaxed flex-1 mb-6 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {t.role}
                      </p>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Stats Banner ──── */}
      <RevealOnScroll>
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto glass-strong rounded-2xl glow-border p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "₹12L+", label: "Deposits at risk" },
              { value: "8,400+", label: "Commitments made" },
              { value: "73%", label: "Success rate" },
              { value: "4.8★", label: "User rating" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl md:text-3xl font-bold text-primary">
                  {s.value}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      </RevealOnScroll>

      {/* ──── FAQ ──── */}
      <section className="relative py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Frequently Asked{" "}
                <span className="text-gradient-primary">Questions</span>
              </h2>
            </div>
          </RevealOnScroll>

          <div className="flex flex-col gap-3">
            {FAQS.map((faq, i) => (
              <RevealOnScroll key={i}>
                <FAQItem question={faq.q} answer={faq.a} />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Final CTA ──── */}
      <RevealOnScroll>
        <section className="py-24 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Stop planning.{" "}
              <span className="text-gradient-primary">Start committing.</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-10">
              Your future self will thank you. Or you&apos;ll lose ₹20 trying.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-lg px-10 py-4 rounded-xl hover:bg-primary/90 transition-all animate-pulse-glow hover:scale-105"
            >
              Make Your First Commitment
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </RevealOnScroll>

      {/* ──── Footer ──── */}
      <footer className="border-t border-border/50 py-12 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg tracking-tighter text-primary">
                STAKEMATE
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              India&apos;s AI-powered productivity commitment platform. Deposit
              money, complete goals, earn rewards.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
              Product
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/login"
                  className="text-foreground/70 hover:text-primary transition-colors"
                >
                  Get Started
                </Link>
              </li>
              <li>
                <span className="text-foreground/70 cursor-default">
                  How It Works
                </span>
              </li>
              <li>
                <span className="text-foreground/70 cursor-default">
                  Pricing
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
              Company
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-foreground/70 cursor-default">
                  About
                </span>
              </li>
              <li>
                <span className="text-foreground/70 cursor-default">
                  Blog
                </span>
              </li>
              <li>
                <span className="text-foreground/70 cursor-default">
                  Careers
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
              Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-foreground/70 cursor-default">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-foreground/70 cursor-default">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="text-foreground/70 cursor-default">
                  Refund Policy
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Stakemate. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Shield className="w-4 h-4 text-primary" />
            <span>Secured with UPI · Made in India 🇮🇳</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
