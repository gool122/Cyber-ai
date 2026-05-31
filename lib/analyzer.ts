export type AnalysisResult = 'safe' | 'suspicious' | 'dangerous'

export interface AnalysisDetails {
  threats: string[]
  indicators: string[]
  recommendations: string[]
}

export interface AnalysisResponse {
  result: AnalysisResult
  riskScore: number
  details: AnalysisDetails
}

const SUSPICIOUS_PATTERNS = [
  /bit\.ly/i,
  /tinyurl/i,
  /free.*gift/i,
  /winner/i,
  /urgent/i,
  /account.*suspend/i,
  /verify.*immediately/i,
  /password.*reset/i,
  /click.*here/i,
  /limited.*time/i,
]

const DANGEROUS_PATTERNS = [
  /login.*\.php/i,
  /paypa[l1].*verify/i,
  /bank.*secure/i,
  /\.exe$/i,
  /\.scr$/i,
  /\.zip.*password/i,
  /cryptocurrency.*invest/i,
  /prince.*nigeria/i,
  /inheritance.*million/i,
  /wallet.*connect/i,
]

export function analyzeContent(
  content: string,
  contentType: 'url' | 'text'
): AnalysisResponse {
  const threats: string[] = []
  const indicators: string[] = []
  const recommendations: string[] = []

  let riskScore = 0

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
      riskScore += 30
      threats.push(`High-risk pattern detected: ${pattern.source}`)
    }
  }

  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      riskScore += 15
      indicators.push(`Suspicious pattern detected: ${pattern.source}`)
    }
  }

  if (contentType === 'url') {
    // URL-specific checks
    if (!content.startsWith('https://')) {
      riskScore += 10
      indicators.push('URL does not use HTTPS')
      recommendations.push('Prefer websites that use HTTPS encryption')
    }

    if (content.includes('@')) {
      riskScore += 25
      threats.push('URL contains @ symbol - potential credential phishing')
    }

    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(content)) {
      riskScore += 20
      indicators.push('URL uses IP address instead of domain name')
      recommendations.push('Be cautious of URLs that use raw IP addresses')
    }

    const suspiciousTLDs = ['.xyz', '.top', '.click', '.link', '.work']
    if (suspiciousTLDs.some((tld) => content.toLowerCase().includes(tld))) {
      riskScore += 10
      indicators.push('URL uses potentially suspicious top-level domain')
    }
  } else {
    // Text-specific checks
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const emails = content.match(emailPattern)
    if (emails && emails.length > 2) {
      riskScore += 5
      indicators.push('Multiple email addresses detected')
    }

    const urlPattern = /https?:\/\/[^\s]+/g
    const urls = content.match(urlPattern)
    if (urls && urls.length > 3) {
      riskScore += 10
      indicators.push('Multiple URLs detected in content')
      recommendations.push('Be cautious of messages with many links')
    }

    if (/\$\d+[,\d]*/.test(content) || /\d+\s*(dollar|usd|btc|eth)/i.test(content)) {
      riskScore += 10
      indicators.push('Monetary amounts mentioned')
      recommendations.push('Be skeptical of unsolicited messages about money')
    }
  }

  // Add some randomness to simulate real analysis
  riskScore += Math.floor(Math.random() * 10)
  riskScore = Math.min(riskScore, 100)

  let result: AnalysisResult
  if (riskScore >= 60) {
    result = 'dangerous'
    recommendations.push('Do not interact with this content')
    recommendations.push('Report this content if received unsolicited')
  } else if (riskScore >= 30) {
    result = 'suspicious'
    recommendations.push('Exercise caution before proceeding')
    recommendations.push('Verify the source through official channels')
  } else {
    result = 'safe'
    if (recommendations.length === 0) {
      recommendations.push('No immediate threats detected')
      recommendations.push('Always remain vigilant online')
    }
  }

  return {
    result,
    riskScore,
    details: {
      threats,
      indicators,
      recommendations,
    },
  }
}
