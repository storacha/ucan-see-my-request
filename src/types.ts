export type Request = chrome.devtools.network.Request | chrome.devtools.network.HAREntry

export const isChromeRequest = (request: Request) : request is chrome.devtools.network.Request => (typeof (request as chrome.devtools.network.Request).getContent === 'function')

import type { Fact } from '@ucanto/interface'

declare module '@ucanto/interface' {
  interface Delegation<C> {
    facts: Fact[]
  }
}