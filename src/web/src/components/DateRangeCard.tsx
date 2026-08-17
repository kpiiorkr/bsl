import RestartAltRounded from '@mui/icons-material/RestartAltRounded'
import { Alert, Button, Stack } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import type { Dayjs } from 'dayjs'
import { SectionCard } from './SectionCard'

interface Props {
  endDate: Dayjs | null
  error: string | null
  onChange: (start: Dayjs | null, end: Dayjs | null) => void
  onReset: () => void
  startDate: Dayjs | null
}

export function DateRangeCard({
  endDate,
  error,
  onChange,
  onReset,
  startDate,
}: Props) {
  return (
    <SectionCard
      action={
        <Button
          disabled={!startDate && !endDate}
          onClick={onReset}
          startIcon={<RestartAltRounded />}
        >
          초기화
        </Button>
      }
      description="시작일을 포함해 최대 31일까지 조회할 수 있어요."
      step={2}
      title="날짜 선택"
    >
      <Stack spacing={2} sx={{ mt: 3 }}>
        <DatePicker
          label="시작일"
          onChange={(value) => onChange(value, endDate)}
          slotProps={{ textField: { fullWidth: true } }}
          value={startDate}
        />
        <DatePicker
          label="종료일"
          onChange={(value) => onChange(startDate, value)}
          slotProps={{ textField: { fullWidth: true } }}
          value={endDate}
        />
        {error && (
          <Alert aria-live="polite" severity="warning">
            {error}
          </Alert>
        )}
      </Stack>
    </SectionCard>
  )
}
