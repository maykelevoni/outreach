import { z } from 'zod'

// Gosom API response schema
const GosomBusinessSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  email: z.string().email().optional(),
  rating: z.number().optional(),
  reviews_count: z.number().optional(),
  category: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  place_id: z.string().optional(),
  cid: z.string().optional(),
  maps_url: z.string().optional(),
})

export type GosomBusiness = z.infer<typeof GosomBusinessSchema>

const JobResponseSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  query: z.string(),
  results_count: z.number().optional(),
  created_at: z.string(),
})

export type JobResponse = z.infer<typeof JobResponseSchema>

export interface GosomScraperOptions {
  keyword: string
  location: string
  maxResults?: number
  extractEmails?: boolean
  apiUrl?: string
}

export class GosomScraperClient {
  private apiUrl: string

  constructor(apiUrl: string = 'http://localhost:8080') {
    this.apiUrl = apiUrl
  }

  /**
   * Create a new scraping job
   */
  async createJob(options: GosomScraperOptions): Promise<JobResponse> {
    const response = await fetch(`${this.apiUrl}/api/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${options.keyword}-${options.location}`,
        keywords: [`${options.keyword} ${options.location}`],
        lang: 'en',
        depth: options.maxResults || 10,
        email: options.extractEmails ?? true,
        max_time: 600, // 10 minutes
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create scraping job: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return JobResponseSchema.parse(data)
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobResponse> {
    const response = await fetch(`${this.apiUrl}/api/v1/jobs/${jobId}`)

    if (!response.ok) {
      throw new Error(`Failed to get job status: ${response.statusText}`)
    }

    const data = await response.json()
    return JobResponseSchema.parse(data)
  }

  /**
   * Wait for job to complete and return results
   */
  async waitForJob(jobId: string, pollInterval: number = 5000, timeout: number = 300000): Promise<GosomBusiness[]> {
    const startTime = Date.now()

    while (true) {
      const status = await this.getJobStatus(jobId)

      if (status.status === 'completed') {
        return await this.getJobResults(jobId)
      }

      if (status.status === 'failed') {
        throw new Error(`Job ${jobId} failed`)
      }

      if (Date.now() - startTime > timeout) {
        throw new Error(`Job ${jobId} timed out after ${timeout}ms`)
      }

      console.log(`⏳ Job ${jobId} status: ${status.status}, waiting ${pollInterval}ms...`)
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
    }
  }

  /**
   * Get job results
   */
  async getJobResults(jobId: string): Promise<GosomBusiness[]> {
    const response = await fetch(`${this.apiUrl}/api/v1/jobs/${jobId}/results`)

    if (!response.ok) {
      throw new Error(`Failed to get job results: ${response.statusText}`)
    }

    const data = await response.json()

    // Parse and validate results
    if (!Array.isArray(data)) {
      throw new Error('Invalid results format: expected array')
    }

    return data.map((item) => GosomBusinessSchema.parse(item))
  }

  /**
   * Download results as CSV
   */
  async downloadCSV(jobId: string): Promise<string> {
    const response = await fetch(`${this.apiUrl}/api/v1/jobs/${jobId}/download`)

    if (!response.ok) {
      throw new Error(`Failed to download CSV: ${response.statusText}`)
    }

    return await response.text()
  }

  /**
   * Convenience method: Create job and wait for results
   */
  async scrape(options: GosomScraperOptions): Promise<GosomBusiness[]> {
    console.log(`🔍 Starting Google Maps scrape: ${options.keyword} in ${options.location}`)

    const job = await this.createJob(options)
    console.log(`✅ Job created: ${job.id}`)

    const results = await this.waitForJob(job.id)
    console.log(`✅ Scraping completed: ${results.length} businesses found`)

    return results
  }

  /**
   * Check if the scraper service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })
      return response.ok
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }
}

// Export convenience function
export async function scrapeWithGosom(options: GosomScraperOptions): Promise<GosomBusiness[]> {
  const client = new GosomScraperClient(options.apiUrl)
  return await client.scrape(options)
}
