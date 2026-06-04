'use client'

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Upload, Clock, Brain, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { generateQuizAction, submitProofAction } from "./actions"

interface GoalData {
  id: string
  goal_text: string
  category: string
  topic_list: string | null
  negotiation_json: any
  mcq_json: any
  deadline: string
}

export function VerifyForm({ goal }: { goal: GoalData }) {
  const [phase, setPhase] = useState<'loading_quiz' | 'quiz' | 'upload' | 'submitting' | 'done'>(
    goal.category === 'academics' && !goal.mcq_json ? 'loading_quiz' : 'upload'
  )
  const [mcqData, setMcqData] = useState<any>(goal.mcq_json || null)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [files, setFiles] = useState<File[]>([])
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [error, setError] = useState("")

  const timerMinutes = goal.negotiation_json?.timer_required_in_minutes || 0

  // Generate MCQs for academics
  useEffect(() => {
    if (phase === 'loading_quiz' && goal.topic_list) {
      generateQuizAction(goal.id, goal.topic_list).then((data) => {
        setMcqData(data)
        setPhase('quiz')
        if (timerMinutes > 0) {
          setTimeLeft(timerMinutes * 60)
        }
      }).catch(() => {
        setError("Failed to generate quiz. Please try again.")
        setPhase('upload')
      })
    }
  }, [phase, goal.id, goal.topic_list, timerMinutes])

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timeLeft])

  // Auto-fail on timer expiry
  useEffect(() => {
    if (timeLeft === 0 && phase === 'quiz') {
      handleSubmit()
    }
  }, [timeLeft, phase])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async () => {
    setPhase('submitting')
    const formData = new FormData()
    formData.append('goalId', goal.id)
    formData.append('category', goal.category)
    formData.append('userAnswers', JSON.stringify(userAnswers))
    files.forEach(file => formData.append('proofFiles', file))

    try {
      await submitProofAction(formData)
    } catch (e: any) {
      setError(e.message || "Submission failed")
      setPhase('upload')
    }
  }

  const timerColor = timeLeft !== null && timeLeft < 60 ? 'text-destructive' : timeLeft !== null && timeLeft < 180 ? 'text-orange-400' : 'text-primary'

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full">

      {/* Timer Bar */}
      {timeLeft !== null && timeLeft > 0 && (
        <div className={`flex items-center justify-center gap-3 p-4 rounded-xl glass-card border border-white/[0.06] animate-sm-fade-in-up ${timerColor}`}>
          <Clock className="w-5 h-5" />
          <span className="text-3xl font-black tabular-nums">{formatTime(timeLeft)}</span>
          <span className="text-sm text-muted-foreground">remaining</span>
        </div>
      )}

      {timeLeft === 0 && (
        <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive animate-sm-fade-in-up">
          <XCircle className="w-5 h-5" />
          <span className="font-bold">Time expired! Auto-submitting...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm border border-destructive/20 animate-sm-fade-in-up">
          {error}
        </div>
      )}

      {/* Phase: Loading Quiz */}
      {phase === 'loading_quiz' && (
        <div className="flex flex-col items-center justify-center py-20 gap-6 animate-sm-fade-in-up">
          <div className="relative">
            <span className="text-5xl animate-sm-brain-pulse inline-block">🧠</span>
            <span className="absolute -top-2 -right-2 text-xl animate-sm-sparkle inline-block">✨</span>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">Generating your quiz...</p>
            <p className="text-sm text-muted-foreground mt-1">The AI is crafting questions from your topics</p>
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Phase: MCQ Quiz (Academics) */}
      {phase === 'quiz' && mcqData?.questions && (
        <div className="flex flex-col gap-6 animate-sm-slide-in-bottom">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI Generated Quiz
          </h2>

          {mcqData.questions.map((q: any, qIndex: number) => (
            <Card
              key={qIndex}
              className="glass-card border border-white/[0.06] animate-sm-fade-in-up"
              style={{ animationDelay: `${qIndex * 0.1}s` }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">
                  <span className="text-primary mr-2">Q{qIndex + 1}.</span>
                  {q.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {Object.entries(q.options).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setUserAnswers(prev => ({ ...prev, [qIndex]: key }))}
                    className={`text-left p-3 rounded-xl border transition-all duration-200 text-sm ${
                      userAnswers[qIndex] === key
                        ? 'border-primary/50 bg-primary/10 text-foreground shadow-[0_0_15px_rgba(57,255,20,0.1)]'
                        : 'border-white/[0.06] bg-card/30 text-muted-foreground hover:border-white/[0.12] hover:bg-card/60'
                    }`}
                  >
                    <span className="font-bold text-primary mr-2">{key}.</span>
                    {value as string}
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Upload rough work after quiz */}
          <Card className="glass-card border border-white/[0.06] animate-sm-fade-in-up stagger-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Upload Rough Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Upload a photo of your handwritten calculations / rough work
              </p>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="bg-card/50 border-white/[0.08] rounded-xl file:bg-primary/10 file:text-primary file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-3 file:font-bold file:text-sm"
              />
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="font-black text-lg rounded-xl h-14 animate-sm-glow-ring"
            onClick={handleSubmit}
            disabled={Object.keys(userAnswers).length < (mcqData.questions?.length || 3)}
          >
            Submit Answers & Proof
          </Button>
        </div>
      )}

      {/* Phase: Upload Only (Programming, Design, Other) */}
      {phase === 'upload' && (
        <div className="flex flex-col gap-6 animate-sm-slide-in-bottom">
          <div className="p-5 rounded-xl bg-primary/[0.04] border border-primary/15">
            <p className="font-bold text-xs uppercase tracking-[0.15em] text-primary mb-2">What You Must Upload</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {goal.negotiation_json?.negotiated_proof_description || "Upload your proof of completion"}
            </p>
            {goal.negotiation_json?.verification_requirements && (
              <ul className="mt-3 space-y-1.5">
                {goal.negotiation_json.verification_requirements.map((req: string, i: number) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2 animate-sm-check-in" style={{ animationDelay: `${i * 0.1}s` }}>
                    <span className="text-primary mt-0.5 shrink-0">▸</span>
                    {req}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Card className="glass-card border border-white/[0.06]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Upload Your Proof
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Select screenshots, photos, or files that prove you completed the work
              </p>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="bg-card/50 border-white/[0.08] rounded-xl file:bg-primary/10 file:text-primary file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-3 file:font-bold file:text-sm"
              />
              {files.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg border border-primary/20">
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="font-black text-lg rounded-xl h-14 animate-sm-glow-ring"
            onClick={handleSubmit}
            disabled={files.length === 0}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Submit for AI Judgment
          </Button>
        </div>
      )}

      {/* Phase: Submitting */}
      {phase === 'submitting' && (
        <div className="flex flex-col items-center justify-center py-20 gap-6 animate-sm-fade-in-up">
          <div className="relative">
            <span className="text-5xl animate-sm-brain-pulse inline-block">⚖️</span>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">AI Judge is reviewing your proof...</p>
            <p className="text-sm text-muted-foreground mt-1">This may take a few seconds</p>
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  )
}
