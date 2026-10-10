import mongoose from 'mongoose'
import { SIZES } from './categories'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'host'], default: 'customer' },
  },
  { timestamps: true }
)

const addressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, default: 'Home', trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: '', trim: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// One-time password reset tokens. Only the SHA-256 hash of the token is stored.
const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
)

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 10, min: 0 },
    sizes: { type: [String], default: SIZES },
    colors: { type: [String], default: [] },
    brand: { type: String, default: '', trim: true, index: true },
    tags: { type: [String], default: [], index: true },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },
    description: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false, index: true },
    newArrivalAt: { type: Date, default: null, index: true },
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
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    items: { type: [orderItemSchema], required: true },
    paymentMethod: { type: String, enum: ['upi', 'cod', 'razorpay', 'stripe'], default: 'upi' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending', index: true },
    payment: {
      provider: { type: String, default: '' },      // razorpay | stripe | upi-manual | cod
      refId: { type: String, default: '' },          // gateway order / session id
      paymentId: { type: String, default: '' },      // gateway payment id
      paidAt: { type: Date, default: null },
    },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true, index: true },
      address: { type: String, required: true },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    amount: { type: Number, required: true },          // final payable amount (after coupon)
    originalAmount: { type: Number, default: 0 },       // pre-coupon subtotal+delivery
    deliveryFee: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    couponDiscount: { type: Number, default: 0 },       // percentage e.g. 20
    percentage: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },       // ₹ amount saved
    utr: { type: String, default: '' },
    upiId: { type: String, default: '' },
    status: { type: String, default: 'pending', index: true },
    note: { type: String, default: '' },
    customerEmail: { type: String, default: '', index: true },
    addressId: { type: String, default: '' },
    deliveredAt: { type: Date, default: null },
    statusTimestamps: {
      placed: { type: Date, default: Date.now },
      confirmed: { type: Date, default: null },
      packed: { type: Date, default: null },
      shipped: { type: Date, default: null },
      out_for_delivery: { type: Date, default: null },
      delivered: { type: Date, default: null },
    },
    shipment: {
      provider: { type: String, default: '' },   // shiprocket | amazon-shipping
      refId: { type: String, default: '' },      // provider order/shipment id
      awb: { type: String, default: '' },        // tracking / AWB number
      courier: { type: String, default: '' },
      status: { type: String, default: '' },
      labelUrl: { type: String, default: '' },
      trackingUrl: { type: String, default: '' },
      createdAt: { type: Date, default: null },
    },
    tracking: {
      courier: { type: String, default: '' },
      number: { type: String, default: '' },
      url: { type: String, default: '' },
      eta: { type: String, default: '' },
      currentLocation: { type: String, default: '' },
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
    percentage: { type: Number, required: true, min: 1, max: 90 },
    discountPercent: { type: Number, default: 0 },
    startsAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    createdBy: { type: String, default: 'sjohnpaul638@gmail.com' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, default: 'Customer', trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, default: '', trim: true, maxlength: 2000 },
  },
  { timestamps: true }
)

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true })

const categorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    label: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    sub: { type: String, default: 'Shop Now' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const returnRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    orderDocId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true, index: true },
    customerEmail: { type: String, default: '', index: true },
    product: {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: { type: String, required: true },
      image: { type: String, default: '' },
      size: { type: String, default: '' },
      price: { type: Number, required: true },
      qty: { type: Number, default: 1 },
    },
    type: {
      type: String,
      enum: ['return', 'exchange'],
      required: true,
    },
    reason: {
      code: {
        type: String,
        enum: ['wrong_size', 'defective', 'not_as_pictured', 'changed_mind', 'other'],
        required: true,
      },
      text: { type: String, default: '' },
    },
    exchangeDetails: {
      newSize: { type: String, default: '' },
      newColor: { type: String, default: '' },
    },
    photos: [{ type: String }],
    declaration: {
      type: Boolean,
      required: true,
      default: false,
    },
    feedback: {
      rating: { type: Number, min: 1, max: 5, default: 5 },
      comments: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
    hostNote: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: String, default: '' },
  },
  { timestamps: true }
)

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    id: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true },
    mrp: { type: Number, default: 0 },
    size: { type: String, default: 'Free Size' },
    qty: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
)

const cartSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, lowercase: true, index: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
)
cartSchema.index({ userId: 1 }, { unique: true })

const wishlistItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    id: { type: String, required: true },
    _id: { type: String },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    mrp: { type: Number, default: 0 },
    image: { type: String, default: '' },
    category: { type: String, default: '' },
    stock: { type: Number, default: 10 },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    description: { type: String, default: '' },
    featured: { type: Boolean, default: false },
  },
  { _id: false }
)

const wishlistSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, lowercase: true, index: true },
    items: { type: [wishlistItemSchema], default: [] },
  },
  { timestamps: true }
)
wishlistSchema.index({ userId: 1 }, { unique: true })

if (mongoose.models.Coupon && !mongoose.models.Coupon.schema.paths.startsAt) {
  delete mongoose.models.Coupon
}
if (mongoose.models.Order && (!mongoose.models.Order.schema.paths.deliveredAt || !mongoose.models.Order.schema.paths.statusTimestamps)) {
  delete mongoose.models.Order
}

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema)
export const Category = mongoose.models.Category || mongoose.model('Category', categorySchema)
export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema)
export const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema)
export const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema)
export const User = mongoose.models.User || mongoose.model('User', userSchema)
export const Address = mongoose.models.Address || mongoose.model('Address', addressSchema)
export const PasswordResetToken =
  mongoose.models.PasswordResetToken || mongoose.model('PasswordResetToken', passwordResetTokenSchema)
export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema)
export const ReturnRequest = mongoose.models.ReturnRequest || mongoose.model('ReturnRequest', returnRequestSchema)
export const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema)
export const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema)