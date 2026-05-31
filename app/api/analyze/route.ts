import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, scans } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { analyzeContent } from '@/lib/analyzer'

const FREE_SCAN_LIMIT = 3

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, contentType } = body

    if (!content || !contentType) {
      return NextResponse.json(
        { error: 'Content and contentType are required' },
        { status: 400 }
      )
    }

    if (!['url', 'text'].includes(contentType)) {
      return NextResponse.json(
        { error: 'contentType must be "url" or "text"' },
        { status: 400 }
      )
    }

    // Get user to check tier and scan limits
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if we need to reset daily scan count
    const today = new Date().toISOString().split('T')[0]
    const lastReset = user.lastScanReset?.toString().split('T')[0]

    if (lastReset !== today) {
      await db
        .update(users)
        .set({ scanCount: 0, lastScanReset: sql`CURRENT_DATE` })
        .where(eq(users.id, session.user.id))
      user.scanCount = 0
    }

    // Check scan limits for free tier
    if (user.tier === 'free' && user.scanCount >= FREE_SCAN_LIMIT) {
      return NextResponse.json(
        {
          error: 'Daily scan limit reached',
          message: 'Upgrade to Pro for unlimited scans',
          limit: FREE_SCAN_LIMIT,
          used: user.scanCount,
        },
        { status: 429 }
      )
    }

    // Perform analysis
    const analysis = analyzeContent(content, contentType as 'url' | 'text')

    // Save scan to database
    const [scan] = await db
      .insert(scans)
      .values({
        userId: session.user.id,
        contentType,
        content: content.substring(0, 2000), // Limit stored content
        result: analysis.result,
        riskScore: analysis.riskScore,
        details: analysis.details,
      })
      .returning()

    // Increment scan count
    await db
      .update(users)
      .set({ scanCount: sql`${users.scanCount} + 1` })
      .where(eq(users.id, session.user.id))

    return NextResponse.json({
      id: scan.id,
      ...analysis,
      scansRemaining:
        user.tier === 'pro' ? 'unlimited' : FREE_SCAN_LIMIT - user.scanCount - 1,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
