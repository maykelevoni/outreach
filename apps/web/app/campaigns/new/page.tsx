'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/lib/trpc/client'

export default function NewCampaignPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    keyword: '',
    location: '',
    maxLeads: 100,
    templateId: '',
  })

  const { data: templates } = trpc.templates.list.useQuery()

  const createCampaign = trpc.campaigns.create.useMutation({
    onSuccess: (data) => {
      router.push(`/campaigns/${data.id}`)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    createCampaign.mutate({
      name: formData.name,
      keyword: formData.keyword,
      location: formData.location,
      templateId: formData.templateId ? formData.templateId : undefined,
      settings: {
        maxLeads: formData.maxLeads,
      },
    })
  }

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <Link href="/campaigns">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Create New Campaign</CardTitle>
          <CardDescription>
            Find businesses on Google Maps and start your outreach campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="e.g., Local Restaurants Outreach"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <p className="text-sm text-muted-foreground">
                Give your campaign a memorable name
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="keyword">Keyword</Label>
                <Input
                  id="keyword"
                  placeholder="e.g., coffee shop, dentist, gym"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  What type of business?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., New York, NY"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  City, state, or area
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxLeads">Maximum Leads</Label>
              <Input
                id="maxLeads"
                type="number"
                min="1"
                max="500"
                value={formData.maxLeads}
                onChange={(e) => setFormData({ ...formData, maxLeads: parseInt(e.target.value) })}
                required
              />
              <p className="text-sm text-muted-foreground">
                How many businesses to find (1-500)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Email Template (Optional)</Label>
              <select
                id="template"
                className="w-full p-2 border rounded-md"
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
              >
                <option value="">Select a template (can be added later)</option>
                {Array.isArray(templates) && templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">
                Choose an email template for your campaign
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What happens next?
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>Your campaign will be created as a draft</li>
                <li>You can start scraping Google Maps for businesses</li>
                <li>We'll find email addresses from their websites</li>
                <li>Create personalized email templates</li>
                <li>Send your outreach campaign</li>
              </ol>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                disabled={createCampaign.isPending}
              >
                {createCampaign.isPending ? 'Creating...' : 'Create Campaign'}
              </Button>
              <Link href="/campaigns">
                <Button type="button" variant="outline" size="lg">
                  Cancel
                </Button>
              </Link>
            </div>

            {createCampaign.error && (
              <div className="bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 p-4 rounded-lg border border-red-200 dark:border-red-800">
                {createCampaign.error.message}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
