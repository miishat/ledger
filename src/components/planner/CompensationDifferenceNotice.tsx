import { useInRouterContext, useLocation } from 'react-router-dom'
function RouteNotice() {
  const { state } = useLocation()
  const notice = state?.compensationDifferenceNotice
  return typeof notice === 'string' ? <p role="status" className="retirement-notice">{notice}</p> : null
}
export function CompensationDifferenceNotice() {
  const inRouter = useInRouterContext()
  return inRouter ? <RouteNotice /> : null
}
