import { templateEngine, type TemplateVariables } from '../templates/engine'
import { sendEmail, type EmailOptions, type SendEmailResult } from './resend-client'

export interface EmailTemplate {
  subject: string
  bodyHtml: string
  bodyText: string
}

export interface ComposeEmailOptions {
  template: EmailTemplate
  variables: TemplateVariables
  from: string
  to: string
  replyTo?: string
  trackingEnabled?: boolean
  campaignId?: string
  leadId?: string
}

export interface ComposedEmail {
  from: string
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
  tags?: { name: string; value: string }[]
}

export class EmailComposer {
  composeEmail(options: ComposeEmailOptions): ComposedEmail {
    // Render subject and body with template engine
    const subject = templateEngine.render(options.template.subject, options.variables)
    const html = templateEngine.render(options.template.bodyHtml, options.variables)
    const text = templateEngine.render(options.template.bodyText, options.variables)

    // Build tags for tracking
    const tags: { name: string; value: string }[] = []
    if (options.campaignId) {
      tags.push({ name: 'campaign_id', value: options.campaignId })
    }
    if (options.leadId) {
      tags.push({ name: 'lead_id', value: options.leadId })
    }

    // Add tracking pixel if enabled
    let finalHtml = html
    if (options.trackingEnabled && options.leadId) {
      const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/api/track/open/${options.leadId}" width="1" height="1" alt="" style="display:block" />`
      finalHtml = html + trackingPixel
    }

    return {
      from: options.from,
      to: options.to,
      subject,
      html: finalHtml,
      text,
      replyTo: options.replyTo,
      tags: tags.length > 0 ? tags : undefined,
    }
  }

  async composeAndSend(options: ComposeEmailOptions): Promise<SendEmailResult> {
    const composed = this.composeEmail(options)
    return sendEmail(composed)
  }
}

// Singleton instance
export const emailComposer = new EmailComposer()

// Helper function
export async function composeAndSendEmail(
  options: ComposeEmailOptions
): Promise<SendEmailResult> {
  return emailComposer.composeAndSend(options)
}
