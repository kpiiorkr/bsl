import { useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { Box, Container, Typography } from '@mui/material'
import { searchMeals, searchSchools } from './api/client'
import { DateRangeCard } from './components/DateRangeCard'
import { MealResultsCard } from './components/MealResultsCard'
import { SchoolSearchCard } from './components/SchoolSearchCard'
import type {
  MealSearchResponse,
  SchoolSearchResponse,
  SchoolSummary,
} from './types'

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

function App() {
  const [schoolResult, setSchoolResult] =
    useState<SchoolSearchResponse | null>(null)
  const [selectedSchool, setSelectedSchool] = useState<SchoolSummary | null>(
    null,
  )
  const [schoolLoading, setSchoolLoading] = useState(false)
  const [schoolError, setSchoolError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Dayjs | null>(null)
  const [endDate, setEndDate] = useState<Dayjs | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const [mealResult, setMealResult] = useState<MealSearchResponse | null>(null)
  const [mealLoading, setMealLoading] = useState(false)
  const [mealError, setMealError] = useState<string | null>(null)
  const schoolRequest = useRef<AbortController | null>(null)
  const mealRequest = useRef<AbortController | null>(null)

  const validateDates = (
    start: Dayjs | null,
    end: Dayjs | null,
  ): string | null => {
    if (!start || !end) {
      return '시작일과 종료일을 모두 선택해 주세요.'
    }
    if (end.isBefore(start, 'day')) {
      return '종료일은 시작일보다 빠를 수 없습니다.'
    }
    if (end.diff(start, 'day') + 1 > 31) {
      return '조회 기간은 시작일을 포함해 최대 31일입니다.'
    }
    return null
  }

  const handleSchoolSearch = async (query: string) => {
    schoolRequest.current?.abort()
    const controller = new AbortController()
    schoolRequest.current = controller
    setSchoolLoading(true)
    setSchoolError(null)
    setSchoolResult(null)
    setSelectedSchool(null)
    setMealResult(null)
    try {
      setSchoolResult(await searchSchools(query, controller.signal))
    } catch (error) {
      if (!controller.signal.aborted) setSchoolError(getErrorMessage(error))
    } finally {
      if (!controller.signal.aborted) setSchoolLoading(false)
    }
  }

  const handleDateChange = (start: Dayjs | null, end: Dayjs | null) => {
    setStartDate(start)
    setEndDate(end)
    setDateError(start && end ? validateDates(start, end) : null)
    setMealResult(null)
    setMealError(null)
  }

  const handleMealSearch = async () => {
    const validationError = validateDates(startDate, endDate)
    setDateError(validationError)
    if (!selectedSchool || !startDate || !endDate || validationError) return

    mealRequest.current?.abort()
    const controller = new AbortController()
    mealRequest.current = controller
    setMealLoading(true)
    setMealError(null)
    setMealResult(null)
    try {
      setMealResult(
        await searchMeals(
          selectedSchool,
          startDate.format('YYYY-MM-DD'),
          endDate.format('YYYY-MM-DD'),
          controller.signal,
        ),
      )
    } catch (error) {
      if (!controller.signal.aborted) setMealError(getErrorMessage(error))
    } finally {
      if (!controller.signal.aborted) setMealLoading(false)
    }
  }

  const canSearchMeals =
    Boolean(selectedSchool && startDate && endDate) &&
    !validateDates(startDate, endDate)

  return (
    <Box component="main" sx={{ minHeight: '100vh', py: { xs: 3, md: 7 } }}>
      <Container maxWidth="lg">
        <Box component="header" sx={{ mb: 4 }}>
          <Typography color="primary" sx={{ fontWeight: 800 }} variant="overline">
            오늘의 학교 식탁
          </Typography>
          <Typography component="h1" variant="h2">
            급식 배틀 - 학교 급식 조회 앱
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 680 }}>
            학교를 찾고 날짜를 선택하면 등록된 중식 메뉴를 한눈에 확인할 수
            있어요.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
          }}
        >
          <SchoolSearchCard
            error={schoolError}
            loading={schoolLoading}
            onQueryChange={() => {
              setSelectedSchool(null)
              setMealResult(null)
            }}
            onSearch={handleSchoolSearch}
            onSelect={(school) => {
              setSelectedSchool(school)
              setMealResult(null)
            }}
            result={schoolResult}
            selectedSchool={selectedSchool}
          />
          <DateRangeCard
            endDate={endDate}
            error={dateError}
            onChange={handleDateChange}
            onReset={() => handleDateChange(null, null)}
            startDate={startDate}
          />
          <MealResultsCard
            canSearch={canSearchMeals}
            error={mealError}
            loading={mealLoading}
            onSearch={handleMealSearch}
            result={mealResult}
            selectedSchool={selectedSchool}
          />
        </Box>
      </Container>
    </Box>
  )
}

export default App
