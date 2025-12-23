'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Eye, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewTemplatePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [previewVars, setPreviewVars] = useState({
    firstName: 'John',
    businessName: 'Acme Corp',
    location: 'New York, NY',
    rating: '4.5',
    reviewCount: '127',
    senderName: 'Your Name',
    senderCompany: 'Your Company',
  })

  const createMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      router.push('/templates')
    },
  })

  const extractVariablesMutation = trpc.templates.extractVariables.useMutation()
  const previewMutation = trpc.templates.preview.useMutation()

  const handleExtractVariables = async () => {
    const combinedTemplate = `${subject} ${bodyHtml} ${bodyText}`
    const result = await extractVariablesMutation.mutateAsync(combinedTemplate)
    return result.variables
  }

  const handlePreview = async () => {
    const result = await previewMutation.mutateAsync({
      template: showPreview ? bodyHtml : bodyText,
      variables: previewVars,
    })
    return result
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const variables = await handleExtractVariables()

    await createMutation.mutateAsync({
      name,
      subject,
      bodyHtml,
      bodyText,
      variables,
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
        <h1 className="text-3xl font-bold">Create Email Template</h1>
        <p className="text-muted-foreground mt-2">
          Design personalized email templates with dynamic variables
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
            <CardTitle>Email Body (HTML)</CardTitle>
            <CardDescription>
              HTML version of your email. Use {'<p>'}, {'<br>'}, {'<ul>'}, etc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              className="w-full min-h-[300px] p-3 border rounded-md font-mono text-sm"
              placeholder="<p>Hi {{firstName}},</p>

<p>I came across {{businessName}} and was impressed by your {{rating}}-star rating!</p>

<p>Best regards,<br>
{{senderName}}</p>"
              required
            />
          </CardContent>
        </Card>

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
              placeholder="Hi {{firstName}},

I came across {{businessName}} and was impressed by your {{rating}}-star rating!

Best regards,
{{senderName}}"
              required
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={createMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {createMutation.isPending ? 'Saving...' : 'Save Template'}
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
