import OutscraperClient from 'outscraper'

export interface OutscraperBusiness {
  name: string
  address?: string
  phone?: string
  website?: string
  email?: string
  rating?: number
  reviews_count?: number
  category?: string
  latitude?: number
  longitude?: number
  place_id?: string
  maps_url?: string
}

export interface OutscraperOptions {
  keyword: string
  location: string
  maxResults?: number
  apiKey: string
}

export async function scrapeWithOutscraper(options: OutscraperOptions): Promise<OutscraperBusiness[]> {
  console.log(`🔍 Scraping Google Maps via Outscraper: ${options.keyword} in ${options.location}`)

  const client = new OutscraperClient(options.apiKey)

  try {
    // Format the query for Outscraper
    const query = `${options.keyword} ${options.location}`
    const limit = options.maxResults || 100

    console.log(`  Query: "${query}", Limit: ${limit}`)

    // Call Outscraper API with parameters object
    const results = await client.googleMapsSearch(
      [query],
      limit,
      'en',
      'us',
      {},  // coordinates
      false // async - must be false for immediate results
    )

    console.log(`  Raw results type: ${typeof results}`)
    console.log(`  Raw results:`, JSON.stringify(results, null, 2).substring(0, 500))

    if (!results) {
      console.log('⚠️ No results returned from Outscraper API')
      return []
    }

    // Transform Outscraper results to our format
    const businesses: OutscraperBusiness[] = []

    // Handle if results is directly an array of businesses
    if (Array.isArray(results)) {
      for (const result of results) {
        if (Array.isArray(result)) {
          // Results come as nested arrays
          for (const business of result) {
            businesses.push({
              name: business.name || '',
              address: business.full_address || business.address || undefined,
              phone: business.phone || undefined,
              website: business.site || business.website || undefined,
              email: business.emails?.[0] || undefined,
              rating: business.rating || undefined,
              reviews_count: business.reviews || business.reviews_count || undefined,
              category: business.category || business.type || undefined,
              latitude: business.latitude || undefined,
              longitude: business.longitude || undefined,
              place_id: business.place_id || undefined,
              maps_url: business.google_maps_url || business.url || undefined,
            })
          }
        } else if (result && typeof result === 'object') {
          // Single business object
          businesses.push({
            name: result.name || '',
            address: result.full_address || result.address || undefined,
            phone: result.phone || undefined,
            website: result.site || result.website || undefined,
            email: result.emails?.[0] || undefined,
            rating: result.rating || undefined,
            reviews_count: result.reviews || result.reviews_count || undefined,
            category: result.category || result.type || undefined,
            latitude: result.latitude || undefined,
            longitude: result.longitude || undefined,
            place_id: result.place_id || undefined,
            maps_url: result.google_maps_url || result.url || undefined,
          })
        }
      }
    }

    console.log(`✅ Scraped ${businesses.length} businesses from Outscraper`)

    // Log some details about email extraction
    const withEmails = businesses.filter(b => b.email).length
    console.log(`  📧 ${withEmails} businesses have emails`)

    return businesses

  } catch (error) {
    console.error('❌ Outscraper API error:', error)
    throw new Error(`Outscraper scraping failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}
