export type TermsSection = {
  title: string
  paragraphs: string[]
}

export function getTermsSections(): TermsSection[] {
  return [
    {
      title: 'Who provides the service',
      paragraphs: [
        'StageSync is operated as a software service for bands, venues, and singers. The account holder or operator who signs up for the service is responsible for making sure they have authority to use the account and accept these terms on behalf of the band or venue they represent.',
        'If a venue or band uses StageSync through an internal operator, that operator is acting for the account owner and not for StageSync.',
      ],
    },
    {
      title: 'User responsibilities',
      paragraphs: [
        'You are responsible for show setup, queue actions, song selections, access control, and any content or conduct that you publish through the service.',
        'You must not upload unlawful, abusive, infringing, or harmful content, and you should not use StageSync in a way that interferes with another account or the underlying systems.',
      ],
    },
    {
      title: 'Payments, refunds, and cancellations',
      paragraphs: [
        'Paid access, subscriptions, credits, discounts, cancellations, and refunds are governed by the plan or checkout flow that is presented at the time of purchase, together with any provider-hosted payment rules.',
        'Unless a checkout or invoice flow says otherwise, fees already processed through a hosted payment provider are handled outside StageSync’s raw card boundary and may be non-refundable except where required by law or the applicable provider policy.',
      ],
    },
    {
      title: 'Venue and band relationship boundaries',
      paragraphs: [
        'Bands, venues, and singers are responsible for their own agreements, schedules, and show behavior. StageSync coordinates the workflow but does not own the relationship between a venue and a band.',
        'If a venue requires custom terms, venue-level access, or multi-room configuration, those arrangements apply to the specific account or room configuration that was approved internally.',
      ],
    },
    {
      title: 'Privacy and data boundaries',
      paragraphs: [
        'The Privacy Policy describes how account, show, queue, and billing references are stored and shared. StageSync keeps payment credentials with the hosted payment provider and only retains provider IDs, statuses, and billing references needed to operate the service.',
        'Do not submit sensitive data to the service unless the workflow explicitly asks for it and the user understands what is being collected.',
      ],
    },
    {
      title: 'Warranty disclaimer and limitation of liability',
      paragraphs: [
        'StageSync is provided on an "as is" and "as available" basis without warranties of uninterrupted service, fitness for a particular purpose, or error-free operation.',
        'To the maximum extent permitted by law, StageSync is not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, lost business, or lost data arising from use of the service.',
      ],
    },
  ]
}

export function getTermsAcceptancePrompt() {
  return 'By continuing, you confirm that you have authority to use the account and that you understand the payment, privacy, and usage rules described here.'
}
