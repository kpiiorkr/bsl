import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

export const server = setupServer(
  http.get('/api/v1/schools', () =>
    HttpResponse.json({
      items: [
        {
          officeCode: 'B10',
          schoolCode: '7010569',
          name: '서울고등학교',
          schoolType: '고등학교',
          region: '서울특별시',
          address: '서울특별시 서초구',
        },
      ],
      hasMore: false,
    }),
  ),
  http.get('/api/v1/meals', () =>
    HttpResponse.json({
      school: {
        officeCode: 'B10',
        schoolCode: '7010569',
        name: '서울고등학교',
      },
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
  ),
)
