'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import Link from 'next/link'

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const { data: template, isLoading } = trpc.templates.getById.useQuery(templateId)

  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const updateMutation = trpc.templates.update.useMutation({
    onSuccess: () => {
      router.push('/templates')
    },
  })

  const extractVariablesMutation = trpc.templates.extractVariables.useMutation()
  const previewMutation = trpc.templates.preview.useMutation()

  useEffect(() => {
    if (template) {
      setName(template.name)
      setSubject(template.subject)
      setBodyHtml(template.bodyHtml)
      setBodyText(template.bodyText)
    }
  }, [template])

  const handleExtractVariables = async () => {
    const combinedTemplate = `${subject} ${bodyHtml} ${bodyText}`
    const result = await extractVariablesMutation.mutateAsync(combinedTemplate)
    return result.variables
  }

  const handlePreview = async () => {
    const previewVars = {
      firstName: 'John',
      businessName: 'Acme Corp',
      location: 'New York, NY',
      rating: '4.5',
      reviewCount: '127',
      senderName: 'Your Name',
      senderCompany: 'Your Company',
    }

    const result = await previewMutation.mutateAsync({
      template: bodyHtml,
      variables: previewVars,
    })

    if (result.success && result.rendered) {
      setPreviewHtml(result.rendered)
      setShowPreview(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const variables = await handleExtractVariables()

    await updateMutation.mutateAsync({
      id: templateId,
      data: {
        name,
        subject,
        bodyHtml,
        bodyText,
        variables,
      },
    })
  }

  const availableVariables = [
    'firstName',
    'lastName',
    'businessName',
    'location',
    'rating',
    'reviewCount',
    'website',
    'phone',
    'address',
    'senderName',
    'senderCompany',
    'senderEmail',
    'currentDate',
  ]

  const insertVariable = (variable: string) => {
    const variableText = `{{${variable}}}`
    setBodyHtml((prev) => prev + variableText)
    setBodyText((prev) => prev + variableText)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading template...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Template not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-8">
        <Link href="/templates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Template</h1>
        <p className="text-muted-foreground mt-2">
          Update your email template and preview with sample data
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
            <CardDescription>Basic details about your email template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Professional Introduction"
                required
              />
            </div>

            <div>
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Quick question about {{businessName}}"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Variables</CardTitle>
            <CardDescription>Click to insert variables into your template</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableVariables.map((variable) => (
                <Badge
                  key={variable}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => insertVariable(variable)}
                >
                  {'{{'}{variable}{'}}'}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              You can also use helpers like: {'{{spin "Hi|Hello|Hey"}}'}, {'{{capitalize firstName}}'}, {'{{formatDate currentDate}}'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Email Body (HTML)</CardTitle>
                <CardDescription>
                  HTML version of your email. Use {'<p>'}, {'<br>'}, {'<ul>'}, etc.
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              className="w-full min-h-[300px] p-3 border rounded-md font-mono text-sm"
              required
            />
          </CardContent>
        </Card>

        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Rendered template with sample data</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border rounded-md p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Email Body (Plain Text)</CardTitle>
            <CardDescription>
              Plain text fallback for email clients that don't support HTML
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full min-h-[200px] p-3 border rounded-md font-mono text-sm"
              required
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Link href="/templates">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
