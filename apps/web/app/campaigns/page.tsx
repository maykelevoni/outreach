'use client'

import Link from 'next/link'
import { Plus, Search, Mail, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc/client'
import { formatRelativeTime } from '@/lib/utils'

export default function CampaignsPage() {
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500'
      case 'scraping':
        return 'bg-blue-500'
      case 'ready':
        return 'bg-green-500'
      case 'sending':
        return 'bg-yellow-500'
      case 'completed':
        return 'bg-purple-500'
      case 'paused':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            Manage your email outreach campaigns
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button size="lg">
            <Plus className="h-5 w-5" />
            New Campaign
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : campaigns && campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl">{campaign.name}</CardTitle>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    <div className="flex items-center gap-1 text-sm">
                      <Search className="h-3 w-3" />
                      {campaign.keyword} · {campaign.location}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{campaign.leadCount || 0}</p>
                        <p className="text-xs text-muted-foreground">Leads</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">0</p>
                        <p className="text-xs text-muted-foreground">Sent</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Created {formatRelativeTime(campaign.createdAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <Search className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">No campaigns yet</h3>
            <p className="text-muted-foreground max-w-md">
              Create your first campaign to start finding leads on Google Maps and sending personalized emails.
            </p>
            <Link href="/campaigns/new">
              <Button size="lg" className="mt-4">
                <Plus className="h-5 w-5" />
                Create Your First Campaign
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
