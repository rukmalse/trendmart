import { createClient } from '@supabase/supabase-js'
import EditAdClient from './EditAdClient'

// Static Export සඳහා සියලුම Ad IDs ලබා දීම (Server Side)
export async function generateStaticParams() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: ads, error } = await supabase.from('ads').select('id')

  if (error || !ads) {
    return []
  }

  return ads.map((ad) => ({
    id: String(ad.id),
  }))
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params
  return <EditAdClient id={resolvedParams.id} />
}