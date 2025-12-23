import { NextRequest, NextResponse } from 'next/server'
import { db, emails, emailEvents, leads } from 'database'
import { eq } from 'drizzle-orm'

/**
 * Resend Webhook Handler
 *
 * Handles events from Resend:
 * - email.sent
 * - email.delivered
 * - email.delivery_delayed
 * - email.bounced
 * - email.complained
 */

interface ResendWebhookEvent {
  type: string
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    created_at: string
    tags?: { name: string; value: string }[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const event: ResendWebhookEvent = await request.json()

    console.log(`📨 Resend webhook received: ${event.type}`)

    const resendEmailId = event.data.email_id

    // Find email by Resend ID
    const [email] = await db
      .select()
      .from(emails)
      .where(eq(emails.resendEmailId, resendEmailId))
      .limit(1)

    if (!email) {
      console.warn(`Email not found for Resend ID: ${resendEmailId}`)
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // Map Resend event types to our event types
    const eventTypeMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.delivery_delayed': 'delayed',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
    }

    const eventType = eventTypeMap[event.type]

    if (!eventType) {
      console.warn(`Unknown Resend event type: ${event.type}`)
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // Record the event
    await db.insert(emailEvents).values({
      emailId: email.id,
      eventType: eventType as any,
      metadata: {
        resendEventType: event.type,
        resendEmailId,
        timestamp: event.created_at,
        from: event.data.from,
        to: event.data.to,
        subject: event.data.subject,
      },
    })

    // Update email status for significant events
    if (eventType === 'delivered') {
      await db
        .update(emails)
        .set({
          status: 'delivered',
          updatedAt: new Date(),
        })
        .where(eq(emails.id, email.id))

      console.log(`✅ Email delivered: ${email.id}`)
    }

    if (eventType === 'bounced') {
      await db
        .update(emails)
        .set({
          status: 'bounced',
          errorMessage: 'Email bounced',
          updatedAt: new Date(),
        })
        .where(eq(emails.id, email.id))

      // Update lead status to bounced
      await db
        .update(leads)
        .set({
          status: 'bounced',
          updatedAt: new Date(),
        })
        .where(eq(leads.id, email.leadId))

      console.log(`❌ Email bounced: ${email.id}`)
    }

    if (eventType === 'complained') {
      await db
        .update(emails)
        .set({
          status: 'failed',
          errorMessage: 'Spam complaint',
          updatedAt: new Date(),
        })
        .where(eq(emails.id, email.id))

      // Update lead to unsubscribed (stop sending)
      await db
        .update(leads)
        .set({
          status: 'unsubscribed',
          updatedAt: new Date(),
        })
        .where(eq(leads.id, email.leadId))

      console.log(`⚠️ Spam complaint: ${email.id}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Error processing Resend webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
