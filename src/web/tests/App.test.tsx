import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import App from '../src/App'
import { theme } from '../src/theme/theme'
import { server } from './server'

function renderApp() {
  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <App />
      </LocalizationProvider>
    </ThemeProvider>,
  )
}

async function selectToday(user: ReturnType<typeof userEvent.setup>) {
  const openButtons = screen.getAllByLabelText('Choose date')
  await user.click(openButtons[0])
  await user.click(screen.getByRole('gridcell', { name: '17' }))
  await user.click(openButtons[1])
  await user.click(screen.getByRole('gridcell', { name: '17' }))
}

describe('급식 조회 통합 흐름', () => {
  it('두 글자 미만 검색을 차단한다', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText('학교 이름'), '서')
    await user.click(screen.getByRole('button', { name: '검색' }))

    expect(
      screen.getByText('학교 이름을 두 글자 이상 입력해 주세요.'),
    ).toBeInTheDocument()
  })

  it('학교 검색 결과가 없음을 오류와 구분한다', async () => {
    server.use(
      http.get('/api/v1/schools', () =>
        HttpResponse.json({ items: [], hasMore: false }),
      ),
    )
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText('학교 이름'), '없는학교')
    await user.click(screen.getByRole('button', { name: '검색' }))

    expect(
      await screen.findByText(/일치하는 학교가 없습니다/),
    ).toBeInTheDocument()
  })

  it('학교를 검색하고 날짜를 지정해 중식 메뉴를 표시한다', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText('학교 이름'), '서울고')
    await user.click(screen.getByRole('button', { name: '검색' }))
    await user.click(await screen.findByText('서울고등학교'))
    await selectToday(user)
    await user.click(screen.getByRole('button', { name: '급식 조회' }))

    expect(await screen.findByText('현미밥')).toBeInTheDocument()
    expect(screen.getByText('미역국')).toBeInTheDocument()
  })

  it('급식 API 실패 시 재시도 동작을 표시한다', async () => {
    server.use(
      http.get('/api/v1/meals', () =>
        HttpResponse.json(
          {
            type: 'https://example.invalid/problems/upstream-error',
            title: '외부 서비스 오류',
            status: 502,
            detail: '급식 정보를 불러오지 못했습니다.',
            code: 'UPSTREAM_ERROR',
            instance: null,
          },
          { status: 502, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText('학교 이름'), '서울고')
    await user.click(screen.getByRole('button', { name: '검색' }))
    await user.click(await screen.findByText('서울고등학교'))
    await selectToday(user)
    await user.click(screen.getByRole('button', { name: '급식 조회' }))

    expect(
      await screen.findByText('급식 정보를 불러오지 못했습니다.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })
})
