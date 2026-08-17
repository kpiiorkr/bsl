import { expect, test } from '@playwright/test'

const school = {
  officeCode: 'B10',
  schoolCode: '7010569',
  name: '서울고등학교',
  schoolType: '고등학교',
  region: '서울특별시',
  address: '서울특별시 서초구',
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/schools?**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ items: [school], hasMore: false }),
    }),
  )
  await page.route('**/api/v1/meals?**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        school,
        from: '2026-08-17',
        to: '2026-08-17',
        items: [
          {
            date: '2026-08-17',
            mealType: '중식',
            dishes: ['현미밥', '미역국', '배추김치'],
            calories: '650.1 Kcal',
          },
        ],
      }),
    }),
  )
})

test('학교 검색부터 중식 결과까지 완료한다', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('학교 이름').fill('서울고')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  await page.getByRole('button', { name: /서울고등학교/ }).click()
  const openDatePicker = page.locator('button[data-mui-picker-open-button="true"]')
  for (const index of [0, 1]) {
    await openDatePicker.nth(index).click()
    await page
      .locator('button[role="gridcell"]:visible')
      .filter({ hasText: /^17$/ })
      .last()
      .click()
    const dialog = page.getByRole('dialog')
    const acceptButton = dialog.getByRole('button', { name: /OK|확인/ })
    if ((await acceptButton.count()) > 0 && (await acceptButton.isVisible())) {
      await acceptButton.click()
    }
  }
  await page.getByRole('button', { name: '급식 조회' }).click()

  await expect(page.getByText('현미밥')).toBeVisible()
  await expect(page.getByText('미역국')).toBeVisible()
})

test('두 글자 미만 검색을 요청 전에 차단한다', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('학교 이름').fill('서')
  await page.getByRole('button', { name: '검색', exact: true }).click()

  await expect(
    page.getByText('학교 이름을 두 글자 이상 입력해 주세요.'),
  ).toBeVisible()
})
