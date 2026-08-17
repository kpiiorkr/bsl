import type {
  MealSearchResponse,
  ProblemDetail,
  SchoolSearchResponse,
  SchoolSummary,
} from '../types'

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('json')) {
      const problem = (await response.json()) as ProblemDetail
      throw new Error(problem.detail)
    }
    throw new Error('서버 응답을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.')
  }
  return (await response.json()) as T
}

export function searchSchools(
  query: string,
  signal?: AbortSignal,
): Promise<SchoolSearchResponse> {
  const params = new URLSearchParams({ query: query.trim(), limit: '20' })
  return request(`/schools?${params.toString()}`, signal)
}

export function searchMeals(
  school: SchoolSummary,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<MealSearchResponse> {
  const params = new URLSearchParams({
    officeCode: school.officeCode,
    schoolCode: school.schoolCode,
    from,
    to,
  })
  return request(`/meals?${params.toString()}`, signal)
}
