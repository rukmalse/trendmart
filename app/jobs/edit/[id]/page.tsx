import { createClient } from '@supabase/supabase-js'
import JobEditClient from './JobEditClient'

// Static Export සඳහා සියලුම Job IDs ලබා දීම (Server Side)
export async function generateStaticParams() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: jobs, error } = await supabase.from('jobs').select('id')

  if (error || !jobs) {
    return []
  }

  return jobs.map((job) => ({
    id: String(job.id),
  }))
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params
  return <JobEditClient id={resolvedParams.id} />
}