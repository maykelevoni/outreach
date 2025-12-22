import { NextRequest, NextResponse } from 'next/server'
import { db } from 'database/client'
import { leads, emails, emailEvents } from 'database/schema'
import { eq, and, desc } from 'drizzle-orm'

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  const leadId = params.leadId

  try {
    // Find the most recent email sent to this lead
    const [latestEmail] = await db
      .select()
      .from(emails)
      .where(and(eq(emails.leadId, leadId), eq(emails.status, 'sent')))
      .orderBy(desc(emails.sentAt))
      .limit(1)

    if (latestEmail) {
      // Check if already opened
      const existingOpen = await db
        .select()
        .from(emailEvents)
        .where(and(eq(emailEvents.emailId, latestEmail.id), eq(emailEvents.eventType, 'opened')))
        .limit(1)

      if (existingOpen.length === 0) {
        // First open - record the event
        await db.insert(emailEvents).values({
          emailId: latestEmail.id,
          eventType: 'opened',
          metadata: {
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            timestamp: new Date().toISOString(),
          },
        })

        // Update email status
        await db
          .update(emails)
          .set({
            status: 'opened',
            updatedAt: new Date(),
          })
          .where(eq(emails.id, latestEmail.id))

        // Update lead status
        await db
          .update(leads)
          .set({
            status: 'opened',
            updatedAt: new Date(),
          })
          .where(eq(leads.id, leadId))

        console.log(`📬 Email opened: Lead ${leadId}, Email ${latestEmail.id}`)
      } else {
        // Subsequent open - just log it
        await db.insert(emailEvents).values({
          emailId: latestEmail.id,
          eventType: 'opened',
          metadata: {
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            timestamp: new Date().toISOString(),
            subsequentOpen: true,
          },
        })
      }
    }
  } catch (error) {
    console.error('Error tracking email open:', error)
  }

  // Always return the tracking pixel
  return new NextResponse(TRACKING_PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
