import { Resend } from 'resend'
import type { TemplateVariables } from '../templates/engine'

export interface EmailOptions {
  from: string
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
  tags?: { name: string; value: string }[]
}

export interface SendEmailResult {
  success: boolean
  emailId?: string
  error?: string
}

export class ResendEmailClient {
  private client: Resend | null = null

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new Resend(apiKey)
    }
  }

  isConfigured(): boolean {
    return this.client !== null
  }

  async sendEmail(options: EmailOptions): Promise<SendEmailResult> {
    if (!this.client) {
      return {
        success: false,
        error: 'Resend API key not configured',
      }
    }

    try {
      const response = await this.client.emails.send({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
        tags: options.tags,
      })

      if (response.error) {
        return {
          success: false,
          error: response.error.message,
        }
      }

      return {
        success: true,
        emailId: response.data?.id,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error sending email',
      }
    }
  }

  async sendBatch(emails: EmailOptions[]): Promise<SendEmailResult[]> {
    if (!this.client) {
      return emails.map(() => ({
        success: false,
        error: 'Resend API key not configured',
      }))
    }

    try {
      const response = await this.client.batch.send(
        emails.map((email) => ({
          from: email.from,
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          reply_to: email.replyTo,
          tags: email.tags,
        }))
      )

      if (response.error) {
        return emails.map(() => ({
          success: false,
          error: response.error!.message,
        }))
      }

      return (
        response.data?.map((item) => ({
          success: true,
          emailId: item.id,
        })) || []
      )
    } catch (error) {
      return emails.map(() => ({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error sending batch',
      }))
    }
  }
}

// Singleton instance
let resendClient: ResendEmailClient | null = null

export function getResendClient(): ResendEmailClient {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    resendClient = new ResendEmailClient(apiKey)
  }
  return resendClient
}

// Helper function to send a single email
export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  const client = getResendClient()
  return client.sendEmail(options)
}

// Helper function to send batch emails
export async function sendBatchEmails(emails: EmailOptions[]): Promise<SendEmailResult[]> {
  const client = getResendClient()
  return client.sendBatch(emails)
}
