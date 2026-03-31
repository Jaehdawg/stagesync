# StageSync Backlog

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
