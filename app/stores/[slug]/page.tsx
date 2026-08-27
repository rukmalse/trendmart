import { createClient } from '@supabase/supabase-js'
import StoreDetailClient from './StoreDetailClient'

// Static Export සඳහා සියලුම Store Slugs ලබා දීම (Server Side)
export async function generateStaticParams() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  // ඔබේ ස්ටෝර් ටේබල් එකේ ස්ලග් වෙනුවට id තිබේ නම් .select('id') ලෙස වෙනස් කරන්න
  const { data: stores, error } = await supabase.from('stores').select('slug')

  if (error || !stores) {
    return []
  }

  return stores.map((store) => ({
    slug: String(store.slug),
  }))
}

type Props = {
  params: Promise<{ slug: string }>
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params
  return <StoreDetailClient slug={resolvedParams.slug} />
}