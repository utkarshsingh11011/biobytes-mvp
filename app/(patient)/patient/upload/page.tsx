"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UploadCloud, FileText } from "lucide-react"

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
      const res = await fetch("/api/reports/upload", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        router.push("/patient/dashboard")
        router.refresh()
      } else {
        setError("Upload failed. Please try again.")
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
          <CardTitle>Select File</CardTitle>
          <CardDescription>Max file size: 10MB</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <label htmlFor="file-upload" className="cursor-pointer font-medium text-primary hover:underline">
                <span>Click to upload</span>
                <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,image/png,image/jpeg" />
              </label>
              <p className="text-sm text-muted-foreground">or drag and drop</p>
            </div>
          </div>
          
          {file && (
            <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-md">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
            {uploading ? "Uploading & Processing..." : "Upload & Extract"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
