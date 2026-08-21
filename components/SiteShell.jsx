'use client'

import { AuthProvider, useAuth } from './auth/AuthProvider'
import Navbar from './Navbar'
import Footer from './Footer'
import ChatWidget from './ChatWidget'
import OffersBar from './OffersBar'
import AnnouncementBar from './AnnouncementBar'
import { HostAddButton } from './HostProductActions'

// The storefront is public — browsing never requires an account.
// Authentication is only requested for account actions (checkout,
// order history, saved addresses).
function Shell({ children, storeName, address, phone }) {
  const { hosting } = useAuth()

  return (
    <>
      <Navbar storeName={storeName} />
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
