import { foldSmallest } from './foldSmallest'

describe('foldSmallest', () => {
  it('keeps the largest entries and folds the rest into one', () => {
    const out = foldSmallest([['a', 1], ['b', 50], ['c', 5], ['d', 30], ['e', 2]], 2, 'Other')
    expect(out).toEqual([['b', 50], ['d', 30], ['Other', 8]])
  })

  it('folds nothing when that would save at most one entry', () => {
    expect(foldSmallest([['a', 3], ['b', 2], ['c', 1]], 2, 'Other')).toEqual([['a', 3], ['b', 2], ['c', 1]])
  })

  it('merges into a kept entry that already has the fold label', () => {
    const out = foldSmallest([['Other', 40], ['b', 50], ['c', 5], ['d', 2]], 2, 'Other')
    expect(out).toEqual([['b', 50], ['Other', 47]])
  })

  it('does not mutate its input', () => {
    const input: [string, number][] = [['a', 1], ['b', 2], ['c', 3], ['d', 4]]
    foldSmallest(input, 1, 'Other')
    expect(input).toEqual([['a', 1], ['b', 2], ['c', 3], ['d', 4]])
  })
})
