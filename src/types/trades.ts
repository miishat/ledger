import type { Currency } from '../services/marketData/types'

/** One executed trade. Quantity and price are always positive; `side` carries
 *  the direction. Fees are the commission on that trade in the same currency,
 *  and are added to cost on a buy and subtracted from proceeds on a sell. */
export interface Trade {
  id: string
  /** YYYY-MM-DD */
  date: string
  ticker: string
  exchange?: string
  account: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  fees: number
  currency: Currency | null
}
