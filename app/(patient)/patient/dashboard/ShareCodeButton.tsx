"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Check, Copy } from "lucide-react"

export function ShareCodeButton({ initialCode }: { initialCode?: string }) {
  const [code, setCode] = useState<string | undefined>(initialCode)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateCode = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/access-codes", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setCode(data.code)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (code) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (code) {
    return (
      <Button variant="outline" onClick={copyToClipboard} className="w-[180px]">
        {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
        {copied ? "Copied!" : code}
      </Button>
    )
  }

  return (
    <Button variant="outline" onClick={generateCode} disabled={loading}>
      <Share2 className="mr-2 h-4 w-4" />
      {loading ? "Generating..." : "Share with Doctor"}
    </Button>
  )
}
