import { useQuery } from '@tanstack/react-query'
import { healthApi } from '../api/endpoints'

export default function HomePage() {
  const health = useQuery({ queryKey: ['health'], queryFn: healthApi.ping, retry: false })
  return (
    <main>
      <h1>Alpha News</h1>
      <p>
        API: {health.isPending ? 'проверяем…' : health.isError ? 'недоступен' : health.data.status}
      </p>
    </main>
  )
}
