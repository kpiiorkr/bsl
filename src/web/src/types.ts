export interface SchoolSummary {
  officeCode: string
  schoolCode: string
  name: string
  schoolType: string | null
  region: string | null
  address: string | null
}

export interface SchoolSearchResponse {
  items: SchoolSummary[]
  hasMore: boolean
}

export interface MealItem {
  date: string
  mealType: '중식'
  dishes: string[]
  calories: string | null
}

export interface MealSearchResponse {
  school: Pick<SchoolSummary, 'officeCode' | 'schoolCode' | 'name'>
  from: string
  to: string
  items: MealItem[]
}

export interface ProblemDetail {
  type: string
  title: string
  status: number
  detail: string
  code: string
  instance: string | null
}
