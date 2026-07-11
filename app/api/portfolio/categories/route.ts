import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PortfolioItem from '@/models/Portfolio';

// Default categories - can be extended from DB
const DEFAULT_CATEGORIES = [
  { id: '1',  name: 'Wedding',      slug: 'wedding',      is_active: true, display_order: 1 },
  { id: '2',  name: 'Pre Wedding',  slug: 'pre-wedding',  is_active: true, display_order: 2 },
  { id: '3',  name: 'Post Wedding', slug: 'post-wedding', is_active: true, display_order: 3 },
  { id: '4',  name: 'Engagement',   slug: 'engagement',   is_active: true, display_order: 4 },

  { id: '5',  name: 'Reception',    slug: 'reception',    is_active: true, display_order: 5 },

  { id: '6',  name: 'Outdoor',      slug: 'outdoor',      is_active: true, display_order: 6 },
  { id: '7',  name: 'Indoor',       slug: 'indoor',       is_active: true, display_order: 7 },
  { id: '8',  name: 'Baby Shoot',   slug: 'baby-shoot',   is_active: true, display_order: 8 },
  { id: '9',  name: 'Product',      slug: 'product',      is_active: true, display_order: 9 },
  { id: '10', name: 'Corporate',    slug: 'corporate',    is_active: true, display_order: 10 },
  { id: '11', name: 'Ads',          slug: 'ads',          is_active: true, display_order: 11 },
  { id: '12', name: 'Food Shoot',   slug: 'food-shoot',   is_active: true, display_order: 12 },
  { id: '13', name: 'Album',        slug: 'album',        is_active: true, display_order: 13 },
  { id: '14', name: 'Other',        slug: 'other',        is_active: true, display_order: 14 },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const active = searchParams.get('active');
  
  const categories = active === 'true'
    ? DEFAULT_CATEGORIES.filter((c) => c.is_active)
    : DEFAULT_CATEGORIES;

  return NextResponse.json({ categories });
}
