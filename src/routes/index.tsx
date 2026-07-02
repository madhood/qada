import { createFileRoute } from '@tanstack/react-router'

import { HomeScreen } from '#/features/counters/HomeScreen'

export const Route = createFileRoute('/')({ component: HomeScreen })
