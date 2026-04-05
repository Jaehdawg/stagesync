# StageSync Backlog

## Monetization

- [ ] Follow the build plan in `docs/monetization-build-plan.md`
- [ ] Legal first: #42, #57, #58
- [ ] Core monetization foundation: #36, #43, #44, #45
- [ ] Per-event credits: #38, #46, #47
- [ ] Professional subscription: #37, #53, #54
- [ ] Billing UX: #40, #55, #56
- [ ] Analytics and reporting: #41, #51, #52
- [ ] Venue workflow: #39, #48, #49, #50

## Mailers

- [ ] Update Supabase magic link email template
  - Title: `StageSync SignUp Confirmation`
  - Body:
    ```
    Thanks for signing up to sing!

    Click this link to start adding songs.
    ```

## Show controls

- [ ] Limit singer song signups to active shows only
  - Singing requests should be allowed only while a show is active.
  - When a band ends a show, new song signups must stop immediately.
- [ ] Allow bands to pause singer signups during a show
  - Bands need a control to stop new singer signups without ending the show.
- [ ] Add show-duration-based signup limits
  - Max song signups should be derived from show duration.
  - Include an adjustable buffer between songs.
