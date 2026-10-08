import { School } from './api';

export interface SchoolPhotoItem {
  id: string;
  url: string;
  title: string;
  category: 'Campus' | 'Academic' | 'Events' | 'Facilities';
  description?: string;
}

export interface SchoolAnnouncementItem {
  id: string;
  title: string;
  date: string;
  badge: string;
  content: string;
}

export interface SchoolWebsiteConfig {
  school_id: string;
  hero_title: string;
  hero_tagline: string;
  hero_description: string;
  hero_bg_image: string;
  logo_url: string;
  motto: string;
  deped_division: string;
  deped_region: string;
  deped_school_id: string;
  accent_color: string;

  // Mission & Vision
  mission_text: string;
  vision_text: string;
  core_values: { title: string; desc: string }[];

  // Principal Welcome
  principal_message: string;
  principal_name: string;
  principal_title: string;
  principal_photo_url: string;

  // Photos Gallery
  photos: SchoolPhotoItem[];

  // Announcements
  announcements: SchoolAnnouncementItem[];

  // Quick stats
  stat_students: string;
  stat_teachers: string;
  stat_classrooms: string;
  stat_attendance_rate: string;

  // Contact
  address: string;
  contact_phone: string;
  contact_email: string;
}

export function getDefaultSchoolWebsiteConfig(school?: School | null): SchoolWebsiteConfig {
  const isHS = school?.school_type === 'HIGH_SCHOOL';
  const schoolName = school?.name || (isHS ? 'San Fernando National High School' : 'Sawat Elementary School');
  const depedId = school?.deped_school_id || (isHS ? '300891' : '101692');
  const division = school?.division || 'Division of Pangasinan II';
  const region = school?.region || 'Region I';

  return {
    school_id: school?.id || 'default-school',
    deped_school_id: depedId,
    hero_title: schoolName,
    hero_tagline: 'Molding Lifelong Filipino Learners with Excellence, Character, and Innovation',
    hero_description:
      'Welcome to the official public portal of ' +
      schoolName +
      '. Dedicated to delivering quality basic education in a safe, child-friendly, and technologically empowered learning environment.',
    hero_bg_image: '/gallery/campus-banner.jpg',
    logo_url: school?.logo_url || '/logos/sawat.png',
    motto: 'Bansang Makabata, Batang Makabansa',
    deped_division: division,
    deped_region: region,
    accent_color: '#2563eb', // royal blue

    mission_text:
      'To protect and promote the right of every Filipino to quality, equitable, culture-based, and complete basic education where students learn in a child-friendly, gender-sensitive, safe, and motivating environment.',
    vision_text:
      'We dream of Filipinos who passionately love their country and whose values and competencies enable them to realize their full potential and contribute meaningfully to building the nation.',
    core_values: [
      { title: 'Maka-Diyos', desc: 'Nurturing spiritual grounding and reverence in all learner actions.' },
      { title: 'Makatao', desc: 'Fostering empathy, mutual respect, inclusivity, and humanitarian fellowship.' },
      { title: 'Makakalikasan', desc: 'Instilling environmental stewardship and sustainable green campus initiatives.' },
      { title: 'Makabansa', desc: 'Inspiring patriotic dedication, civic duty, and pride in Philippine cultural heritage.' },
    ],

    principal_message:
      'Warmest greetings to all parents, learners, stakeholders, and community partners! Here at ' +
      schoolName +
      ', we champion holistic development and academic rigor supported by modern automated school management and real-time attendance tracking. Together, let us cultivate learners ready for tomorrow.',
    principal_name: school?.school_head_name || 'Dr. Rico Idos',
    principal_title: school?.school_head_title || 'Principal I',
    principal_photo_url: '/avatars/default-user.svg',

    photos: [
      {
        id: 'photo-1',
        url: '/gallery/campus-banner.jpg',
        title: 'Modern Campus Academic Pavilion',
        category: 'Campus',
        description: 'Multi-storey DepEd school building facade and central flag ceremony courtyard.',
      },
      {
        id: 'photo-2',
        url: '/gallery/classroom-learning.jpg',
        title: 'Interactive Collaborative Classroom',
        category: 'Academic',
        description: 'Learners engaging in collaborative multimedia science and mathematics instruction.',
      },
      {
        id: 'photo-3',
        url: '/gallery/campus-event.jpg',
        title: 'DepEd Academic & Sports Recognition Celebration',
        category: 'Events',
        description: 'Annual school recognition ceremony celebrating student achievement, sports, and cultural arts.',
      },
    ],

    announcements: [
      {
        id: 'ann-1',
        title: 'DepEd Online Early Registration & Enrollment Ongoing',
        date: 'SY 2025–2026',
        badge: 'Admissions Open',
        content:
          'Official DepEd enrollment for the upcoming school year is now open. Submit applications conveniently via our online portal without queues.',
      },
      {
        id: 'ann-2',
        title: 'Implementation of Automated RFID Turnstile Gate Kiosk',
        date: 'DepEd Order No. 8',
        badge: 'Campus Safety',
        content:
          'Learner safety and daily attendance logging is now fully integrated with instant automated parent SMS notifications upon gate entry and exit.',
      },
      {
        id: 'ann-3',
        title: 'Brigada Eskwela & Community Stakeholders Assembly',
        date: 'Campus Grounds',
        badge: 'Community',
        content:
          'Join us for our annual campus beautification and school readiness drive. Parents, alumni, and local barangay officials are warmly invited.',
      },
    ],

    stat_students: '520+',
    stat_teachers: '24',
    stat_classrooms: '18',
    stat_attendance_rate: '98.4%',

    address: `${school?.barangay || 'Sawat'}, ${school?.municipality_city || 'Urbiztondo'}, ${school?.province || 'Pangasinan'}`,
    contact_phone: school?.contact_phone || '0905 669 1862',
    contact_email: school?.contact_email || 'sawatelementaryschool@gmail.com',
  };
}

export function loadSchoolWebsiteConfig(school?: School | null): SchoolWebsiteConfig {
  const defaults = getDefaultSchoolWebsiteConfig(school);
  if (typeof window === 'undefined') return defaults;

  try {
    const key = `identify_school_website_${school?.id || 'default'}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaults,
        ...parsed,
        photos: parsed.photos?.length ? parsed.photos : defaults.photos,
        announcements: parsed.announcements?.length ? parsed.announcements : defaults.announcements,
        core_values: parsed.core_values?.length ? parsed.core_values : defaults.core_values,
      };
    }
  } catch (err) {
    console.warn('Error loading school website config:', err);
  }

  return defaults;
}

export function saveSchoolWebsiteConfig(schoolId: string, config: SchoolWebsiteConfig): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const key = `identify_school_website_${schoolId || 'default'}`;
    localStorage.setItem(key, JSON.stringify(config));
    window.dispatchEvent(new Event('storage'));
    return true;
  } catch (err) {
    console.error('Error saving school website config:', err);
    return false;
  }
}
