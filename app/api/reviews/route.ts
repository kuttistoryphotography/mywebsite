import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Review from '@/models/Review';
import { getCurrentUser } from '@/lib/auth';

/* ── GET — public: approved reviews; admin: all ── */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const category  = searchParams.get('category');
    const featured  = searchParams.get('featured') === 'true';
    const adminView = searchParams.get('admin') === 'true';
    const myReviews = searchParams.get('my') === 'true';

    const session = await getCurrentUser().catch(() => null);

    const filter: Record<string, unknown> = {};
    if (!adminView) filter.approved = true;
    if (featured) filter.featured = true;
    if (category && category !== 'all') filter.category = category;
    if (myReviews && session) filter.userId = session.userId;

    const reviews = await Review.find(filter).sort({ createdAt: -1 });

    // Distinct approved categories for the tab bar
    const categories = await Review.distinct('category', { approved: true });
    console.log('reviews----', reviews);
    console.log('categories----', categories);
    
    return NextResponse.json({
      reviews: reviews.map((r: any) => ({
        id:          String(r._id),
        userId:      String(r.userId),
        userName:    r.userName,
        userEmail:   r.userEmail,
        userAvatar:  r.userAvatar || null,
        rating:      r.rating,
        category:    r.category,
        title:       r.title,
        body:        r.body,
        approved:    r.approved,
        featured:    r.featured,
        serviceDate: r.serviceDate || null,
        createdAt:   r.createdAt,
      })),
      categories,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ── POST — authenticated user submits a review ── */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const { rating, category, title, body, serviceDate } = await request.json();

    if (!rating || !category || !title || !body)
      return NextResponse.json({ error: 'rating, category, title, and body are required' }, { status: 400 });

    if (rating < 1 || rating > 5)
      return NextResponse.json({ error: 'rating must be 1–5' }, { status: 400 });

    // One review per user per category
    const existing = await Review.findOne({ userId: session.userId, category });
    if (existing)
      return NextResponse.json({ error: 'You already submitted a review for this category. Edit your existing review instead.' }, { status: 409 });

    const review = await Review.create({
      userId:      session.userId,
      userName:    session.name || session.email,
      userEmail:   session.email,
      rating:      Number(rating),
      category,
      title,
      body,
      serviceDate: serviceDate ? new Date(serviceDate) : undefined,
      approved:    false, // requires admin approval
    });

    return NextResponse.json({ success: true, id: String(review._id) }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ── PUT — user edits own review OR admin approves/features ── */
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const { id, rating, category, title, body, serviceDate, approved, featured } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const review = await Review.findById(id);
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    const isOwner = String(review.userId) === String(session.userId);
    const isAdmin = session.role === 'admin';

    if (!isOwner && !isAdmin)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const update: Record<string, unknown> = {};
    if (isOwner) {
      if (rating    !== undefined) { update.rating = Number(rating); update.approved = false; }
      if (category  !== undefined) update.category = category;
      if (title     !== undefined) update.title    = title;
      if (body      !== undefined) update.body     = body;
      if (serviceDate !== undefined) update.serviceDate = serviceDate ? new Date(serviceDate) : null;
    }
    if (isAdmin) {
      if (approved !== undefined) update.approved = approved;
      if (featured !== undefined) update.featured = featured;
    }

    await Review.findByIdAndUpdate(id, update);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ── DELETE — user deletes own OR admin deletes any ── */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const review = await Review.findById(id);
    if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isOwner = String(review.userId) === String(session.userId);
    const isAdmin = session.role === 'admin';
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await Review.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
