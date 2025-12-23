import { NextRequest, NextResponse } from 'next/server'
import { db, emails, emailEvents, emailLinks } from 'database'
import { eq, and } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { emailId: string; linkId: string } }
) {
  const { emailId, linkId } = params

  try {
    // Get the link information
    const [link] = await db.select().from(emailLinks).where(eq(emailLinks.id, linkId)).limit(1)

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    // Record the click event
    await db.insert(emailEvents).values({
      emailId: emailId,
      eventType: 'clicked' as const,
      metadata: {
        linkId,
        url: link.originalUrl,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        timestamp: new Date().toISOString(),
      },
    })

    // Update link click count
    await db
      .update(emailLinks)
      .set({
        clickCount: (link.clickCount || 0) + 1,
      })
      .where(eq(emailLinks.id, linkId))

    // Check if this is the first click for this email
    const existingClicks = await db
      .select()
      .from(emailEvents)
      .where(and(eq(emailEvents.emailId, emailId), eq(emailEvents.eventType, 'clicked')))

    if (existingClicks.length === 1) {
      // First click - update email status
      await db
        .update(emails)
        .set({
          status: 'clicked',
          updatedAt: new Date(),
        })
        .where(eq(emails.id, emailId))
    }

    console.log(`🖱️ Link clicked: Email ${emailId}, Link ${linkId}`)

    // Redirect to original URL
    return NextResponse.redirect(link.originalUrl, { status: 302 })
  } catch (error) {
    console.error('Error tracking click:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
