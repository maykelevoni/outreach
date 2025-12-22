import { chromium } from 'playwright'

export interface ScrapedBusiness {
  name: string
  address?: string
  phone?: string
  website?: string
  rating?: number
  reviews_count?: number
}

export async function scrapeGoogleMapsPlaywright(
  keyword: string,
  location: string,
  maxResults: number = 20
): Promise<ScrapedBusiness[]> {
  console.log(`🔍 Scraping Google Maps: ${keyword} in ${location}`)

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ]
  })

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
  })

  const page = await context.newPage()

  // Remove automation indicators
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })

  try {
    // Search Google Maps
    const searchQuery = `${keyword} ${location}`
    await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    })

    // Wait for results
    await page.waitForSelector('div[role="feed"]', { timeout: 15000 })
    await page.waitForTimeout(3000)

    const results: ScrapedBusiness[] = []
    const seenNames = new Set<string>()

    // Scroll and collect results multiple times
    for (let scroll = 0; scroll < 5; scroll++) {
      // Get all business links
      const businesses = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'))
        return links.slice(0, 50).map(link => {
          // Try multiple selectors for name
          const nameEl = link.querySelector('[class*="fontHeadline"]') ||
                        link.querySelector('div[jsaction]') ||
                        link.querySelector('[role="heading"]')

          const name = nameEl?.textContent?.trim() || ''
          return { name }
        }).filter(b => b.name && b.name.length > 2)
      })

      console.log(`  Scroll ${scroll + 1}: Found ${businesses.length} potential businesses`)

      for (const biz of businesses) {
        if (biz.name && !seenNames.has(biz.name) && results.length < maxResults) {
          seenNames.add(biz.name)
          results.push({ name: biz.name })
          console.log(`    ✓ ${biz.name}`)
        }
      }

      if (results.length >= maxResults) break

      // Scroll the feed
      await page.evaluate(() => {
        const feed = document.querySelector('div[role="feed"]')
        if (feed) {
          feed.scrollBy(0, 800)
        }
      })
      await page.waitForTimeout(2000)
    }

    console.log(`✅ Total found: ${results.length} businesses`)
    await page.waitForTimeout(3000) // Keep browser open to debug
    return results

  } finally {
    await browser.close()
  }
}
