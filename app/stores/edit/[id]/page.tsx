import { createClient } from '@supabase/supabase-js'
import StoreEditClient from './StoreEditClient'

// Static Export සඳහා සියලුම Store IDs ලබා දීම (Server Side)
export async function generateStaticParams() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: stores, error } = await supabase.from('stores').select('id')

  if (error || !stores) {
    return []
  }

  return stores.map((store) => ({
    id: String(store.id),
  }))
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params
  return <StoreEditClient id={resolvedParams.id} />
}