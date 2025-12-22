import { chromium, Browser, Page } from 'playwright'
import { z } from 'zod'

// Schema for scraped business data
export const BusinessSchema = z.object({
  businessName: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  categories: z.array(z.string()).optional(),
  mapsUrl: z.string().optional(),
})

export type Business = z.infer<typeof BusinessSchema>

export interface ScraperOptions {
  keyword: string
  location: string
  maxResults?: number
  headless?: boolean
  proxyUrl?: string
  timeout?: number
}

export class GoogleMapsScraper {
  private browser: Browser | null = null
  private page: Page | null = null

  constructor(private options: ScraperOptions) {}

  async initialize() {
    const launchOptions: any = {
      headless: this.options.headless ?? true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    }

    // Add proxy if provided
    if (this.options.proxyUrl) {
      launchOptions.proxy = {
        server: this.options.proxyUrl,
      }
    }

    this.browser = await chromium.launch(launchOptions)
    const context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
    })
    this.page = await context.newPage()

    // Anti-detection: Override navigator.webdriver
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      })
    })
  }

  async scrape(): Promise<Business[]> {
    if (!this.page) {
      throw new Error('Scraper not initialized. Call initialize() first.')
    }

    const searchQuery = `${this.options.keyword} ${this.options.location}`
    const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`

    console.log(`🔍 Searching Google Maps: ${searchQuery}`)

    try {
      await this.page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.options.timeout || 60000,
      })

      // Wait for results to load
      await this.randomDelay(2000, 4000)

      // Check if results exist
      const hasResults = await this.page.locator('[role="feed"]').count()
      if (hasResults === 0) {
        console.log('⚠️ No results found')
        return []
      }

      // Scroll to load more results
      await this.scrollResults()

      // Extract business data
      const businesses = await this.extractBusinesses()

      console.log(`✅ Found ${businesses.length} businesses`)
      return businesses.slice(0, this.options.maxResults || 100)
    } catch (error) {
      console.error('❌ Scraping error:', error)
      throw error
    }
  }

  private async scrollResults() {
    if (!this.page) return

    const feedSelector = '[role="feed"]'
    const maxScrolls = 10
    let scrollCount = 0

    while (scrollCount < maxScrolls) {
      // Get current number of results
      const beforeCount = await this.page.locator('a[href*="maps/place"]').count()

      // Scroll the feed container
      await this.page.evaluate((selector) => {
        const feed = document.querySelector(selector)
        if (feed) {
          feed.scrollTop = feed.scrollHeight
        }
      }, feedSelector)

      // Random human-like delay
      await this.randomDelay(1500, 3000)

      // Check if new results loaded
      const afterCount = await this.page.locator('a[href*="maps/place"]').count()

      if (afterCount === beforeCount) {
        // No new results, we've reached the end
        break
      }

      scrollCount++
    }
  }

  private async extractBusinesses(): Promise<Business[]> {
    if (!this.page) return []

    const businesses: Business[] = []

    // Get all business cards
    const businessCards = this.page.locator('a[href*="maps/place"]')
    const count = await businessCards.count()

    console.log(`📋 Extracting data from ${count} business cards...`)

    for (let i = 0; i < count; i++) {
      try {
        const card = businessCards.nth(i)

        // Extract basic info from the card
        const ariaLabel = await card.getAttribute('aria-label')
        if (!ariaLabel) continue

        // Click to open detail panel
        await card.click()
        await this.randomDelay(1000, 2000)

        // Wait for details to load
        await this.page.waitForSelector('h1', { timeout: 5000 }).catch(() => null)

        // Extract detailed information
        const business = await this.page.evaluate(() => {
          const data: Partial<Business> = {}

          // Business name
          const nameElement = document.querySelector('h1')
          if (nameElement) {
            data.businessName = nameElement.textContent?.trim() || ''
          }

          // Rating
          const ratingElement = document.querySelector('[role="img"][aria-label*="stars"]')
          if (ratingElement) {
            const ariaLabel = ratingElement.getAttribute('aria-label') || ''
            const match = ariaLabel.match(/(\d+\.?\d*)\s*stars?/)
            if (match) {
              data.rating = parseFloat(match[1])
            }
          }

          // Review count
          const reviewElement = document.querySelector('button[aria-label*="reviews"]')
          if (reviewElement) {
            const text = reviewElement.textContent || ''
            const match = text.match(/([\d,]+)\s*reviews?/)
            if (match) {
              data.reviewCount = parseInt(match[1].replace(/,/g, ''))
            }
          }

          // Address
          const addressButton = document.querySelector('button[data-item-id="address"]')
          if (addressButton) {
            const addressText = addressButton.querySelector('div[class*="fontBodyMedium"]')
            if (addressText) {
              data.address = addressText.textContent?.trim()
            }
          }

          // Phone
          const phoneButton = document.querySelector('button[data-item-id*="phone"]')
          if (phoneButton) {
            const phoneText = phoneButton.querySelector('div[class*="fontBodyMedium"]')
            if (phoneText) {
              data.phone = phoneText.textContent?.trim()
            }
          }

          // Website
          const websiteLink = document.querySelector('a[data-item-id="authority"]')
          if (websiteLink) {
            data.website = websiteLink.getAttribute('href') || undefined
          }

          // Categories
          const categoryButton = document.querySelector('button[jsaction*="category"]')
          if (categoryButton) {
            const categoryText = categoryButton.textContent?.trim()
            if (categoryText) {
              data.categories = [categoryText]
            }
          }

          return data
        })

        // Add Maps URL
        business.mapsUrl = this.page?.url()

        // Validate and add to results
        const validated = BusinessSchema.safeParse(business)
        if (validated.success) {
          businesses.push(validated.data)
          console.log(`  ✓ ${i + 1}/${count}: ${validated.data.businessName}`)
        }

        // Random delay between businesses
        await this.randomDelay(500, 1500)
      } catch (error) {
        console.error(`  ✗ Error extracting business ${i + 1}:`, error)
        continue
      }
    }

    return businesses
  }

  private async randomDelay(min: number, max: number) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.page = null
    }
  }
}

// Export convenience function
export async function scrapeGoogleMaps(
  options: ScraperOptions
): Promise<Business[]> {
  const scraper = new GoogleMapsScraper(options)
  try {
    await scraper.initialize()
    const results = await scraper.scrape()
    return results
  } finally {
    await scraper.close()
  }
}
