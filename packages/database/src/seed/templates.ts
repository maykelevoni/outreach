import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from root .env
dotenv.config({ path: resolve(__dirname, '../../../.env') })

import { db } from '../client.js'
import { emailTemplates } from '../schema/index.js'
import { defaultTemplates } from 'email'

export async function seedTemplates() {
  console.log('🌱 Seeding default email templates...')

  try {
    for (const template of defaultTemplates) {
      await db.insert(emailTemplates).values({
        name: template.name,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText,
        variables: template.variables,
        description: template.description,
        isDefault: true,
      })
      console.log(`  ✓ Created template: ${template.name}`)
    }

    console.log(`✅ Successfully seeded ${defaultTemplates.length} templates`)
  } catch (error) {
    console.error('❌ Error seeding templates:', error)
    throw error
  }
}

// Run if executed directly
if (require.main === module) {
  seedTemplates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
