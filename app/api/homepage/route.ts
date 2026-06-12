import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import HomepageSettings from '@/models/HomepageSettings';
import { getCurrentUser } from '@/lib/auth';

// Default initial settings
const DEFAULT_HERO = {
  backgroundImage: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/06.webp',
  heading: 'Capturing Moments Into Eternity',
  subheading: 'Kutti Story Photography',
  paragraph: "We don't just take pictures; we craft visual legacies. Specializing in high-end storytelling and cinematic night shoots.",
  badgeText: 'Kutti Story Photography',
  primaryButtonText: 'Book a Session',
  secondaryButtonText: 'View Portfolio',
  statsYears: '7+',
  statsStories: '213+',
  statsPassion: '100%',
  heroCardImage: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/06.webp',
  awardText: 'Award Winning Studio 2024',
};

const DEFAULT_SHOWCASE_SLIDES = [
  { image1: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/13.webp', image2: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/11.webp', year: '2K23' },
  { image1: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/19.webp', image2: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/05.webp', year: '2K24' },
  { image1: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/02.webp', image2: '/images/Webp Photo/Outdoor/Aravindh & Dhanushya/Night shoot/New folder/14.webp', year: '2K25' },
];

const DEFAULT_STORY_IMAGES = [
  { src: '/01.webp', alt: 'Story 1' },
  { src: '/02.webp', alt: 'Story 2' },
  { src: '/03.webp', alt: 'Story 3' },
  { src: '/04.webp', alt: 'Story 4' },
  { src: '/05.webp', alt: 'Story 5' },
  { src: '/06.webp', alt: 'Story 6' },
  { src: '/07.webp', alt: 'Story 7' },
  { src: '/08.webp', alt: 'Story 8' },
];

const DEFAULT_HOME_IMAGES = [
  { key: 'about_main', label: 'About Section Main Image', url: '/01.webp' },
  { key: 'about_secondary', label: 'About Section Secondary Image', url: '/01.webp' },
  { key: 'featured_big', label: 'Featured Work Large Image', url: '/02.webp' },
  { key: 'featured_small', label: 'Featured Work Small Image', url: '/03.webp' },
  { key: 'philosophy_bg', label: 'Philosophy Section Background', url: '/04.webp' },
];
const DEFAULT_ABOUT_CONTENT = {
  title: 'About Kutti Story',
  heading: 'We Make Only Authentic Visual Experiences',
  description:
    'Every frame we create is driven by emotion, story, and authenticity.',
};
export async function GET() {
  try {
    await connectDB();
    let settings = await HomepageSettings.findOne();

    if (!settings) {
      settings = await HomepageSettings.create({
        hero: DEFAULT_HERO,
        homeImages: DEFAULT_HOME_IMAGES,
        showcaseSlides: DEFAULT_SHOWCASE_SLIDES,
        storyImages: DEFAULT_STORY_IMAGES,
        aboutContent: DEFAULT_ABOUT_CONTENT,
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Homepage GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { section, data } = body;

    let settings = await HomepageSettings.findOne();
    if (!settings) {
      settings = await HomepageSettings.create({
        hero: DEFAULT_HERO,
        homeImages: DEFAULT_HOME_IMAGES,
        showcaseSlides: DEFAULT_SHOWCASE_SLIDES,
        storyImages: DEFAULT_STORY_IMAGES,
        aboutContent: DEFAULT_ABOUT_CONTENT,
      });
    }

    if (section === 'hero') {
      Object.assign(settings.hero, data);
    } else if (section === 'homeImages') {
      settings.homeImages = data;
    } else if (section === 'showcaseSlides') {
      settings.showcaseSlides = data;
    } else if (section === 'storyImages') {
      settings.storyImages = data;
    } else if (section === 'aboutContent') {
      settings.aboutContent = data;
    }

      if (section === 'aboutContent') {
      settings.markModified('aboutContent');
    } else {
      settings.markModified(section);
    }
    await settings.save();

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Homepage PUT error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
