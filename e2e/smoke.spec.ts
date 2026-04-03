import { expect, test, type Page } from '@playwright/test'
import { getTestLoginCookieName, signTestSession } from '../lib/test-login'

async function seedBandLogin(page: Page) {
  const adminCookie = `${getTestLoginCookieName()}=${signTestSession({ role: 'admin', username: 'stagesync-admin' })}`
  const response = await page.request.post('/api/testing/logins', {
    headers: { cookie: adminCookie },
    form: {
      action: 'upsert',
      role: 'band',
      username: 'neon-echo-band',
      password: 'BandTest123!',
      bandName: 'Finding North',
      bandAccessLevel: 'admin',
    },
  })

  if (!response.ok()) {
    throw new Error(await response.text())
  }
}

async function signInAsBand(page: Page) {
  const response = await page.request.post('/api/testing/login', {
    data: { role: 'band', username: 'neon-echo-band', password: 'BandTest123!' },
  })

  if (!response.ok()) {
    throw new Error(await response.text())
  }

  const setCookie = response.headers()['set-cookie'] ?? ''
  const cookieValue = setCookie.match(/stagesync_test_session=([^;]+)/)?.[1]
  if (!cookieValue) {
    throw new Error('Band login did not return a test-session cookie.')
  }

  await page.context().addCookies([
    {
      name: getTestLoginCookieName(),
      value: cookieValue,
      url: 'http://localhost:3000',
    },
  ])

  return cookieValue
}

async function createTestShow(page: Page, cookieValue: string, name = 'Smoke Show') {
  const response = await page.request.post('/api/testing/show', {
    headers: { cookie: `${getTestLoginCookieName()}=${cookieValue}` },
    form: {
      action: 'create',
      name,
      description: 'Smoke test show',
    },
  })

  if (!response.ok()) {
    throw new Error(await response.text())
  }
}

test('shows the StageSync homepage', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/StageSync/)
  await expect(page.getByRole('heading', { name: /live band karaoke simplified/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /band portal/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /learn more/i })).toBeVisible()
})

test('supports the band dashboard, subpages, singer link, and logout', async ({ page }) => {
  await seedBandLogin(page)
  const bandCookie = await signInAsBand(page)
  await createTestShow(page, bandCookie)

  await page.goto('/band')
  await expect(page).toHaveTitle(/StageSync/)
  await expect(page.getByRole('heading', { name: /stageSync band dashboard/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /account/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /members/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /song library/i })).toBeVisible()

  const singerSignupHref = await page.locator('a[href*="/singer?band="]').first().getAttribute('href')
  expect(singerSignupHref).toContain('/singer?band=')

  await page.goto('/band/account')
  await expect(page.getByRole('heading', { name: /band account/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /edit band admin/i })).toBeVisible()

  await page.goto('/band/members')
  await expect(page.getByRole('heading', { name: /band members/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /create member/i })).toBeVisible()

  await page.goto('/band/songs')
  await expect(page.getByRole('heading', { name: /song library/i })).toBeVisible()

  await page.goto('/band')
  await page.getByRole('button', { name: /^log out$/i }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: /live band karaoke simplified/i })).toBeVisible()
})

test('supports the singer signup page generated from the band dashboard', async ({ page }) => {
  await seedBandLogin(page)
  const bandCookie = await signInAsBand(page)
  await createTestShow(page, bandCookie, 'Singer Smoke Show')

  await page.goto('/band')
  const singerSignupHref = await page.locator('a[href*="/singer?band="]').first().getAttribute('href')
  expect(singerSignupHref).toBeTruthy()

  await page.goto(singerSignupHref!)
  await expect(page.locator('body')).toContainText(/stageSync singer page|no active show yet/i)
})

test('shows the admin access gate', async ({ page }) => {
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'StageSync Admin Login' })).toBeVisible()
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()

  await page.goto('/admin/bands')
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()

  await page.goto('/admin/users')
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()

  await page.goto('/admin/analytics')
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
})
