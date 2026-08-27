'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, PlusCircle, Heart, User } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  // ලොග් වන / යම් පිටු වල Bottom Nav එක නොපෙන්වීමට අවශ්‍ය නම් මෙහි සකස් කළ හැක
  const hiddenPaths = ['/admin', '/login', '/signup']
  if (hiddenPaths.some((p) => pathname?.startsWith(p))) {
    return null
  }

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Post Ad', href: '/post-ad', icon: PlusCircle, isSpecial: true },
    { name: 'Saved', href: '/saved-ads', icon: Heart },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          if (item.isSpecial) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5 bg-blue-600 text-white rounded-full w-14 h-14 shadow-md hover:bg-blue-700 transition"
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-medium mt-0.5">{item.name}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
                isActive ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className="text-[10px] mt-1">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}