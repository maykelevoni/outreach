export interface DefaultTemplate {
  name: string
  subject: string
  bodyHtml: string
  bodyText: string
  variables: string[]
  description: string
}

export const defaultTemplates: DefaultTemplate[] = [
  {
    name: 'Professional Introduction',
    subject: 'Quick question about {{businessName}}',
    bodyHtml: `<p>Hi {{firstName}},</p>

<p>I came across {{businessName}} while searching for businesses in {{location}}, and I was impressed by your {{rating}}-star rating!</p>

<p>I wanted to reach out because I help businesses like yours [YOUR VALUE PROPOSITION HERE].</p>

<p>Would you be open to a quick 15-minute call to discuss how we could help {{businessName}}?</p>

<p>Best regards,<br>
{{senderName}}<br>
{{senderCompany}}</p>`,
    bodyText: `Hi {{firstName}},

I came across {{businessName}} while searching for businesses in {{location}}, and I was impressed by your {{rating}}-star rating!

I wanted to reach out because I help businesses like yours [YOUR VALUE PROPOSITION HERE].

Would you be open to a quick 15-minute call to discuss how we could help {{businessName}}?

Best regards,
{{senderName}}
{{senderCompany}}`,
    variables: ['firstName', 'businessName', 'location', 'rating', 'senderName', 'senderCompany'],
    description: 'Professional introduction email template with value proposition',
  },
  {
    name: 'Partnership Opportunity',
    subject: 'Partnership opportunity for {{businessName}}',
    bodyHtml: `<p>{{spin "Hi|Hello|Hey"}} {{firstName}},</p>

<p>I hope this email finds you well!</p>

<p>I'm reaching out because I believe there's a great partnership opportunity between {{businessName}} and {{senderCompany}}.</p>

<p>We specialize in [YOUR SPECIALTY] and have helped similar businesses in {{location}} achieve [SPECIFIC RESULTS].</p>

<p>I'd love to explore how we could work together. Are you available for a brief chat this week?</p>

<p>Looking forward to hearing from you!</p>

<p>{{senderName}}<br>
{{senderCompany}}<br>
{{senderEmail}}</p>`,
    bodyText: `{{spin "Hi|Hello|Hey"}} {{firstName}},

I hope this email finds you well!

I'm reaching out because I believe there's a great partnership opportunity between {{businessName}} and {{senderCompany}}.

We specialize in [YOUR SPECIALTY] and have helped similar businesses in {{location}} achieve [SPECIFIC RESULTS].

I'd love to explore how we could work together. Are you available for a brief chat this week?

Looking forward to hearing from you!

{{senderName}}
{{senderCompany}}
{{senderEmail}}`,
    variables: ['firstName', 'businessName', 'location', 'senderName', 'senderCompany', 'senderEmail'],
    description: 'Partnership opportunity email with spin syntax for variety',
  },
  {
    name: 'Service Offer',
    subject: '{{businessName}} - Special offer for {{location}} businesses',
    bodyHtml: `<p>Hi {{firstName}},</p>

<p>I noticed {{businessName}} has an excellent {{rating}}-star rating with {{reviewCount}} reviews - congratulations on building such a great reputation!</p>

<p>We're offering a limited-time promotion for top-rated businesses in {{location}}:</p>

<ul>
  <li>[BENEFIT 1]</li>
  <li>[BENEFIT 2]</li>
  <li>[BENEFIT 3]</li>
</ul>

<p>This offer is only available until {{currentDate}}.</p>

<p>Would you like to learn more? Just reply to this email or call me at [YOUR PHONE].</p>

<p>Thanks,<br>
{{senderName}}</p>`,
    bodyText: `Hi {{firstName}},

I noticed {{businessName}} has an excellent {{rating}}-star rating with {{reviewCount}} reviews - congratulations on building such a great reputation!

We're offering a limited-time promotion for top-rated businesses in {{location}}:

- [BENEFIT 1]
- [BENEFIT 2]
- [BENEFIT 3]

This offer is only available until {{currentDate}}.

Would you like to learn more? Just reply to this email or call me at [YOUR PHONE].

Thanks,
{{senderName}}`,
    variables: ['firstName', 'businessName', 'rating', 'reviewCount', 'location', 'currentDate', 'senderName'],
    description: 'Service offer email highlighting business ratings',
  },
  {
    name: 'Simple Introduction',
    subject: '{{firstName}} - thought you might be interested',
    bodyHtml: `<p>Hi {{firstName}},</p>

<p>Quick intro - I'm {{senderName}} from {{senderCompany}}.</p>

<p>I help businesses like {{businessName}} with [WHAT YOU DO].</p>

<p>Interested in learning more?</p>

<p>Best,<br>
{{senderName}}</p>`,
    bodyText: `Hi {{firstName}},

Quick intro - I'm {{senderName}} from {{senderCompany}}.

I help businesses like {{businessName}} with [WHAT YOU DO].

Interested in learning more?

Best,
{{senderName}}`,
    variables: ['firstName', 'businessName', 'senderName', 'senderCompany'],
    description: 'Short and simple introduction email',
  },
  {
    name: 'Value-First Approach',
    subject: 'Free resource for {{businessName}}',
    bodyHtml: `<p>Hi {{firstName}},</p>

<p>I was researching businesses in {{location}} and came across {{businessName}}.</p>

<p>I created a free guide that I think could be valuable for you: [GUIDE TITLE]</p>

<p>It covers:</p>
<ul>
  <li>[POINT 1]</li>
  <li>[POINT 2]</li>
  <li>[POINT 3]</li>
</ul>

<p>No strings attached - just thought it might help!</p>

<p>Download it here: [LINK]</p>

<p>Cheers,<br>
{{senderName}}<br>
{{senderCompany}}</p>`,
    bodyText: `Hi {{firstName}},

I was researching businesses in {{location}} and came across {{businessName}}.

I created a free guide that I think could be valuable for you: [GUIDE TITLE]

It covers:
- [POINT 1]
- [POINT 2]
- [POINT 3]

No strings attached - just thought it might help!

Download it here: [LINK]

Cheers,
{{senderName}}
{{senderCompany}}`,
    variables: ['firstName', 'businessName', 'location', 'senderName', 'senderCompany'],
    description: 'Value-first email offering free resource',
  },
]
