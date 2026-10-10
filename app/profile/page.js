'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { inr, shortDate, getReturnEligibility } from '@/lib/format'
import { getStatusMeta } from '@/lib/categories'
import ReturnExchangeModal from '@/components/ReturnExchangeModal'
import { useAuth } from '@/components/auth/AuthProvider'

export default function ProfilePage() {
  const router = useRouter()
  const { logout } = useAuth() || {}
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'orders' | 'security' | 'addresses'

  // Orders & Phone Search State in Profile
  const [orderPhoneInput, setOrderPhoneInput] = useState('')
  const [orderSearchLoading, setOrderSearchLoading] = useState(false)
  const [orderSearchError, setOrderSearchError] = useState('')
  const [searchedOrderPhone, setSearchedOrderPhone] = useState('')
  const [phoneOrders, setPhoneOrders] = useState([])
  const [phoneOrdersStats, setPhoneOrdersStats] = useState(null)
  const [returnModalTarget, setReturnModalTarget] = useState(null)

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  // Addresses State
  const [addresses, setAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  })
  const [addrError, setAddrError] = useState('')
  const [savingAddr, setSavingAddr] = useState(false)

  // Load User Data
  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        const res = await fetch('/api/me')
        const data = await res.json()
        if (!mounted) return
        if (data.user) {
          setUser(data.user)
          setEditName(data.user.name || '')
          setEditPhone(data.user.phone || '')
          if (data.user.phone) setOrderPhoneInput(data.user.phone)
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => {
      mounted = false
    }
  }, [])

  // Search orders by mobile number with strict security validation
  const handleSearchOrdersByPhone = useCallback(async (e, customPhone) => {
    if (e && e.preventDefault) e.preventDefault()
    setOrderSearchError('')
    const target = (customPhone !== undefined ? customPhone : orderPhoneInput).trim()
    const digits = target.replace(/[^0-9]/g, '')

    if (digits.length !== 10) {
      setOrderSearchError('Please enter a valid 10-digit mobile number')
      return
    }

    // Security Verification: Ensure the queried phone matches the authenticated account
    if (user?.role !== 'host' && user?.phone) {
      const userDigits = user.phone.replace(/[^0-9]/g, '').slice(-10)
      if (userDigits !== digits) {
        setOrderSearchError(
          `Security Notice: You are signed in as ${user.email}. For privacy protection, you can only look up orders registered under your verified phone number (+91 ${user.phone}).`
        )
        return
      }
    }

    setOrderSearchLoading(true)
    try {
      const res = await fetch(`/api/orders?phone=${digits}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search orders for this number')
      }
      const list = data.orders || []
      const productCount = list.reduce(
        (acc, ord) => acc + (ord.items?.reduce((cnt, item) => cnt + (item.qty || 1), 0) || 0),
        0
      )
      setPhoneOrders(list)
      setSearchedOrderPhone(digits)
      setPhoneOrdersStats({ products: productCount, orders: list.length })
    } catch (err) {
      setOrderSearchError(err.message)
      setPhoneOrders([])
    } finally {
      setOrderSearchLoading(false)
    }
  }, [orderPhoneInput, user])

  // Auto-fetch when user switches to 'orders' tab
  useEffect(() => {
    if (activeTab === 'orders' && user?.phone && !searchedOrderPhone) {
      const timer = setTimeout(() => {
        handleSearchOrdersByPhone(null, user.phone)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [activeTab, user, searchedOrderPhone, handleSearchOrdersByPhone])

  // Load Addresses when switching to addresses tab
  const fetchAddresses = async () => {
    setLoadingAddresses(true)
    try {
      const res = await fetch('/api/addresses')
      const data = await res.json()
      if (Array.isArray(data.addresses)) {
        setAddresses(data.addresses)
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err)
    } finally {
      setLoadingAddresses(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'addresses' && user) {
      let active = true
      const timer = setTimeout(async () => {
        setLoadingAddresses(true)
        try {
          const res = await fetch('/api/addresses')
          const data = await res.json()
          if (active && Array.isArray(data.addresses)) {
            setAddresses(data.addresses)
          }
        } catch (err) {
          console.error(err)
        } finally {
          if (active) setLoadingAddresses(false)
        }
      }, 0)
      return () => {
        active = false
        clearTimeout(timer)
      }
    }
  }, [activeTab, user])

  // Handle Edit Profile Submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setEditError('')
    setEditSuccess('')

    if (editName.trim().length < 2) {
      setEditError('Please enter a valid name (at least 2 characters)')
      return
    }

    setSavingProfile(true)
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, phone: editPhone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setEditError(data.error || 'Failed to update profile')
      } else {
        setUser(data.user)
        setEditSuccess('Profile details updated successfully')
        setIsEditing(false)
      }
    } catch {
      setEditError('Connection error. Please try again.')
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match')
      return
    }

    setSavingPw(true)
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'password',
          currentPassword,
          newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPwError(data.error || 'Failed to update password')
      } else {
        setPwSuccess('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setPwError('Connection error. Please try again.')
    } finally {
      setSavingPw(false)
    }
  }

  // Handle Add Address
  const handleSaveAddress = async (e) => {
    e.preventDefault()
    setAddrError('')
    setSavingAddr(true)

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setAddrError(data.error || 'Failed to save address')
      } else {
        setShowAddressModal(false)
        setAddressForm({
          label: 'Home',
          fullName: user?.name || '',
          phone: user?.phone || '',
          line1: '',
          line2: '',
          city: '',
          state: '',
          pincode: '',
          isDefault: false,
        })
        await fetchAddresses()
      }
    } catch {
      setAddrError('Unable to save address. Please try again.')
    } finally {
      setSavingAddr(false)
    }
  }

  // Handle Set Default Address
  const handleSetDefault = async (addrId) => {
    try {
      await fetch('/api/addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: addrId, isDefault: true }),
      })
      await fetchAddresses()
    } catch (err) {
      console.error(err)
    }
  }

  // Handle Delete Address
  const handleDeleteAddress = async (addrId) => {
    if (!confirm('Are you sure you want to remove this address?')) return
    try {
      await fetch(`/api/addresses?id=${encodeURIComponent(addrId)}`, {
        method: 'DELETE',
      })
      await fetchAddresses()
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout()
      } else {
        await fetch('/api/login', { method: 'DELETE' })
      }
      router.push('/')
      router.refresh()
    } catch {
      window.location.reload()
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#cc0000] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] px-4 py-16 max-w-lg mx-auto text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-3xl mb-4">
          👤
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-sm text-neutral-400 mb-6">
          Please log in to your account to view and manage your profile details, orders, and saved addresses.
        </p>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-sm font-semibold transition"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold transition"
          >
            Register
          </Link>
        </div>
      </div>
    )
  }

  const initials = (user.name || user.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-[85vh] px-4 py-8 sm:py-12 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6 font-mono">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <span>/</span>
        <span className="text-white">My Profile</span>
      </nav>

      {/* Profile Header Card */}
      <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#cc0000] to-red-950 flex items-center justify-center text-white text-xl sm:text-2xl font-black shadow-lg shadow-[#cc0000]/20 shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{user.name}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {user.role === 'host' ? 'Host Admin' : 'Customer'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">{user.email}</p>
              {user.phone && (
                <p className="text-xs text-neutral-400 mt-0.5 font-mono">📱 +91 {user.phone}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setIsEditing(!isEditing)
                setEditError('')
                setEditSuccess('')
              }}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition cursor-pointer"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Inline Edit Form */}
        {isEditing && (
          <form onSubmit={handleProfileSubmit} className="mt-6 pt-6 border-t border-neutral-800 max-w-lg">
            <h3 className="text-sm font-bold text-white mb-4">Edit Personal Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 font-medium mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-sm focus:border-[#cc0000] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 font-medium mb-1.5">Mobile Number (10 digits)</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-sm focus:border-[#cc0000] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 font-medium mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full h-11 px-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-500 text-sm cursor-not-allowed"
                />
                <p className="text-[11px] text-neutral-500 mt-1">Email address cannot be changed.</p>
              </div>

              {editError && <p className="text-xs text-rose-400">⚠ {editError}</p>}
              {editSuccess && <p className="text-xs text-emerald-400">✓ {editSuccess}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-semibold transition disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-800 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-4 text-sm font-semibold transition cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'profile'
              ? 'border-[#cc0000] text-white'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Overview & Quick Links
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 text-sm font-semibold transition cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'orders'
              ? 'border-[#cc0000] text-white'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          📦 Track Order / Orders
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-4 text-sm font-semibold transition cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'security'
              ? 'border-[#cc0000] text-white'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Security & Password
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 px-4 text-sm font-semibold transition cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'addresses'
              ? 'border-[#cc0000] text-white'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Saved Addresses
        </button>
      </div>

      {/* TAB 1: OVERVIEW & QUICK LINKS */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/orders"
              className="bg-[#161616] border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 transition group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">📦</span>
                <span className="text-xs text-neutral-500 group-hover:text-white transition">→</span>
              </div>
              <h4 className="text-base font-bold text-white mb-1">My Orders</h4>
              <p className="text-xs text-neutral-400">View recent orders, shipment status, and history.</p>
            </Link>

            <Link
              href="/wishlist"
              className="bg-[#161616] border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 transition group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">♡</span>
                <span className="text-xs text-neutral-500 group-hover:text-white transition">→</span>
              </div>
              <h4 className="text-base font-bold text-white mb-1">Wishlist</h4>
              <p className="text-xs text-neutral-400">Your favorite styles and saved fashion picks.</p>
            </Link>

            <Link
              href="/track-order"
              className="bg-[#161616] border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 transition group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">🚚</span>
                <span className="text-xs text-neutral-500 group-hover:text-white transition">→</span>
              </div>
              <h4 className="text-base font-bold text-white mb-1">Track Order</h4>
              <p className="text-xs text-neutral-400">Look up any order with your phone or Order ID.</p>
            </Link>
          </div>

          {/* Account Details Summary */}
          <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Account Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/60">
                <span className="text-xs text-neutral-500 block mb-1">Registered Name</span>
                <span className="font-semibold text-white">{user.name}</span>
              </div>
              <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/60">
                <span className="text-xs text-neutral-500 block mb-1">Email ID</span>
                <span className="font-semibold text-white">{user.email}</span>
              </div>
              <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/60">
                <span className="text-xs text-neutral-500 block mb-1">Phone Number</span>
                <span className="font-semibold text-white font-mono">{user.phone ? `+91 ${user.phone}` : 'Not set'}</span>
              </div>
              <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/60">
                <span className="text-xs text-neutral-500 block mb-1">Account Role</span>
                <span className="font-semibold text-white capitalize">{user.role}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: TRACK ORDER / ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Search Box Card */}
          <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="max-w-xl">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#cc0000] font-bold">
                Order Tracking &amp; History
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Track Orders by Mobile Number
              </h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Enter your verified mobile number to view all associated orders, live progress, and request returns or exchanges.
              </p>
            </div>

            <form onSubmit={handleSearchOrdersByPhone} className="mt-5 max-w-xl">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex items-center flex-1 rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 focus-within:border-[#cc0000] transition">
                  <span className="text-xs font-mono font-bold text-neutral-400 mr-2 shrink-0">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    value={orderPhoneInput}
                    onChange={(e) => {
                      setOrderPhoneInput(e.target.value)
                      if (orderSearchError) setOrderSearchError('')
                    }}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full h-11 bg-transparent text-sm text-white outline-none font-mono placeholder-neutral-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={orderSearchLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
                >
                  {orderSearchLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <span>Search Orders</span>
                  )}
                </button>
              </div>

              {orderSearchError && (
                <p className="mt-2.5 text-xs text-rose-400 flex items-center gap-1.5">
                  <span>⚠</span> {orderSearchError}
                </p>
              )}
            </form>
          </div>

          {/* Searched Stats Banner */}
          {searchedOrderPhone && phoneOrdersStats && (
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">📦</span>
                <span className="text-neutral-300">
                  Found <b className="text-white">{phoneOrdersStats.products} product{phoneOrdersStats.products !== 1 ? 's' : ''}</b> in{' '}
                  <b className="text-white">{phoneOrdersStats.orders} order{phoneOrdersStats.orders !== 1 ? 's' : ''}</b> registered under{' '}
                  <span className="font-mono font-bold text-[#cc0000]">+91 {searchedOrderPhone}</span>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSearchOrdersByPhone(null, searchedOrderPhone)}
                className="text-xs text-[#cc0000] hover:underline font-semibold cursor-pointer"
              >
                Refresh Status ↻
              </button>
            </div>
          )}

          {/* Results List */}
          {orderSearchLoading ? (
            <div className="p-12 text-center text-neutral-400">
              <div className="w-6 h-6 border-2 border-neutral-700 border-t-[#cc0000] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs">Searching orders…</p>
            </div>
          ) : searchedOrderPhone && phoneOrders.length === 0 ? (
            <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-10 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-900 flex items-center justify-center text-xl text-neutral-400">
                🔍
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                No orders registered under +91 {searchedOrderPhone}
              </h4>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-5">
                Make sure you typed the exact 10-digit mobile number used when placing your order.
              </p>
              <Link
                href="/shop"
                className="inline-block px-5 py-2.5 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-bold uppercase tracking-wider transition"
              >
                Browse Shop
              </Link>
            </div>
          ) : phoneOrders.length > 0 ? (
            <div className="space-y-4">
              {phoneOrders.map((ord) => {
                const sm = getStatusMeta(ord.status)
                const isDelivered = ord.status === 'delivered'
                const deliveryTime = ord.deliveredAt || ord.statusTimestamps?.delivered
                const { isWithinWindow, returnDaysRemaining } = isDelivered
                  ? getReturnEligibility(deliveryTime)
                  : { isWithinWindow: true, returnDaysRemaining: 7 }

                return (
                  <div
                    key={ord._id || ord.orderId}
                    className="bg-[#161616] border border-neutral-800 rounded-2xl p-5 sm:p-6 transition hover:border-neutral-700 shadow-md space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-neutral-400">Order</span>
                          <span className="font-mono text-sm font-bold text-white">#{ord.orderId}</span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">Placed on {shortDate(ord.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${sm.color}`}>
                          {sm.label}
                        </span>
                        <span className="text-xs font-bold text-white font-mono">{inr(ord.amount)}</span>
                      </div>
                    </div>

                    {/* Products Preview */}
                    <div className="space-y-3">
                      {ord.items?.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] text-neutral-500">IMG</div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">{item.name}</p>
                              <p className="text-neutral-400 text-[11px]">
                                Size: {item.size || 'Standard'} · Qty: {item.qty}
                              </p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-white shrink-0">
                            {inr(item.price * item.qty)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Location or Tracking Callout */}
                    {ord.tracking?.currentLocation && (
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-2">
                        <span>📍</span>
                        <span className="text-neutral-400 font-mono text-[11px]">Location:</span>
                        <span className="font-medium text-white">{ord.tracking.currentLocation}</span>
                      </div>
                    )}

                    {/* Actions row */}
                    <div className="pt-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/order/${ord.orderId}`}
                        className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition"
                      >
                        Live Tracking Timeline →
                      </Link>

                      {isDelivered ? (
                        isWithinWindow ? (
                          <button
                            type="button"
                            onClick={() => setReturnModalTarget({ order: ord, product: ord.items?.[0] })}
                            className="px-4 py-2 rounded-xl border border-[#cc0000] text-[#cc0000] hover:bg-[#cc0000] hover:text-white text-xs font-bold transition cursor-pointer"
                          >
                            Return / Exchange ({returnDaysRemaining}d left)
                          </button>
                        ) : (
                          <span className="text-xs text-neutral-500">Return window expired</span>
                        )
                      ) : (
                        <span className="text-xs text-neutral-500">Return active after delivery</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: SECURITY & PASSWORD */}
      {activeTab === 'security' && (
        <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-6 sm:p-8 max-w-xl">
          <h3 className="text-lg font-bold text-white mb-1">Change Password</h3>
          <p className="text-xs text-neutral-400 mb-6">
            Update your account password. Choose a strong password containing at least 8 characters, a letter, and a number.
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-neutral-400 font-medium mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-sm focus:border-[#cc0000] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 font-medium mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-sm focus:border-[#cc0000] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 font-medium mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-sm focus:border-[#cc0000] focus:outline-none"
                required
              />
            </div>

            {pwError && <p className="text-xs text-rose-400">⚠ {pwError}</p>}
            {pwSuccess && <p className="text-xs text-emerald-400">✓ {pwSuccess}</p>}

            <button
              type="submit"
              disabled={savingPw}
              className="mt-2 px-6 py-2.5 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
            >
              {savingPw ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: SAVED ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Saved Delivery Addresses</h3>
              <p className="text-xs text-neutral-400">Manage addresses for faster checkout.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAddressForm({
                  label: 'Home',
                  fullName: user?.name || '',
                  phone: user?.phone || '',
                  line1: '',
                  line2: '',
                  city: '',
                  state: '',
                  pincode: '',
                  isDefault: addresses.length === 0,
                })
                setAddrError('')
                setShowAddressModal(true)
              }}
              className="px-4 py-2 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            >
              <span>+</span> Add Address
            </button>
          </div>

          {loadingAddresses ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-[#cc0000] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-8 text-center">
              <span className="text-3xl block mb-2">📍</span>
              <h4 className="text-base font-bold text-white mb-1">No saved addresses yet</h4>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto mb-4">
                Add your home or work address for easy and quick checkout.
              </p>
              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition"
              >
                + Add First Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr._id || addr.id}
                  className={`bg-[#161616] border rounded-2xl p-5 relative transition ${
                    addr.isDefault ? 'border-[#cc0000]/60 ring-1 ring-[#cc0000]/20' : 'border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-neutral-800 text-neutral-300 uppercase tracking-wide">
                      {addr.label || 'Address'}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[11px] font-semibold text-[#cc0000] flex items-center gap-1">
                        ✓ Default
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1">{addr.fullName}</h4>
                  <p className="text-xs text-neutral-400 mb-1 leading-relaxed">
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ''}
                    <br />
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="text-xs text-neutral-400 font-mono mb-4">
                    Phone: +91 {addr.phone}
                  </p>

                  <div className="flex items-center gap-2 pt-3 border-t border-neutral-800/80">
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr._id || addr.id)}
                        className="text-xs text-neutral-300 hover:text-white underline cursor-pointer"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr._id || addr.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 ml-auto cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Address Modal */}
          {showAddressModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-[#181818] border border-neutral-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white">Add Delivery Address</h3>
                  <button
                    onClick={() => setShowAddressModal(false)}
                    className="text-neutral-400 hover:text-white text-lg"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveAddress} className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 font-medium mb-1">Address Label</label>
                    <select
                      value={addressForm.label}
                      onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 font-medium mb-1">Full Name</label>
                    <input
                      type="text"
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 font-medium mb-1">Mobile Phone (10 digits)</label>
                    <input
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 font-medium mb-1">House / Flat / Street (Line 1)</label>
                    <input
                      type="text"
                      value={addressForm.line1}
                      onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 font-medium mb-1">Area / Landmark (Line 2)</label>
                    <input
                      type="text"
                      value={addressForm.line2}
                      onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-neutral-400 font-medium mb-1">City</label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 font-medium mb-1">State</label>
                      <input
                        type="text"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 font-medium mb-1">PIN Code (6 digits)</label>
                    <input
                      type="text"
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isDefaultCheckbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="rounded accent-[#cc0000]"
                    />
                    <label htmlFor="isDefaultCheckbox" className="text-xs text-neutral-300">
                      Make this my default delivery address
                    </label>
                  </div>

                  {addrError && <p className="text-xs text-rose-400">⚠ {addrError}</p>}

                  <div className="flex gap-2 pt-3">
                    <button
                      type="submit"
                      disabled={savingAddr}
                      className="flex-1 h-10 rounded-xl bg-[#cc0000] hover:bg-[#b30000] text-white text-xs font-semibold transition disabled:opacity-50"
                    >
                      {savingAddr ? 'Saving...' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(false)}
                      className="h-10 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Return / Exchange Modal */}
      {returnModalTarget && (
        <ReturnExchangeModal
          order={returnModalTarget.order}
          product={returnModalTarget.product}
          onClose={() => setReturnModalTarget(null)}
          onSuccess={() => {
            setReturnModalTarget(null)
            if (searchedOrderPhone) {
              handleSearchOrdersByPhone(null, searchedOrderPhone)
            }
          }}
        />
      )}
    </div>
  )
}
