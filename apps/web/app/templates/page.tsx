'use client'

import { trpc } from '@/lib/trpc/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Mail, Edit, Trash2 } from 'lucide-react'

export default function TemplatesPage() {
  const { data: templates, isLoading, refetch } = trpc.templates.list.useQuery()
  const deleteMutation = trpc.templates.delete.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground mt-2">
            Manage your personalized email templates with variables and preview
          </p>
        </div>
        <Link href="/templates/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </Link>
      </div>

      {templates && templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Mail className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first email template with personalization variables like {'{{firstName}}'} and {'{{businessName}}'}
            </p>
            <Link href="/templates/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates?.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="mt-2">{template.description}</CardDescription>
                    )}
                  </div>
                  {template.isDefault && (
                    <Badge variant="secondary" className="ml-2">
                      Default
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Subject:</p>
                    <p className="text-sm">{template.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {'{{'}{variable}{'}}'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/templates/${template.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(template.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href="/campaigns">
          <Button variant="outline">Back to Campaigns</Button>
        </Link>
      </div>
    </div>
  )
}
