import { useState } from 'react'
import SearchRounded from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { SchoolSearchResponse, SchoolSummary } from '../types'
import { SectionCard } from './SectionCard'

interface Props {
  error: string | null
  loading: boolean
  onQueryChange: () => void
  onSearch: (query: string) => void
  onSelect: (school: SchoolSummary) => void
  result: SchoolSearchResponse | null
  selectedSchool: SchoolSummary | null
}

export function SchoolSearchCard({
  error,
  loading,
  onQueryChange,
  onSearch,
  onSelect,
  result,
  selectedSchool,
}: Props) {
  const [query, setQuery] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const submit = () => {
    const normalized = query.trim()
    if (normalized.length < 2) {
      setValidationError('학교 이름을 두 글자 이상 입력해 주세요.')
      return
    }
    setValidationError(null)
    onSearch(normalized)
  }

  return (
    <SectionCard
      description="학교 이름의 일부를 두 글자 이상 입력하세요."
      step={1}
      title="학교 찾기"
    >
      <Stack
        component="form"
        direction={{ xs: 'column', sm: 'row' }}
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        spacing={1.5}
        sx={{ mt: 3 }}
      >
        <TextField
          error={Boolean(validationError)}
          fullWidth
          helperText={validationError}
          label="학교 이름"
          onChange={(event) => {
            setQuery(event.target.value)
            if (selectedSchool) {
              onQueryChange()
              setValidationError('검색어가 변경되었습니다. 학교를 다시 선택해 주세요.')
            }
          }}
          placeholder="예: 서울고"
          value={query}
        />
        <Button
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} /> : <SearchRounded />}
          sx={{ minHeight: 56, minWidth: 110 }}
          type="submit"
          variant="contained"
        >
          {loading ? '검색 중' : '검색'}
        </Button>
      </Stack>

      <Box aria-live="polite" sx={{ mt: 2 }}>
        {error && (
          <Alert
            action={<Button onClick={submit}>다시 시도</Button>}
            severity="error"
          >
            {error}
          </Alert>
        )}
        {result?.items.length === 0 && (
          <Alert severity="info">
            일치하는 학교가 없습니다. 다른 검색어를 사용해 주세요.
          </Alert>
        )}
        {result && result.items.length > 0 && (
          <>
            <Typography sx={{ fontWeight: 700 }} variant="subtitle2">
              검색 결과 {result.items.length}개
            </Typography>
            <List aria-label="학교 검색 결과" sx={{ maxHeight: 300, overflow: 'auto' }}>
              {result.items.map((school) => (
                <ListItemButton
                  key={`${school.officeCode}-${school.schoolCode}`}
                  onClick={() => onSelect(school)}
                  selected={selectedSchool?.schoolCode === school.schoolCode}
                >
                  <ListItemText
                    primary={school.name}
                    secondary={[school.schoolType, school.region, school.address]
                      .filter(Boolean)
                      .join(' · ')}
                  />
                </ListItemButton>
              ))}
            </List>
            {result.hasMore && (
              <Alert severity="info">
                결과가 더 있습니다. 학교 이름을 구체적으로 입력해 주세요.
              </Alert>
            )}
          </>
        )}
      </Box>
    </SectionCard>
  )
}
