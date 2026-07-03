import { createFileRoute } from '@tanstack/react-router'

import { DebtScreen } from '#/features/debt/DebtScreen'

export const Route = createFileRoute('/debt')({ component: DebtScreen })
