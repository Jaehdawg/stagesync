export type VenueReportItem = {
  title: string
  detail: string
}

export type VenueOperatorSection = {
  title: string
  description: string
  items: VenueReportItem[]
}

export function buildVenueOperatorSections(): VenueOperatorSection[] {
  return [
    {
      title: 'Venue reporting requirements',
      description: 'Venue operators need a durable view of activity across rooms, nights, and recurring partner bands.',
      items: [
        { title: 'Nightly occupancy', detail: 'Shows how many rooms are active and how busy each room is over the course of a night.' },
        { title: 'Band coverage', detail: 'Summarizes which bands are attached to the venue and how often they run shows there.' },
        { title: 'Sign-up volume', detail: 'Tracks singer sign-ups, queue length, and show starts per room.' },
        { title: 'Revenue / license status', detail: 'Captures the venue’s current commercial status and whether custom terms apply.' },
      ],
    },
    {
      title: 'Operator-facing summaries',
      description: 'Internal operators need quick summaries that answer “what is live, what is stale, and what needs help?”',
      items: [
        { title: 'Active rooms', detail: 'Rooms currently configured to accept sign-ups or host shows.' },
        { title: 'Recently active bands', detail: 'Bands that have used the venue recently, sorted by last show date.' },
        { title: 'Stale venues', detail: 'Venues with no recent activity or unreviewed setup issues.' },
        { title: 'Needs review', detail: 'Accounts that need support follow-up, contract review, or configuration fixes.' },
      ],
    },
    {
      title: 'Multi-band and multi-room access',
      description: 'A venue can host multiple bands and multiple rooms, so access needs to be explicit and scoped.',
      items: [
        { title: 'Venue-level membership', detail: 'Operators can manage the venue account while bands keep access to their own shows.' },
        { title: 'Room-level scope', detail: 'Rooms should be independently reportable so one venue can run multiple stages without mixing metrics.' },
        { title: 'Band-to-room mapping', detail: 'A band may be assigned to one or more rooms with clear rules for overrides and rotating nights.' },
        { title: 'Delegated support', detail: 'Support staff can review access without inheriting the ability to change venue billing or terms.' },
      ],
    },
    {
      title: 'Support and admin tools',
      description: 'Support staff need a minimal toolkit for onboarding, review, and escalation without touching raw payment data.',
      items: [
        { title: 'Venue notes', detail: 'Internal notes for contract status, setup details, and follow-up tasks.' },
        { title: 'Access review', detail: 'A way to see which operators, bands, and rooms currently have access.' },
        { title: 'Terms control', detail: 'Support should be able to confirm the active terms without changing payment data.' },
        { title: 'Escalation trail', detail: 'Keep a history of issues or support actions for future reference.' },
      ],
    },
  ]
}
