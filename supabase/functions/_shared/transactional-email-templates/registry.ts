import { template as customEvent } from './custom-event.tsx'

export interface TemplateEntry {
  // deno-lint-ignore no-explicit-any
  component: any
  // deno-lint-ignore no-explicit-any
  subject: string | ((data: any) => string)
  displayName?: string
  // deno-lint-ignore no-explicit-any
  previewData?: any
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'custom-event': customEvent,
}
