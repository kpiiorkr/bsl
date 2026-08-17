import type { PropsWithChildren, ReactNode } from 'react'
import { Card, CardContent, Chip, Stack, Typography } from '@mui/material'

interface SectionCardProps extends PropsWithChildren {
  step: number
  title: string
  description: string
  action?: ReactNode
  wide?: boolean
}

export function SectionCard({
  action,
  children,
  description,
  step,
  title,
  wide,
}: SectionCardProps) {
  return (
    <Card
      component="section"
      sx={{ gridColumn: wide ? { md: '1 / -1' } : undefined }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5 }, '&:last-child': { pb: 3.5 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={1.5}>
            <Chip color="primary" label={`${step}단계`} size="small" />
            <div>
              <Typography component="h2" variant="h5">
                {title}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {description}
              </Typography>
            </div>
          </Stack>
          {action}
        </Stack>
        {children}
      </CardContent>
    </Card>
  )
}
