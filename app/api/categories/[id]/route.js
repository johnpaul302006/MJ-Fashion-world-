import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDb, dbConfigured } from '@/lib/db'
import { Category, Product } from '@/lib/models'
import { getUser } from '@/lib/auth'

export async function PATCH(request, { params }) {
  if (!dbConfigured) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  const conn = await connectDb()
  if (!conn) return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })

  const user = await getUser()
  if (!user || user.role !== 'host') {
    return NextResponse.json({ error: 'Unauthorized: host login required' }, { status: 403 })
  }

  const { id } = await params
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(id)
    const category = await Category.findOne(isObjectId ? { _id: id } : { slug: id })
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const data = await request.json()
    const name = data.name !== undefined ? String(data.name).trim() : null
    const image = data.image !== undefined ? String(data.image).trim() : null
    const sub = data.sub !== undefined ? String(data.sub).trim() : (data.description !== undefined ? String(data.description).trim() : null)
    const order = data.order !== undefined ? Number(data.order) : null

    if (name !== null) {
      if (name.length < 2 || name.length > 50) {
        return NextResponse.json({ error: 'Category name must be between 2 and 50 characters' }, { status: 400 })
      }
      // Check duplicate
      const duplicate = await Category.findOne({
        _id: { $ne: category._id },
        label: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
      })
      if (duplicate) {
        return NextResponse.json({ error: `A category named "${duplicate.label}" already exists` }, { status: 400 })
      }
      category.label = name
    }

    if (image !== null) {
      if (!image) return NextResponse.json({ error: 'Category image cannot be empty' }, { status: 400 })
      category.image = image
    }

    if (sub !== null) category.sub = sub
    if (order !== null && !isNaN(order)) category.order = order

    await category.save()

    return NextResponse.json({
      ok: true,
      category: {
        _id: String(category._id),
        slug: category.slug,
        label: category.label,
        image: category.image,
        sub: category.sub,
        order: category.order,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  if (!dbConfigured) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  const conn = await connectDb()
  if (!conn) return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })

  const user = await getUser()
  if (!user || user.role !== 'host') {
    return NextResponse.json({ error: 'Unauthorized: host login required' }, { status: 403 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const confirm = searchParams.get('confirm') === 'true'

  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(id)
    const category = await Category.findOne(isObjectId ? { _id: id } : { slug: id })
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check products in this category
    const productCount = await Product.countDocuments({ category: category.slug })

    if (productCount > 0 && !confirm) {
      return NextResponse.json(
        {
          error: `This category currently contains ${productCount} products. Please confirm deletion.`,
          productCount,
          requiresConfirmation: true,
        },
        { status: 409 }
      )
    }

    // Safely reassign products to 'all' so no pages or product cards break
    if (productCount > 0) {
      await Product.updateMany({ category: category.slug }, { $set: { category: 'all' } })
    }

    await Category.findByIdAndDelete(category._id)

    return NextResponse.json({
      ok: true,
      deleted: category.slug,
      label: category.label,
      reassignedProducts: productCount,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to delete category' }, { status: 500 })
  }
}
