'use client'

import Link from 'next/link'
import { ArrowLeft, Play, Mail, MapPin, Phone, Globe, Star, Send, Trash2, Edit, TestTube } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc/client'
import { formatRelativeTime } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState } from 'react'

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const { data: campaign, isLoading: campaignLoading, refetch } = trpc.campaigns.getById.useQuery(params.id)
  const { data: leads, isLoading: leadsLoading } = trpc.leads.listByCampaign.useQuery(params.id)
  const { data: stats } = trpc.campaigns.getStats.useQuery(params.id)
  const { data: templates } = trpc.templates.list.useQuery()

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(campaign?.templateId || '')
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [leadTemplateId, setLeadTemplateId] = useState<string>('')

  const startScrapingMutation = trpc.campaigns.startScraping.useMutation({
    onSuccess: () => {
      window.location.reload()
    },
  })

  const startSendingMutation = trpc.campaigns.startSending.useMutation({
    onSuccess: (data) => {
      alert(`Successfully queued ${data.queued} emails for sending!`)
      window.location.reload()
    },
    onError: (error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const deleteMutation = trpc.campaigns.delete.useMutation({
    onSuccess: () => {
      window.location.href = '/campaigns'
    },
    onError: (error) => {
      alert(`Error deleting campaign: ${error.message}`)
    },
  })

  const sendEmailMutation = trpc.leads.sendEmail.useMutation({
    onSuccess: () => {
      alert('Email queued successfully!')
      window.location.reload()
    },
    onError: (error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const updateCampaignMutation = trpc.campaigns.update.useMutation({
    onSuccess: () => {
      refetch()
      alert('Template updated!')
    },
    onError: (error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const sendTestEmailMutation = trpc.leads.sendEmail.useMutation({
    onSuccess: () => {
      alert('Test email sent to maykelevoni@gmail.com!')
    },
    onError: (error) => {
      alert(`Error: ${error.message}`)
    },
  })

  const handleStartScraping = () => {
    if (confirm('Start scraping Google Maps for leads?')) {
      startScrapingMutation.mutate(params.id)
    }
  }

  const handleStartSending = () => {
    if (confirm('Start sending emails to all leads with email addresses?')) {
      startSendingMutation.mutate(params.id)
    }
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this campaign? This will also delete all associated leads and cannot be undone.')) {
      deleteMutation.mutate(params.id)
    }
  }

  const handleSendIndividualEmail = (lead: any) => {
    setSelectedLead(lead)
    setLeadTemplateId(campaign?.templateId || '')
    setSendDialogOpen(true)
  }

  const confirmSendEmail = () => {
    if (!leadTemplateId) {
      alert('Please select a template')
      return
    }
    // First update campaign template if needed
    if (leadTemplateId !== campaign?.templateId) {
      updateCampaignMutation.mutate({
        id: params.id,
        templateId: leadTemplateId,
      })
    }
    // Then send email
    sendEmailMutation.mutate(selectedLead.id)
    setSendDialogOpen(false)
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId)
    updateCampaignMutation.mutate({
      id: params.id,
      templateId: templateId || null,
    })
  }

  const handleSendTestEmail = () => {
    alert('Test email feature: This will send to maykelevoni@gmail.com with the selected template')
    // For now, just show alert - you can implement actual test email logic here
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500'
      case 'scraping':
        return 'bg-blue-500 animate-pulse'
      case 'ready':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (campaignLoading) {
    return <div className="container mx-auto p-8">Loading...</div>
  }

  if (!campaign) {
    return <div className="container mx-auto p-8">Campaign not found</div>
  }

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <Link href="/campaigns">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Button>
      </Link>

      {/* Campaign Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{campaign.name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>{campaign.keyword}</span>
              <span>·</span>
              <span>{campaign.location}</span>
              <span>·</span>
              <span>Created {formatRelativeTime(campaign.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(campaign.status)}>
              {campaign.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = `/campaigns/${params.id}/edit`}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        {/* Template Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Email Template</label>
          <div className="flex gap-4 items-center">
            <Select value={selectedTemplateId || campaign?.templateId || ''} onValueChange={handleTemplateChange}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates && templates.length > 0 ? (
                  templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No templates available</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendTestEmail}
              disabled={!selectedTemplateId && !campaign?.templateId}
            >
              <TestTube className="h-4 w-4 mr-1" />
              Send Test Email
            </Button>
            <Link href="/templates/new">
              <Button variant="ghost" size="sm">
                Create New Template
              </Button>
            </Link>
          </div>
        </div>

        {campaign.status === 'draft' && (
          <Button
            size="lg"
            onClick={handleStartScraping}
            disabled={startScrapingMutation.isPending}
          >
            <Play className="h-5 w-5 mr-2" />
            {startScrapingMutation.isPending ? 'Starting...' : 'Start Scraping'}
          </Button>
        )}

        {campaign.status === 'scraping' && (
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-blue-900 dark:text-blue-100">
              🔄 Scraping in progress... This may take a few minutes.
            </p>
          </div>
        )}

        {(campaign.status === 'ready' || campaign.status === 'sending') && (
          <div className="flex gap-4">
            <Button
              size="lg"
              onClick={handleStartSending}
              disabled={startSendingMutation.isPending || !selectedTemplateId && !campaign.templateId}
            >
              <Send className="h-5 w-5 mr-2" />
              {startSendingMutation.isPending ? 'Queueing...' : 'Send All Emails'}
            </Button>
            {!selectedTemplateId && !campaign.templateId && (
              <p className="text-sm text-muted-foreground flex items-center">
                Please select a template first
              </p>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Leads</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalLeads || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Emails Found</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.leadsWithEmail || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Emails Sent</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.emailsSent || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Open Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.openRate || 0}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.emailsOpened || 0} opened · {stats?.emailsClicked || 0} clicked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
          <CardDescription>
            Businesses found from Google Maps
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leadsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : leads && leads.length > 0 ? (
            <div className="space-y-4">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{lead.businessName}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {lead.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {lead.address}
                          </span>
                        )}
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {lead.phone}
                          </span>
                        )}
                        {lead.website && (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:underline"
                          >
                            <Globe className="h-4 w-4" />
                            {new URL(lead.website).hostname}
                          </a>
                        )}
                        {lead.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {lead.rating} ({lead.reviewCount} reviews)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {lead.email ? (
                        <>
                          <Badge variant="default" className="bg-green-500">
                            <Mail className="h-3 w-3 mr-1" />
                            {lead.email}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendIndividualEmail(lead)}
                            disabled={sendEmailMutation.isPending}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Send Email
                          </Button>
                        </>
                      ) : (
                        <Badge variant="outline">No email</Badge>
                      )}
                      <Badge variant="outline">{lead.status}</Badge>
                    </div>
                  </div>
                  {lead.categories && lead.categories.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {lead.categories.map((cat, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No leads yet. Start scraping to find businesses.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Email Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email to {selectedLead?.businessName}</DialogTitle>
            <DialogDescription>
              Select an email template to send to {selectedLead?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="block text-sm font-medium mb-2">Select Template</label>
            <Select value={leadTemplateId} onValueChange={setLeadTemplateId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {templates && templates.length > 0 ? (
                  templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No templates available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSendEmail} disabled={!leadTemplateId}>
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
