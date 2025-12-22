import Link from 'next/link'
import { ArrowRight, Search, Mail, TrendingUp, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Email Outreach Automation
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Find businesses on Google Maps, discover their emails, and send personalized outreach campaigns at scale
          </p>
          <Link href="/campaigns">
            <Button size="lg" className="text-lg px-8 py-6">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="border rounded-lg p-8 bg-card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
              <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Find Leads</h2>
            <p className="text-muted-foreground">
              Search Google Maps by keyword and location. Automatically extract business information including phone numbers, addresses, and websites.
            </p>
          </div>

          <div className="border rounded-lg p-8 bg-card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 mb-4">
              <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Discover Emails</h2>
            <p className="text-muted-foreground">
              Automatically find contact emails by scraping company websites. Validate emails and ensure high deliverability rates.
            </p>
          </div>

          <div className="border rounded-lg p-8 bg-card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Send Campaigns</h2>
            <p className="text-muted-foreground">
              Create personalized email templates with variables. Track opens, clicks, and replies. Follow anti-spam best practices with warm-up schedules.
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold mb-4">Ready to start?</h3>
          <div className="flex gap-4 justify-center">
            <Link href="/campaigns/new">
              <Button size="lg" variant="outline">
                Create Your First Campaign
              </Button>
            </Link>
            <Link href="/templates">
              <Button size="lg" variant="outline">
                <FileText className="mr-2 h-5 w-5" />
                Manage Templates
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
