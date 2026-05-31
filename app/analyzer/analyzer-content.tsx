'use client'

import { useState } from 'react'
import {
  Link2,
  FileText,
  Loader2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface AnalysisResult {
  id: string
  result: 'safe' | 'suspicious' | 'dangerous'
  riskScore: number
  details: {
    threats: string[]
    indicators: string[]
    recommendations: string[]
  }
  scansRemaining: number | 'unlimited'
}

const resultConfig = {
  safe: {
    icon: CheckCircle,
    color: 'text-safe',
    bg: 'bg-safe/10',
    border: 'border-safe/30',
    label: 'Safe',
    description: 'No immediate threats detected',
  },
  suspicious: {
    icon: AlertTriangle,
    color: 'text-suspicious',
    bg: 'bg-suspicious/10',
    border: 'border-suspicious/30',
    label: 'Suspicious',
    description: 'Potential risks identified - proceed with caution',
  },
  dangerous: {
    icon: Shield,
    color: 'text-dangerous',
    bg: 'bg-dangerous/10',
    border: 'border-dangerous/30',
    label: 'Dangerous',
    description: 'High-risk content detected - avoid interaction',
  },
}

export function AnalyzerContent() {
  const [contentType, setContentType] = useState<'url' | 'text'>('url')
  const [content, setContent] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const handleAnalyze = async () => {
    if (!content.trim()) {
      toast.error('Please enter content to analyze')
      return
    }

    setIsAnalyzing(true)
    setResult(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), contentType }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          toast.error(data.message || 'Daily scan limit reached')
        } else {
          throw new Error(data.error || 'Analysis failed')
        }
        return
      }

      setResult(data)
      toast.success('Analysis complete')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const config = result ? resultConfig[result.result] : null
  const ResultIcon = config?.icon

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Threat Analyzer
        </h1>
        <p className="mt-2 text-muted-foreground">
          Scan suspicious URLs or text content for potential threats
        </p>
      </div>

      {/* Input Section */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-6">
          <Tabs
            value={contentType}
            onValueChange={(v) => {
              setContentType(v as 'url' | 'text')
              setContent('')
              setResult(null)
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url" className="gap-2">
                <Link2 className="h-4 w-4" />
                URL
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-2">
                <FileText className="h-4 w-4" />
                Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="mt-4">
              <Textarea
                placeholder="Enter a suspicious URL to analyze (e.g., https://suspicious-site.com/login)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={isAnalyzing}
              />
            </TabsContent>

            <TabsContent value="text" className="mt-4">
              <Textarea
                placeholder="Paste suspicious email, SMS, or text content to analyze..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px] resize-none"
                disabled={isAnalyzing}
              />
            </TabsContent>
          </Tabs>

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !content.trim()}
            className="mt-4 w-full gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Analyze Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && config && ResultIcon && (
        <Card className={`border ${config.border} ${config.bg}`}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className={`rounded-xl p-3 ${config.bg}`}>
                <ResultIcon className={`h-8 w-8 ${config.color}`} />
              </div>
              <div>
                <CardTitle className={`text-xl ${config.color}`}>
                  {config.label}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Risk Score */}
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Risk Score</span>
                <span className={`font-bold ${config.color}`}>
                  {result.riskScore}/100
                </span>
              </div>
              <Progress
                value={result.riskScore}
                className="h-2"
              />
            </div>

            {/* Threats */}
            {result.details.threats.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                  <AlertTriangle className="h-4 w-4 text-dangerous" />
                  Threats Detected
                </h4>
                <ul className="space-y-1">
                  {result.details.threats.map((threat, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground"
                    >
                      {threat}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Indicators */}
            {result.details.indicators.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                  <Info className="h-4 w-4 text-suspicious" />
                  Suspicious Indicators
                </h4>
                <ul className="space-y-1">
                  {result.details.indicators.map((indicator, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground"
                    >
                      {indicator}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {result.details.recommendations.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                  <CheckCircle className="h-4 w-4 text-safe" />
                  Recommendations
                </h4>
                <ul className="space-y-1">
                  {result.details.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground"
                    >
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Scans Remaining */}
            <div className="rounded-lg border border-border/50 bg-background/50 p-3 text-center text-sm text-muted-foreground">
              {result.scansRemaining === 'unlimited'
                ? 'Unlimited scans remaining (Pro)'
                : `${result.scansRemaining} scans remaining today`}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
