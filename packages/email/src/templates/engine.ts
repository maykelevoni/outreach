import Handlebars from 'handlebars'

export interface TemplateVariables {
  // Lead data
  firstName?: string
  lastName?: string
  businessName: string
  location?: string
  rating?: number
  reviewCount?: number
  website?: string
  phone?: string
  address?: string

  // Campaign data
  senderName?: string
  senderCompany?: string
  senderEmail?: string

  // Dynamic data
  currentDate?: string

  // Custom fields
  [key: string]: any
}

export class TemplateEngine {
  private handlebars: typeof Handlebars

  constructor() {
    this.handlebars = Handlebars.create()
    this.registerHelpers()
  }

  private registerHelpers() {
    // Capitalize helper
    this.handlebars.registerHelper('capitalize', (str: string) => {
      if (!str) return ''
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    })

    // Uppercase helper
    this.handlebars.registerHelper('upper', (str: string) => {
      if (!str) return ''
      return str.toUpperCase()
    })

    // Lowercase helper
    this.handlebars.registerHelper('lower', (str: string) => {
      if (!str) return ''
      return str.toLowerCase()
    })

    // Format date helper
    this.handlebars.registerHelper('formatDate', (date: Date | string, format?: string) => {
      const d = typeof date === 'string' ? new Date(date) : date
      if (format === 'long') {
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
      return d.toLocaleDateString('en-US')
    })

    // Spintax helper - randomly chooses one option
    this.handlebars.registerHelper('spin', (options: string) => {
      if (!options) return ''
      const choices = options.split('|')
      return choices[Math.floor(Math.random() * choices.length)]
    })

    // Default value helper
    this.handlebars.registerHelper('default', (value: any, defaultValue: any) => {
      return value || defaultValue
    })

    // Pluralize helper
    this.handlebars.registerHelper('pluralize', (count: number, singular: string, plural: string) => {
      return count === 1 ? singular : plural
    })
  }

  compile(template: string): (variables: TemplateVariables) => string {
    return this.handlebars.compile(template)
  }

  render(template: string, variables: TemplateVariables): string {
    const compiled = this.compile(template)

    // Add default variables
    const enrichedVariables: TemplateVariables = {
      ...variables,
      currentDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      firstName: variables.firstName || this.extractFirstName(variables.businessName),
    }

    return compiled(enrichedVariables)
  }

  renderSubject(subjectTemplate: string, variables: TemplateVariables): string {
    return this.render(subjectTemplate, variables)
  }

  renderBody(bodyTemplate: string, variables: TemplateVariables): string {
    return this.render(bodyTemplate, variables)
  }

  // Extract first name from business name as fallback
  private extractFirstName(businessName: string): string {
    // Try to extract owner name from patterns like "John's Pizza" or "Mike's Auto"
    const possessiveMatch = businessName.match(/^(\w+)'s/i)
    if (possessiveMatch) {
      return possessiveMatch[1]
    }

    // Just use "there" as a generic fallback
    return 'there'
  }

  // Validate template syntax
  validateTemplate(template: string): { valid: boolean; error?: string } {
    try {
      this.compile(template)
      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid template syntax'
      }
    }
  }

  // Extract variables used in template
  extractVariables(template: string): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g
    const variables = new Set<string>()

    let match
    while ((match = variableRegex.exec(template)) !== null) {
      // Extract variable name (remove helpers and paths)
      const varName = match[1].trim().split(' ')[0].split('.')[0]
      if (varName && !['if', 'unless', 'each', 'with'].includes(varName)) {
        variables.add(varName)
      }
    }

    return Array.from(variables)
  }
}

// Singleton instance
export const templateEngine = new TemplateEngine()

// Helper functions
export function renderEmailTemplate(
  template: string,
  variables: TemplateVariables
): string {
  return templateEngine.render(template, variables)
}

export function validateTemplate(template: string): { valid: boolean; error?: string } {
  return templateEngine.validateTemplate(template)
}
