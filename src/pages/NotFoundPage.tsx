import { Link } from 'react-router'
import { ja } from '@/shared/i18n/ja'

export function NotFoundPage() {
  return (
    <section className="py-12 text-center">
      <p className="mb-4">{ja.notFound.message}</p>
      <Link to="/" className="text-primary underline">
        {ja.notFound.backHome}
      </Link>
    </section>
  )
}
