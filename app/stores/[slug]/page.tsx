import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Store, Phone, MapPin, Tag, ArrowLeft } from 'lucide-react'

interface ShopPageProps {
  params: Promise<{ slug: string }>
}

export default async function ShopProfilePage({ params }: ShopPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // 1. ස්ටෝර් එකේ විස්තර ලබා ගැනීම
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .single()

  if (storeError || !store) {
    notFound()
  }

  // 2. අදාළ ස්ටෝර් එකට අයත් දැන්වීම් (Ads) ලබා ගැනීම
  // (Note: If you only want to show approved/active ads, you can add .eq('status', 'active'))
  const { data: ads, error: adsError } = await supabase
    .from('ads')
    .select('*')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 pb-16">
      {/* Top Banner / Header with Cover Photo */}
      <div 
        className="relative text-white py-12 px-4 shadow-md bg-cover bg-center"
        style={{
          backgroundImage: store.cover_url 
            ? `url(${store.cover_url})` 
            : 'linear-gradient(to right, #1d4ed8, #3730a3)' // cover එකක් නැත්නම් පෙන්වීමට default gradient එකක්
        }}
      >
        {/* අකුරු පැහැදිලිව පෙනීම සඳහා උඩින් අඳුරු ස්තරයක් (Dark Overlay) යෙදීම */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>

        <div className="relative max-w-6xl mx-auto z-10">
          <Link href="/" className="inline-flex items-center text-gray-200 hover:text-white text-xs sm:text-sm font-bold mb-6 transition">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Home
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Store Logo */}
            <div className="w-24 h-24 rounded-2xl bg-white shadow-lg overflow-hidden flex items-center justify-center border-4 border-white/20 shrink-0">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.store_name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-10 h-10 text-blue-600" />
              )}
            </div>

            {/* Store Meta Info */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{store.store_name}</h1>
              {store.description && (
                <p className="text-gray-200 text-xs sm:text-sm mt-2 max-w-2xl">{store.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs sm:text-sm text-gray-200 font-medium">
                {store.phone && (
                  <a href={`tel:${store.phone}`} className="flex items-center bg-black/40 px-3 py-1.5 rounded-xl border border-white/20 hover:bg-black/60 transition">
                    <Phone className="w-3.5 h-3.5 mr-1.5 text-orange-400" /> {store.phone}
                  </a>
                )}
                {store.address && (
                  <div className="flex items-center bg-black/40 px-3 py-1.5 rounded-xl border border-white/20">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-orange-400" /> {store.address}, {store.district}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Products / Ads Section */}
      <div className="max-w-6xl mx-auto px-4 mt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-900">Store Listings & Products</h2>
          <span className="text-xs font-bold bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
            {ads?.length || 0} Items Available
          </span>
        </div>

        {adsError || !ads || ads.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-gray-200 shadow-sm">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-800 font-bold text-base">No items found</h3>
            <p className="text-gray-400 text-xs mt-1">This store has not published any listings yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {ads.map((ad) => (
              <Link 
                key={ad.id} 
                href={`/ads/${ad.id}`} 
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition group"
              >
                <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {ad.images && ad.images.length > 0 ? (
                    <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <span className="text-gray-400 text-xs font-medium">No Image</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 line-clamp-1 text-sm">{ad.title}</h3>
                  <p className="text-orange-600 font-black text-base my-1">
                    LKR {Number(ad.price || 0).toLocaleString()}
                  </p>
                  <div className="text-[11px] text-gray-500 mt-2 flex items-center">
                    <MapPin className="w-3 h-3 mr-1 text-gray-400" /> {ad.city || store.district}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}