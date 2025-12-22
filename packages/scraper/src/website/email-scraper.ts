import { chromium, Browser, Page } from 'playwright'
import * as cheerio from 'cheerio'

export interface EmailScraperOptions {
  website: string
  timeout?: number
  headless?: boolean
}

export interface EmailDiscoveryResult {
  emails: string[]
  confidence: 'high' | 'medium' | 'low'
  source: string
  foundAt?: string
}

export class WebsiteEmailScraper {
  private browser: Browser | null = null
  private page: Page | null = null

  constructor(private options: EmailScraperOptions) {}

  async initialize() {
    this.browser = await chromium.launch({
      headless: this.options.headless ?? true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })
    this.page = await context.newPage()
  }

  async scrape(): Promise<EmailDiscoveryResult[]> {
    if (!this.page) {
      throw new Error('Scraper not initialized. Call initialize() first.')
    }

    const results: EmailDiscoveryResult[] = []

    try {
      const baseUrl = this.normalizeUrl(this.options.website)

      // Try common contact pages
      const pagesToCheck = [
        { path: '', name: 'homepage' },
        { path: '/contact', name: 'contact page' },
        { path: '/contact-us', name: 'contact page' },
        { path: '/about', name: 'about page' },
        { path: '/about-us', name: 'about page' },
        { path: '/team', name: 'team page' },
      ]

      for (const pageInfo of pagesToCheck) {
        try {
          const url = baseUrl + pageInfo.path
          const emails = await this.extractEmailsFromPage(url)

          if (emails.length > 0) {
            results.push({
              emails,
              confidence: this.getConfidence(pageInfo.name),
              source: pageInfo.name,
              foundAt: url,
            })
          }
        } catch (error) {
          // Continue to next page if this one fails
          continue
        }
      }

      return results
    } catch (error) {
      console.error('Email scraping error:', error)
      throw error
    }
  }

  private async extractEmailsFromPage(url: string): Promise<string[]> {
    if (!this.page) return []

    try {
      await this.page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.options.timeout || 30000,
      })

      // Get page content
      const html = await this.page.content()
      const $ = cheerio.load(html)

      // Remove script and style tags
      $('script, style, noscript').remove()

      // Get text content
      const text = $('body').text()

      // Also check mailto links
      const mailtoLinks: string[] = []
      $('a[href^="mailto:"]').each((_, el) => {
        const href = $(el).attr('href')
        if (href) {
          const email = href.replace('mailto:', '').split('?')[0]
          mailtoLinks.push(email)
        }
      })

      // Extract emails using regex
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
      const foundEmails = text.match(emailRegex) || []

      // Combine and deduplicate
      const allEmails = [...new Set([...foundEmails, ...mailtoLinks])]

      // Filter out common false positives
      return allEmails.filter(this.isValidEmail)
    } catch (error) {
      return []
    }
  }

  private isValidEmail(email: string): boolean {
    // Filter out common false positives
    const blocklist = [
      'example.com',
      'test.com',
      'domain.com',
      'email.com',
      'yoursite.com',
      'yourdomain.com',
      'wix.com',
      'wordpress.com',
      'sentry.io',
      'google.com',
      'facebook.com',
      'twitter.com',
      'instagram.com',
    ]

    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return false

    // Check blocklist
    if (blocklist.some((blocked) => domain.includes(blocked))) {
      return false
    }

    // Must be valid email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/
    if (!emailRegex.test(email)) {
      return false
    }

    // Filter out image/asset emails
    if (email.includes('cdn') || email.includes('static')) {
      return false
    }

    return true
  }

  private getConfidence(pageName: string): 'high' | 'medium' | 'low' {
    if (pageName.includes('contact')) return 'high'
    if (pageName.includes('about') || pageName.includes('team')) return 'medium'
    return 'low'
  }

  private normalizeUrl(url: string): string {
    // Remove trailing slash
    let normalized = url.replace(/\/$/, '')

    // Add https if no protocol
    if (!normalized.startsWith('http')) {
      normalized = 'https://' + normalized
    }

    return normalized
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.page = null
    }
  }
}

// Convenience function
export async function scrapeEmailsFromWebsite(
  options: EmailScraperOptions
): Promise<EmailDiscoveryResult[]> {
  const scraper = new WebsiteEmailScraper(options)
  try {
    await scraper.initialize()
    const results = await scraper.scrape()
    return results
  } finally {
    await scraper.close()
  }
}
