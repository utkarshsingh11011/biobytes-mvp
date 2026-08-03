"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UploadCloud, FileText, Camera } from "lucide-react"

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/extract-report", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        router.push("/patient/dashboard")
        router.refresh()
      } else {
        const errorData = await res.json().catch(() => ({}))
        setError(errorData.error || `Upload failed (Status ${res.status}). Please try a smaller file or check Vercel logs.`)
      }
    } catch (err) {
      setError("An error occurred during upload.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 mt-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Report</h1>
        <p className="text-muted-foreground">Upload your lab reports (PDF/JPG/PNG) for automatic AI extraction.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select File or Snap Photo</CardTitle>
          <CardDescription>Max file size: 10MB. AI will instantly extract your data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors">
            <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-4">
              <label htmlFor="file-upload" className="cursor-pointer font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md inline-block shadow-sm transition-all active:scale-95">
                <span>Upload or Snap Report</span>
                <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,application/pdf" capture="environment" />
              </label>
              <p className="text-sm text-muted-foreground block">Take a photo directly or upload a PDF/JPG</p>
            </div>
          </div>
          
          {file && !uploading && (
            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md border">
              <div className="flex items-center space-x-3 overflow-hidden">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium truncate">{file.name}</span>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}
          
          {uploading && (
            <div className="p-8 border rounded-lg bg-emerald-50 text-emerald-700 flex flex-col items-center justify-center space-y-4 shadow-inner">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-emerald-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg animate-pulse">AI Scanning & Structuring Data...</p>
                <p className="text-sm text-emerald-600/80 mt-1">Extracting strict medical schema</p>
              </div>
            </div>
          )}
          
          {error && <p className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpload} disabled={!file || uploading} className="w-full h-12 text-lg">
            {uploading ? "Processing..." : "Upload & Extract"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
