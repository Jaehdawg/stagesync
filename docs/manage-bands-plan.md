# Manage Bands / User Management Draft

## Goals
- Admin can create a band admin user and the band it belongs to in one flow.
- Band admins and members can belong to multiple bands.
- Band profile editing lives inside the band edit UI.
- Manage bands and user management support search + pagination.
- Deleting a band removes the band and all dependent band data, but preserves shared users by removing only their band-role association.

## Proposed data model

### 1) `bands`
Canonical band record.

### 2) `band_profiles`
One profile per band, linked by `band_id`.

### 3) `band_memberships`
Current tenant access for a member within a band.
- `band_id`
- `member_type` (`profile` | `test_login`)
- `member_key`
- `band_access_level` (`admin` | `member`)
- `active`

### 4) New roles table
Add a live profile-based role table so one profile can belong to multiple bands.
Suggested shape:
- `id`
- `band_id`
- `profile_id`
- `band_role` (`admin` | `member`)
- `active`
- timestamps

This lets a single profile be admin/member in multiple bands without overwriting anything.

## Band creation flow
When an admin or band admin creates a new band admin:
1. create/find the `bands` row
2. create the profile/user
3. create the band role entry for that profile
4. create the band profile row
5. optionally seed `events` + `show_settings` if needed

## Manage bands page
- list bands with search and pagination
- edit band opens a dialog/page section with:
  - band name
  - profile fields
  - associated members/admins
  - multi-band associations
- band profile fields move into the band edit experience

## User management page
- list users with search and pagination
- filters:
  - singers
  - band members
  - band admins
  - admins
- searchable band dropdown when creating a band member/admin

## Delete behavior
Deleting a band should:
- delete band profile
- delete dependent events/show settings/queue items/songs/import jobs tied to that band
- delete only that band's role/membership records
- keep shared users if they still belong to another band

## Implementation order
1. Introduce/finalize the live band-role table
2. Backfill existing associations
3. Wire create/edit band flows
4. Move band profile editing into manage bands
5. Add search + pagination to bands/users pages
6. Add safe delete cascade behavior
