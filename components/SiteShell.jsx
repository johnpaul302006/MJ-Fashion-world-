'use client'

import { AuthProvider, useAuth } from './auth/AuthProvider'
import LoginScreen from './auth/LoginScreen'
import Navbar from './Navbar'
import Footer from './Footer'
import ChatWidget from './ChatWidget'
import OffersBar from './OffersBar'
import AnnouncementBar from './AnnouncementBar'
import { HostAddButton } from './HostProductActions'

function Shell({ children, storeName, address, phone }) {
  const { loading, user, hosting } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-[#0f0f0f]">
        {/* Animated logo loader */}
        <div className="w-12 h-12 bg-brand flex items-center justify-center animate-pulse">
          <span className="text-white font-black text-xl leading-none">MJ</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-600 font-medium tracking-widest uppercase">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"/>
          </svg>
          Loading store...
        </div>
      </div>
    )
  }

  if (!user) return <LoginScreen storeName={storeName} />

  return (
    <>
      <Navbar storeName={storeName} user={user} />
      <OffersBar />
      <AnnouncementBar />
      <main className="flex-1">{children}</main>
      <Footer storeName={storeName} address={address} phone={phone} />
      {hosting ? (
        <div className="fixed bottom-20 right-4 z-40">
          <HostAddButton />
        </div>
      ) : null}
      <ChatWidget storeName={storeName} />
    </>
  )
}

export default function SiteShell({ children, storeName, address, phone }) {
  return (
    <AuthProvider>
      <Shell storeName={storeName} address={address} phone={phone}>
        {children}
      </Shell>
    </AuthProvider>
  )
}