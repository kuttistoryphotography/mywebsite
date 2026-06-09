/**
 * MongoDB Seed Script
 * Run: npx ts-node scripts/seed-mongodb.ts
 * Or:  npx tsx scripts/seed-mongodb.ts
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kutti-story';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // ── Dynamic import models ─────────────────────────────────────────────────
  const User = (await import('../models/User')).default;
  const HomepageSettings = (await import('../models/HomepageSettings')).default;
  const Service = (await import('../models/Service')).default;
  const MonthlyQuote = (await import('../models/MonthlyQuote')).default;

  // ── Admin user ────────────────────────────────────────────────────────────
  const existingAdmin = await User.findOne({ email: 'admin@kuttistory.com' });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@123', 12);
    await User.create({
      email: 'admin@kuttistory.com',
      passwordHash,
      firstName: 'Kutti',
      lastName: 'Admin',
      role: 'admin',
      isActive: true,
      emailVerified: true,
    });
    console.log('✅ Admin user created → admin@kuttistory.com / Admin@123');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // ── Homepage settings ─────────────────────────────────────────────────────
  const existingSettings = await HomepageSettings.findOne();
  if (!existingSettings) {
    await HomepageSettings.create({
      hero: {
        backgroundImage: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/06.webp',
        heading: 'Capturing Moments Into Eternity',
        subheading: 'Kutti Story Photography',
        paragraph: "We don't just take pictures; we craft visual legacies.",
        badgeText: 'Kutti Story Photography',
        primaryButtonText: 'Book a Session',
        secondaryButtonText: 'View Portfolio',
        statsYears: '7+',
        statsStories: '213+',
        statsPassion: '100%',
        heroCardImage: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/06.webp',
        awardText: 'Award Winning Studio 2024',
      },
      homeImages: [
        { key: 'about_main', label: 'About Section Main Image', url: '/01.webp' },
        { key: 'about_secondary', label: 'About Section Secondary Image', url: '/01.webp' },
        { key: 'featured_big', label: 'Featured Work Large Image', url: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/19.webp' },
        { key: 'featured_small', label: 'Featured Work Small Image', url: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/05.webp' },
        { key: 'philosophy_bg', label: 'Philosophy Section Background', url: '/04.webp' },
      ],
      showcaseSlides: [
        { image1: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/13.webp', image2: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/11.webp', year: '2K23' },
        { image1: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/19.webp', image2: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/05.webp', year: '2K24' },
        { image1: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/02.webp', image2: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/14.webp', year: '2K25' },
      ],
      storyImages: Array.from({ length: 8 }, (_, i) => ({ src: `/${String(i + 1).padStart(2, '0')}.webp`, alt: `Story ${i + 1}` })),
    });
    console.log('✅ Homepage settings created');
  }

  // ── Default services ──────────────────────────────────────────────────────
  const serviceCount = await Service.countDocuments();
  if (serviceCount === 0) {
    const services = [
      { title: 'Wedding Photography', slug: 'wedding-photography', description: 'Cinematic wedding coverage capturing every emotional moment of your special day.', shortDescription: 'Cinematic wedding coverage', price: '25,000', features: ['Full day coverage', 'Edited photos', 'Online gallery', 'USB delivery'], sortOrder: 1, icon: '💍', isActive: true },
      { title: 'Pre-Wedding Shoot', slug: 'pre-wedding-shoot', description: 'Beautiful pre-wedding sessions in stunning outdoor locations.', shortDescription: 'Outdoor pre-wedding sessions', price: '12,000', features: ['4 hour session', '200+ edited photos', 'Location scouting', 'Prop arrangement'], sortOrder: 2, icon: '💑', isActive: true },
      { title: 'Baby Shoot', slug: 'baby-shoot', description: 'Precious newborn and baby milestone photography in a safe, comfortable setting.', shortDescription: 'Newborn & milestone photography', price: '8,000', features: ['2 hour session', 'Theme setup', 'Props included', '100+ photos'], sortOrder: 3, icon: '👶', isActive: true },
      { title: 'Product Photography', slug: 'product-photography', description: 'High-quality product images for e-commerce, catalogues and brand campaigns.', shortDescription: 'E-commerce & catalogue shots', price: '5,000', features: ['Studio setup', 'White/black backdrop', 'Multiple angles', 'Retouching'], sortOrder: 4, icon: '📦', isActive: true },
      { title: 'Corporate Events', slug: 'corporate-events', description: 'Professional event photography for conferences, product launches and corporate gatherings.', shortDescription: 'Corporate event coverage', price: '15,000', features: ['Full event coverage', 'Same day highlights', 'Branded gallery', 'Rush delivery'], sortOrder: 5, icon: '🏢', isActive: true },
      { title: 'Food Photography', slug: 'food-photography', description: 'Mouth-watering food photography for restaurants, menus and social media.', shortDescription: 'Restaurant & menu photography', price: '7,000', features: ['Studio/on-location', 'Styling included', 'Social media sizing', 'Raw + edited files'], sortOrder: 6, icon: '🍽️', isActive: true },
    ];
    await Service.insertMany(services);
    console.log('✅ Default services created');
  }

  // ── Monthly quote ─────────────────────────────────────────────────────────
  const now = new Date();
  const existingQuote = await MonthlyQuote.findOne({ month: now.getMonth() + 1, year: now.getFullYear() });
  if (!existingQuote) {
    await MonthlyQuote.create({
      text: 'Photography is the story I fail to put into words.',
      author: 'Destin Sparks',
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      isActive: true,
    });
    console.log('✅ Monthly quote created');
  }

  await mongoose.disconnect();
  console.log('\n🎉 Seed completed successfully!');
  console.log('\nAdmin login:');
  console.log('  Email: admin@kuttistory.com');
  console.log('  Password: Admin@123');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
