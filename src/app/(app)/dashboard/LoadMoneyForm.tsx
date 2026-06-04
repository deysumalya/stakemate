'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loadMoney } from "./actions"

export function LoadMoneyForm() {
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLoad = async () => {
    if (!amount) return;
    setLoading(true)
    await loadMoney(Number(amount))
    setLoading(false)
    setAmount("")
  }

  return (
    <div className="flex gap-2 w-full">
      <Input 
        type="number" 
        placeholder="₹ Amount" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)}
        className="w-24 bg-card/50 border-white/[0.08]"
      />
      <Button 
        className="flex-1 font-bold" 
        variant="default"
        onClick={handleLoad}
        disabled={loading || !amount}
      >
        {loading ? "..." : "Load Money"}
      </Button>
    </div>
  )
}
