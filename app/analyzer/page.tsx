import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard-nav'
import { AnalyzerContent } from './analyzer-content'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analyzer',
  description: 'Scan suspicious URLs and text for threats',
}

export default async function AnalyzerPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen">
      <DashboardNav userName={session.user.name} />
      <main className="pt-24 pb-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <AnalyzerContent />
        </div>
      </main>
    </div>
  )
}
