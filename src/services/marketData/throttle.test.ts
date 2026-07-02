import { SingleFlight, minInterval } from './throttle'

describe('SingleFlight', () => {
  it('collapses concurrent calls for the same key into one execution', async () => {
    const sf = new SingleFlight()
    let calls = 0
    const fn = () => { calls++; return new Promise<number>((r) => setTimeout(() => r(42), 10)) }
    const [a, b] = await Promise.all([sf.run('k', fn), sf.run('k', fn)])
    expect(a).toBe(42)
    expect(b).toBe(42)
    expect(calls).toBe(1)
  })

  it('allows a new execution after the previous settles', async () => {
    const sf = new SingleFlight()
    let calls = 0
    const fn = async () => { calls++; return calls }
    expect(await sf.run('k', fn)).toBe(1)
    expect(await sf.run('k', fn)).toBe(2)
  })
})

describe('minInterval', () => {
  it('allows first call, blocks a call within the window, allows after it', () => {
    expect(minInterval('sym', 1000, 0)).toBe(true)
    expect(minInterval('sym', 1000, 500)).toBe(false)
    expect(minInterval('sym', 1000, 1000)).toBe(true)
  })
})
