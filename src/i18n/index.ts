import { en } from '#/i18n/en'

export const LOCALE = 'en'

const messages: Record<string, string> = en

function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const template = messages[key] ?? key
  return interpolate(template, vars)
}

export function plural(unit: 'year' | 'month' | 'day', n: number): string {
  const form = n === 1 ? 'one' : 'other'
  return t(`unit.${unit}.${form}`, { n })
}

export function useDirection(): 'rtl' | 'ltr' {
  return 'ltr'
}
