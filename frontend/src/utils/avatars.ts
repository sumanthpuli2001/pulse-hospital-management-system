/**
 * AI Avatar mapping helper for all clinical roles and personas.
 * Provides realistic portraits for each staff account, doctor, and patient.
 */

// Centralized High-Definition Doctor Portraits (Matched across Doctor Directory & Login Topbar)
export const DOCTOR_PORTRAITS_MAP: Record<string, string> = {
  // Dr. Hassini Malhotra (Orthopedics, Female)
  'hassini': 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=320&auto=format&fit=crop&q=80',
  'hasini': 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=320&auto=format&fit=crop&q=80',
  'malhotra': 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=320&auto=format&fit=crop&q=80',
  
  // Dr. Soniya Singh (Neurology, Female)
  'soniya': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=320&auto=format&fit=crop&q=80',
  'singh': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=320&auto=format&fit=crop&q=80',
  
  // Dr. Rajesh Varma (Cardiology, Male)
  'rajesh': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=320&auto=format&fit=crop&q=80',
  'varma': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=320&auto=format&fit=crop&q=80',
  
  // Dr. Alexander Fleming (General Medicine, Male)
  'fleming': 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=320&auto=format&fit=crop&q=80',
  'alexander': 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=320&auto=format&fit=crop&q=80',
  
  // Dr. DR Samaram (Emergency & Trauma, Male)
  'samaram': 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=320&auto=format&fit=crop&q=80',

  // Dr. David Miller (Pediatrics / Acute Care, Male) - Distinct Photo
  'david': 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=320&auto=format&fit=crop&q=80',
  'miller': 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=320&auto=format&fit=crop&q=80',

  // Dr. Harmanpreet Kaur (Pediatrics, Female) - Verified Female Physician Portrait
  'harmanpreet': 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=320&auto=format&fit=crop&q=80',
  'kaur': 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=320&auto=format&fit=crop&q=80',
};

export const MALE_DOCTOR_PHOTOS = [
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1584467735874-743525287b46?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594824813579-99446df4f2d2?w=320&auto=format&fit=crop&q=80',
];

export const FEMALE_DOCTOR_PHOTOS = [
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1623854767648-e7bb8009f0db?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1591604021695-0c69b7c05981?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=320&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=320&auto=format&fit=crop&q=80',
];

export const isFemaleNameOrDoctor = (name?: string, gender?: string): boolean => {
  if (gender?.toUpperCase() === 'FEMALE') return true;
  if (gender?.toUpperCase() === 'MALE') return false;
  if (!name) return false;
  const n = name.toLowerCase();
  const femaleKeywords = [
    'hassini', 'hasini', 'malhotra', 'soniya', 'singh', 'harmanpreet', 'kaur', 'priya', 'kavya', 'anita',
    'sharma', 'lakshmi', 'pooja', 'sneha', 'deepa', 'neha', 'elena', 'anna',
    'maria', 'sister', 'mary', 'dr.soniya', 'dr.hassini', 'dr.hasini', 'dr.harmanpreet'
  ];
  return femaleKeywords.some(k => n.includes(k));
};

export const getDoctorPhoto = (doc: { id?: number; firstName?: string; lastName?: string; gender?: string }, index = 0): string => {
  const fullName = `${doc.firstName || ''} ${doc.lastName || ''}`.toLowerCase();
  for (const [key, url] of Object.entries(DOCTOR_PORTRAITS_MAP)) {
    if (fullName.includes(key)) {
      return url;
    }
  }
  const isFemale = isFemaleNameOrDoctor(fullName, doc.gender);
  const list = isFemale ? FEMALE_DOCTOR_PHOTOS : MALE_DOCTOR_PHOTOS;
  const hashKey = doc.id !== undefined ? doc.id : (fullName ? fullName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : index);
  return list[Math.abs(hashKey) % list.length];
};

/**
 * Builds a collision-free photo map for an entire doctors roster.
 * Ensures:
 * 1. Gender accuracy (female doctors only receive female photos; male doctors only receive male photos)
 * 2. Uniqueness (no two doctors in the list share the exact same photo)
 * 3. Fallback to unique AI personas when list exceeds photo library
 */
export const getUniqueDoctorAvatarList = (
  doctorsList: { id?: number; firstName?: string; lastName?: string; gender?: string }[]
): Map<number, string> => {
  const photoMap = new Map<number, string>();
  const usedUrls = new Set<string>();

  doctorsList.forEach((doc, idx) => {
    const docKey = doc.id ?? idx;
    const fullName = `${doc.firstName || ''} ${doc.lastName || ''}`.toLowerCase();
    const isFemale = isFemaleNameOrDoctor(fullName, doc.gender);

    let chosenUrl = '';

    // Check exact known portrait map
    for (const [key, url] of Object.entries(DOCTOR_PORTRAITS_MAP)) {
      if (fullName.includes(key) && !usedUrls.has(url)) {
        chosenUrl = url;
        break;
      }
    }

    // If not matched, pick first unused from gender-appropriate pool
    if (!chosenUrl) {
      const pool = isFemale ? FEMALE_DOCTOR_PHOTOS : MALE_DOCTOR_PHOTOS;
      for (const url of pool) {
        if (!usedUrls.has(url)) {
          chosenUrl = url;
          break;
        }
      }
    }

    // If all pool photos exhausted, generate a unique AI persona avatar
    if (!chosenUrl) {
      const seed = encodeURIComponent(`${doc.firstName || 'Physician'}-${doc.lastName || 'Specialist'}-${doc.id ?? idx}`);
      chosenUrl = isFemale
        ? `https://api.dicebear.com/7.x/personas/svg?seed=${seed}&gender=female&backgroundColor=b6e3f4,c0aede,d1d4f9`
        : `https://api.dicebear.com/7.x/personas/svg?seed=${seed}&gender=male&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    }

    usedUrls.add(chosenUrl);
    photoMap.set(docKey, chosenUrl);
  });

  return photoMap;
};

export const getAvatarByRoleOrUser = (
  roleOrUsername?: string,
  gender?: string,
  name?: string
): string => {
  const combined = `${roleOrUsername || ''} ${name || ''}`.toLowerCase();

  // 1. Direct Doctor Portrait Lookup (Exact Match for Hassini Malhotra, Rajesh Varma, Soniya Singh, etc.)
  for (const [key, url] of Object.entries(DOCTOR_PORTRAITS_MAP)) {
    if (combined.includes(key)) {
      return url;
    }
  }

  // 2. Doctor Role Resolution
  if (combined.includes('doctor') || combined.includes('dr.')) {
    const isFemale = isFemaleNameOrDoctor(combined, gender);
    return isFemale ? FEMALE_DOCTOR_PHOTOS[0] : MALE_DOCTOR_PHOTOS[0];
  }

  // 3. Super Admin
  if (combined.includes('super_admin') || combined.includes('superadmin') || combined.includes('system admin')) {
    return '/images/avatars/superadmin.jpg';
  }

  // 4. Hospital Admin
  if (combined.includes('hospital_admin') || combined.includes('admin')) {
    return '/images/avatars/admin.jpg';
  }

  // 5. Nurse / Sister Mary
  if (combined.includes('nurse') || combined.includes('mary') || combined.includes('sister')) {
    return '/images/avatars/nurse.jpg';
  }

  // 6. Pharmacist
  if (combined.includes('pharm') || combined.includes('david')) {
    return '/images/avatars/pharmacist.jpg';
  }

  // 7. Receptionist / Front Desk
  if (combined.includes('recep') || combined.includes('anna')) {
    return '/images/avatars/nurse.jpg';
  }

  // 8. Lab Technician
  if (combined.includes('lab') || combined.includes('technician')) {
    return '/images/avatars/dr_female.jpg';
  }

  // 9. Accountant / Billing Officer
  if (combined.includes('acct') || combined.includes('accountant') || combined.includes('lisa')) {
    return '/images/avatars/admin.jpg';
  }

  // 10. Patient Gender Detection
  if (combined.includes('patient') || combined.includes('pat-')) {
    if (
      gender?.toUpperCase() === 'FEMALE' ||
      combined.includes('kavya') ||
      combined.includes('reddy') ||
      combined.includes('priya') ||
      combined.includes('mary')
    ) {
      return '/images/avatars/patient_f.jpg';
    }
    return '/images/avatars/patient_m.jpg';
  }

  // 11. Explicit gender fallback
  if (gender?.toUpperCase() === 'FEMALE' || isFemaleNameOrDoctor(combined, gender)) {
    return '/images/avatars/patient_f.jpg';
  }

  return '/images/avatars/patient_m.jpg';
};
