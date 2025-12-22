import { promises as dns } from 'dns'

export interface EmailValidation {
  email: string
  isValid: boolean
  checks: {
    syntax: boolean
    mxRecords: boolean
    disposable: boolean
  }
  confidence: number
}

// Common disposable email domains
const DISPOSABLE_DOMAINS = [
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'throwaway.email',
  'temp-mail.org',
  'mailinator.com',
  'maildrop.cc',
  'trashmail.com',
]

export class EmailValidator {
  async validate(email: string): Promise<EmailValidation> {
    const result: EmailValidation = {
      email,
      isValid: false,
      checks: {
        syntax: false,
        mxRecords: false,
        disposable: true,
      },
      confidence: 0,
    }

    // 1. Syntax validation
    result.checks.syntax = this.validateSyntax(email)
    if (!result.checks.syntax) {
      return result
    }

    // 2. Check if disposable
    result.checks.disposable = !this.isDisposable(email)
    if (!result.checks.disposable) {
      return result
    }

    // 3. MX record check
    result.checks.mxRecords = await this.checkMXRecords(email)

    // Calculate confidence
    let confidence = 0
    if (result.checks.syntax) confidence += 30
    if (result.checks.disposable) confidence += 20
    if (result.checks.mxRecords) confidence += 50

    result.confidence = confidence
    result.isValid = confidence >= 80

    return result
  }

  private validateSyntax(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private isDisposable(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return true

    return DISPOSABLE_DOMAINS.some((disposable) =>
      domain.includes(disposable)
    )
  }

  private async checkMXRecords(email: string): boolean {
    const domain = email.split('@')[1]
    if (!domain) return false

    try {
      const records = await dns.resolveMx(domain)
      return records.length > 0
    } catch (error) {
      // If DNS lookup fails, assume invalid
      return false
    }
  }

  async validateBatch(emails: string[]): Promise<EmailValidation[]> {
    const validations = await Promise.all(
      emails.map((email) => this.validate(email))
    )
    return validations
  }

  // Get best email from a list
  getBestEmail(validations: EmailValidation[]): string | null {
    const valid = validations
      .filter((v) => v.isValid)
      .sort((a, b) => b.confidence - a.confidence)

    return valid[0]?.email || null
  }
}

// Helper function
export async function validateEmail(email: string): Promise<EmailValidation> {
  const validator = new EmailValidator()
  return await validator.validate(email)
}

export async function findBestEmail(emails: string[]): Promise<string | null> {
  const validator = new EmailValidator()
  const validations = await validator.validateBatch(emails)
  return validator.getBestEmail(validations)
}
