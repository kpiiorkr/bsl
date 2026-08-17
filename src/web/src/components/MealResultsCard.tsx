import RestaurantRounded from '@mui/icons-material/RestaurantRounded'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import type { MealSearchResponse, SchoolSummary } from '../types'
import { SectionCard } from './SectionCard'

interface Props {
  canSearch: boolean
  error: string | null
  loading: boolean
  onSearch: () => void
  result: MealSearchResponse | null
  selectedSchool: SchoolSummary | null
}

export function MealResultsCard({
  canSearch,
  error,
  loading,
  onSearch,
  result,
  selectedSchool,
}: Props) {
  return (
    <SectionCard
      action={
        <Button
          disabled={!canSearch || loading}
          onClick={onSearch}
          startIcon={
            loading ? <CircularProgress color="inherit" size={18} /> : <RestaurantRounded />
          }
          variant="contained"
        >
          {loading ? '조회 중' : '급식 조회'}
        </Button>
      }
      description={
        selectedSchool
          ? `${selectedSchool.name}의 중식 메뉴를 확인하세요.`
          : '학교와 날짜를 선택하면 조회할 수 있어요.'
      }
      step={3}
      title="급식 확인"
      wide
    >
      <Box aria-busy={loading} aria-live="polite" sx={{ mt: 3 }}>
        {!canSearch && !result && !error && (
          <Alert severity="info">
            학교를 선택하고 시작일과 종료일을 모두 지정해 주세요.
          </Alert>
        )}
        {error && (
          <Alert
            action={<Button onClick={onSearch}>다시 시도</Button>}
            severity="error"
          >
            {error}
          </Alert>
        )}
        {result?.items.length === 0 && (
          <Alert severity="info">
            선택한 기간에 등록된 중식 정보가 없습니다.
          </Alert>
        )}
        {result && result.items.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))',
              },
            }}
          >
            {result.items.map((meal) => (
              <Box
                component="article"
                key={meal.date}
                sx={{ bgcolor: 'background.default', borderRadius: 3, p: 2.5 }}
              >
                <Stack
                  direction="row"
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Typography component="h3" sx={{ fontWeight: 800 }}>
                    {dayjs(meal.date).format('YYYY년 M월 D일')}
                  </Typography>
                  <Chip label={meal.mealType} size="small" />
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
                  {meal.dishes.map((dish) => (
                    <Typography component="li" key={dish}>
                      {dish}
                    </Typography>
                  ))}
                </Stack>
                {meal.calories && (
                  <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="caption">
                    {meal.calories}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </SectionCard>
  )
}
