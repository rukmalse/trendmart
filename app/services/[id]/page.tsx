import { createClient } from '@supabase/supabase-js'
import ServiceDetailClient from './ServiceDetailClient'

// Static Export සඳහා Service IDs ලබා දීම (ටේබල් එක හිස් නම් ඩීෆල්ට් ID එකක් ලබා දේ)
export async function generateStaticParams() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: services, error } = await supabase.from('services').select('id')

  if (error || !services || services.length === 0) {
    // බිල් වන අවස්ථාවේ ඩේටා නොමැති නම් ඩීෆල්ට් අගයක් ලබා දෙයි (Build Error එක මඟහරවා ගැනීමට)
    return [{ id: '1' }]
  }

  return services.map((service) => ({
    id: String(service.id),
  }))
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params
  return <ServiceDetailClient id={resolvedParams.id} />
}