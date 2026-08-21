import mongoose from 'mongoose'
import { SIZES } from './categories'

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 10, min: 0 },
    sizes: { type: [String], default: SIZES },
    colors: { type: [String], default: [] },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    image: String,
    size: String,
    qty: Number,
    price: Number,
    mrp: Number,
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    items: { type: [orderItemSchema], required: true },
    paymentMethod: { type: String, enum: ['upi', 'cod'], default: 'upi' },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true, index: true },
      address: { type: String, required: true },
      city: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    amount: { type: Number, required: true },          // final payable amount (after coupon)
    originalAmount: { type: Number, default: 0 },       // pre-coupon subtotal+delivery
    deliveryFee: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    couponDiscount: { type: Number, default: 0 },       // percentage e.g. 20
    discountAmount: { type: Number, default: 0 },       // ₹ amount saved
    utr: { type: String, default: '' },
    upiId: { type: String, default: '' },
    status: { type: String, default: 'pending', index: true },
    note: { type: String, default: '' },
    customerEmail: { type: String, default: '', index: true },
    tracking: {
      courier: { type: String, default: '' },
      number: { type: String, default: '' },
      url: { type: String, default: '' },
      eta: { type: String, default: '' },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
)

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    text: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const announcementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    text: { type: String, default: '' },
    date: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { _id: false }
)

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    storeName: { type: String, default: 'MJ FASHION WORLD' },
    tagline: { type: String, default: 'Fashion for everyone' },
    announcement: { type: String, default: '' },
    upiId: { type: String, default: 'yourname@upi' },
    qrImageUrl: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    deliveryFee: { type: Number, default: 49 },
    freeDeliveryAbove: { type: Number, default: 499 },
    heroImageUrl: { type: String, default: '' },
    codEnabled: { type: Boolean, default: true },
    offers: { type: [offerSchema], default: [] },
    announcements: { type: [announcementSchema], default: [] },
  },
  { timestamps: true }
)

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema)
export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema)
export const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema)
export const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema)