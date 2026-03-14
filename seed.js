// =============================================================
// Comprehensive Seed Script for Doctor Appointment System
// Seeds: Specializations, Doctors, Availability (STREAM + WAVE),
//        Patients, and Test Appointments
// =============================================================

// ---- CONFIG ----
// Change this to your deployed URL or keep localhost for local dev
const BASE_URL = process.env.SEED_API_URL || 'http://localhost:3000/api/v1';

async function api(method, endpoint, data = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  const text = await res.text();
  let json = {};
  try { json = JSON.parse(text); } catch (e) { }

  if (!res.ok) {
    console.error(`  ❌ ERROR ${method} ${endpoint}:`, json?.message || text);
  }
  return { data: json, status: res.status, ok: res.ok };
}

// Helper: get tomorrow, day-after, etc.
function getFutureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

function getDayName(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
}

async function seed() {
  console.log('='.repeat(60));
  console.log('🚀 Starting Comprehensive Database Seed...');
  console.log(`   Target API: ${BASE_URL}`);
  console.log('='.repeat(60));

  // =========================================================
  // 1. SPECIALIZATIONS
  // =========================================================
  console.log('\n📋 Step 1: Creating Specializations...');
  const specs = [
    'Cardiology',
    'Neurology',
    'General Medicine',
    'Orthopedics',
    'Pediatrics',
    'Dermatology',
    'Ophthalmology',
    'ENT',
  ];
  const specMap = {};

  for (const s of specs) {
    const res = await api('POST', '/specializations', { name: s });
    if (res.ok) {
      console.log(`   ✅ Created: ${s}`);
    } else {
      console.log(`   ⚠️  ${s} (may already exist)`);
    }
  }

  // Fetch all specs to map name → id
  const specsRes = await api('GET', '/specializations');
  if (specsRes.data && Array.isArray(specsRes.data)) {
    for (const s of specsRes.data) {
      specMap[s.name] = s.id;
    }
  }
  console.log(`   📌 Available specializations:`, Object.keys(specMap).join(', '));

  // =========================================================
  // 2. DOCTORS (8 doctors with varied specializations)
  // =========================================================
  console.log('\n👨‍⚕️ Step 2: Creating Doctors...');
  const doctors = [
    {
      name: 'Dr. Sarah Johnson',
      email: 'sarah@example.com',
      pass: 'password123',
      spec: 'Cardiology',
      exp: 12,
      fee: 500,
      qual: 'MD Cardiology, FACC',
    },
    {
      name: 'Dr. Michael Chen',
      email: 'michael@example.com',
      pass: 'password123',
      spec: 'Neurology',
      exp: 8,
      fee: 400,
      qual: 'MD Neurology',
    },
    {
      name: 'Dr. Emily Davis',
      email: 'emily@example.com',
      pass: 'password123',
      spec: 'General Medicine',
      exp: 4,
      fee: 200,
      qual: 'MBBS, MD General Medicine',
    },
    {
      name: 'Dr. Robert Smith',
      email: 'robert@example.com',
      pass: 'password123',
      spec: 'Orthopedics',
      exp: 15,
      fee: 600,
      qual: 'MS Orthopedics, FACS',
    },
    {
      name: 'Dr. Linda Taylor',
      email: 'linda@example.com',
      pass: 'password123',
      spec: 'Pediatrics',
      exp: 10,
      fee: 350,
      qual: 'MD Pediatrics',
    },
    {
      name: 'Dr. James Wilson',
      email: 'james@example.com',
      pass: 'password123',
      spec: 'Dermatology',
      exp: 6,
      fee: 300,
      qual: 'MD Dermatology',
    },
    {
      name: 'Dr. Priya Patel',
      email: 'priya@example.com',
      pass: 'password123',
      spec: 'Ophthalmology',
      exp: 9,
      fee: 450,
      qual: 'MS Ophthalmology',
    },
    {
      name: 'Dr. Ahmed Khan',
      email: 'ahmed@example.com',
      pass: 'password123',
      spec: 'ENT',
      exp: 7,
      fee: 350,
      qual: 'MS ENT',
    },
  ];

  const doctorTokens = {}; // email → { token, doctorId }

  for (const d of doctors) {
    console.log(`\n   👤 Processing: ${d.name} (${d.spec})`);

    // Signup
    const signupRes = await api('POST', '/auth/signup', {
      full_name: d.name,
      email: d.email,
      password: d.pass,
      role: 'DOCTOR',
    });

    if (signupRes.ok) {
      console.log(`      ✅ Signup OK`);
    } else {
      console.log(`      ⚠️  Signup skipped (may already exist)`);
    }

    // Signin
    const signinRes = await api('POST', '/auth/signin', {
      email: d.email,
      password: d.pass,
    });
    const token = signinRes.data?.accessToken;

    if (!token) {
      console.error(`      ❌ No token for ${d.name} — skipping`);
      continue;
    }
    console.log(`      ✅ Signin OK`);

    // Get doctor profile
    const profRes = await api('GET', '/doctors/me', null, token);
    const doctorId = profRes.data?.id;

    if (!doctorId) {
      console.error(`      ❌ No doctorId for ${d.name} — skipping`);
      continue;
    }

    doctorTokens[d.email] = { token, doctorId };

    // Update doctor profile
    const specId = specMap[d.spec];
    if (specId) {
      await api('PUT', `/doctors/${doctorId}/profile`, {
        experience_years: d.exp,
        consultation_fee: d.fee,
        qualification: d.qual,
        specializationId: specId,
      }, token);
      console.log(`      ✅ Profile updated (${d.spec}, ${d.exp}yr, ₹${d.fee})`);
    } else {
      console.log(`      ⚠️  Specialization "${d.spec}" not found — profile not fully updated`);
    }
  }

  // =========================================================
  // 3. DOCTOR AVAILABILITY (WAVE + STREAM for all doctors)
  // =========================================================
  console.log('\n\n📅 Step 3: Creating Doctor Availability...');

  // --- AVAILABILITY CONFIGURATIONS ---
  // Some doctors use WAVE (multiple patients per slot), some use STREAM (1:1)
  const availabilityConfigs = {
    // Dr. Sarah Johnson → WAVE scheduling (Cardiology, busy doctor)
    'sarah@example.com': {
      recurring: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        schedule_type: 'WAVE',
        start_time: '09:00:00',
        end_time: '17:00:00',
        interval_minutes: 30,
        capacity: 3,
      },
      custom: [
        // Saturday special clinic (STREAM)
        {
          daysAhead: (() => {
            // Find next Saturday
            const today = new Date();
            const day = today.getDay();
            return (6 - day + 7) % 7 || 7;
          })(),
          schedule_type: 'STREAM',
          start_time: '10:00:00',
          end_time: '14:00:00',
          interval_minutes: 20,
          capacity: 1,
        },
      ],
    },
    // Dr. Michael Chen → STREAM scheduling (Neuro consultations are 1:1)
    'michael@example.com': {
      recurring: {
        days: ['Monday', 'Wednesday', 'Friday'],
        schedule_type: 'STREAM',
        start_time: '10:00:00',
        end_time: '16:00:00',
        interval_minutes: 30,
        capacity: 1,
      },
      custom: [],
    },
    // Dr. Emily Davis → WAVE (General Medicine, high volume)
    'emily@example.com': {
      recurring: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        schedule_type: 'WAVE',
        start_time: '08:00:00',
        end_time: '18:00:00',
        interval_minutes: 20,
        capacity: 4,
      },
      custom: [],
    },
    // Dr. Robert Smith → STREAM (Orthopedic consultations need time)
    'robert@example.com': {
      recurring: {
        days: ['Tuesday', 'Thursday'],
        schedule_type: 'STREAM',
        start_time: '09:00:00',
        end_time: '15:00:00',
        interval_minutes: 30,
        capacity: 1,
      },
      custom: [],
    },
    // Dr. Linda Taylor → WAVE (Pediatrics, multiple kids per slot)
    'linda@example.com': {
      recurring: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        schedule_type: 'WAVE',
        start_time: '09:00:00',
        end_time: '16:00:00',
        interval_minutes: 30,
        capacity: 3,
      },
      custom: [],
    },
    // Dr. James Wilson → STREAM (Dermatology, detailed consult)
    'james@example.com': {
      recurring: {
        days: ['Monday', 'Wednesday', 'Friday'],
        schedule_type: 'STREAM',
        start_time: '10:00:00',
        end_time: '16:00:00',
        interval_minutes: 20,
        capacity: 1,
      },
      custom: [],
    },
    // Dr. Priya Patel → WAVE (Ophthalmology)
    'priya@example.com': {
      recurring: {
        days: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
        schedule_type: 'WAVE',
        start_time: '09:00:00',
        end_time: '17:00:00',
        interval_minutes: 30,
        capacity: 2,
      },
      custom: [],
    },
    // Dr. Ahmed Khan → WAVE (ENT, moderate capacity)
    'ahmed@example.com': {
      recurring: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        schedule_type: 'WAVE',
        start_time: '10:00:00',
        end_time: '18:00:00',
        interval_minutes: 30,
        capacity: 2,
      },
      custom: [],
    },
  };

  for (const [email, config] of Object.entries(availabilityConfigs)) {
    const info = doctorTokens[email];
    if (!info) {
      console.log(`   ⚠️  Skipping availability for ${email} — no token`);
      continue;
    }

    const { token, doctorId } = info;
    const docName = doctors.find(d => d.email === email)?.name;
    console.log(`\n   📆 ${docName} (${config.recurring.schedule_type})`);

    // -- Recurring availability --
    for (const day of config.recurring.days) {
      const res = await api('POST', `/doctor-availability/recurring/${doctorId}`, {
        day_of_week: day,
        start_time: config.recurring.start_time,
        end_time: config.recurring.end_time,
        schedule_type: config.recurring.schedule_type,
        interval_minutes: config.recurring.interval_minutes,
        capacity: config.recurring.capacity,
        is_available: true,
      }, token);

      if (res.ok) {
        console.log(`      ✅ ${day}: ${config.recurring.start_time}-${config.recurring.end_time} (${config.recurring.schedule_type}, capacity=${config.recurring.capacity})`);
      } else {
        console.log(`      ⚠️  ${day}: skipped (may already exist)`);
      }
    }

    // -- Custom date availability (e.g., special Saturday) --
    for (const custom of config.custom) {
      const date = getFutureDate(custom.daysAhead);
      const res = await api('POST', `/doctor-availability/custom/${doctorId}`, {
        date,
        start_time: custom.start_time,
        end_time: custom.end_time,
        schedule_type: custom.schedule_type,
        interval_minutes: custom.interval_minutes,
        capacity: custom.capacity,
        is_available: true,
      }, token);

      if (res.ok) {
        console.log(`      ✅ Custom ${date}: ${custom.start_time}-${custom.end_time} (${custom.schedule_type})`);
      } else {
        console.log(`      ⚠️  Custom ${date}: skipped (may already exist)`);
      }
    }
  }

  // =========================================================
  // 4. PATIENTS (3 test patients)
  // =========================================================
  console.log('\n\n🧑 Step 4: Creating Test Patients...');
  const patients = [
    { name: 'John Patient', email: 'john@patient.com', pass: 'password123' },
    { name: 'Jane Doe', email: 'jane@patient.com', pass: 'password123' },
    { name: 'Rahul Kumar', email: 'rahul@patient.com', pass: 'password123' },
  ];

  const patientTokens = {};

  for (const p of patients) {
    const signupRes = await api('POST', '/auth/signup', {
      full_name: p.name,
      email: p.email,
      password: p.pass,
      role: 'PATIENT',
    });
    if (signupRes.ok) {
      console.log(`   ✅ Signed up: ${p.name}`);
    } else {
      console.log(`   ⚠️  ${p.name} (may already exist)`);
    }

    const signinRes = await api('POST', '/auth/signin', {
      email: p.email,
      password: p.pass,
    });
    const token = signinRes.data?.accessToken;
    if (token) {
      patientTokens[p.email] = token;
      console.log(`   ✅ Signed in: ${p.name}`);
    } else {
      console.log(`   ❌ Could not sign in: ${p.name}`);
    }
  }

  // =========================================================
  // 5. TEST APPOINTMENTS
  // =========================================================
  console.log('\n\n📋 Step 5: Booking Test Appointments...');

  // Fetch all doctors to get IDs
  const allDocsRes = await api('GET', '/doctors');
  const allDocs = allDocsRes.data || [];

  if (allDocs.length === 0) {
    console.log('   ❌ No doctors found — cannot book appointments');
  } else {
    // Find the next weekday for reliable booking
    const findNextWeekday = () => {
      for (let i = 1; i <= 7; i++) {
        const date = getFutureDate(i);
        const day = new Date(date).getDay();
        if (day >= 1 && day <= 5) return date; // Mon-Fri
      }
      return getFutureDate(1);
    };

    const bookingDate = findNextWeekday();
    const bookingDay = getDayName(bookingDate);
    console.log(`   📅 Booking date: ${bookingDate} (${bookingDay})\n`);

    // Helper to find doctor by email
    const findDoc = (email) => allDocs.find(d => d.user?.email === email);

    // --- Booking 1: John → Dr. Sarah (WAVE) ---
    const sarahDoc = findDoc('sarah@example.com');
    if (sarahDoc && patientTokens['john@patient.com']) {
      const res = await api('POST', '/appointments/book', {
        doctorId: sarahDoc.id,
        appointment_date: bookingDate,
        start_time: '10:00:00',
        end_time: '10:30:00',
      }, patientTokens['john@patient.com']);

      if (res.ok) {
        console.log(`   ✅ John → Dr. Sarah (WAVE slot 10:00-10:30) Token: ${res.data?.token_number}`);
      } else {
        console.log(`   ⚠️  John → Dr. Sarah: ${res.data?.message || 'failed'}`);
      }
    }

    // --- Booking 2: Jane → Dr. Sarah (WAVE - same slot, tests capacity) ---
    if (sarahDoc && patientTokens['jane@patient.com']) {
      const res = await api('POST', '/appointments/book', {
        doctorId: sarahDoc.id,
        appointment_date: bookingDate,
        start_time: '10:00:00',
        end_time: '10:30:00',
      }, patientTokens['jane@patient.com']);

      if (res.ok) {
        console.log(`   ✅ Jane → Dr. Sarah (WAVE same slot 10:00-10:30) Token: ${res.data?.token_number} — WAVE capacity test passed!`);
      } else {
        console.log(`   ⚠️  Jane → Dr. Sarah: ${res.data?.message || 'failed'}`);
      }
    }

    // --- Booking 3: Rahul → Dr. Sarah (WAVE - same slot, 3rd patient) ---
    if (sarahDoc && patientTokens['rahul@patient.com']) {
      const res = await api('POST', '/appointments/book', {
        doctorId: sarahDoc.id,
        appointment_date: bookingDate,
        start_time: '10:00:00',
        end_time: '10:30:00',
      }, patientTokens['rahul@patient.com']);

      if (res.ok) {
        console.log(`   ✅ Rahul → Dr. Sarah (WAVE 3rd patient) Token: ${res.data?.token_number} — Full capacity test!`);
      } else {
        console.log(`   ⚠️  Rahul → Dr. Sarah: ${res.data?.message || 'failed'}`);
      }
    }

    // --- Booking 4: John → Dr. Michael (STREAM - should only allow 1) ---
    const michaelDoc = findDoc('michael@example.com');
    // Only book if bookingDay is Mon/Wed/Fri (Michael's available days)
    const michaelDays = ['Monday', 'Wednesday', 'Friday'];
    if (michaelDoc && patientTokens['john@patient.com'] && michaelDays.includes(bookingDay)) {
      const res = await api('POST', '/appointments/book', {
        doctorId: michaelDoc.id,
        appointment_date: bookingDate,
        start_time: '10:00:00',
        end_time: '10:30:00',
      }, patientTokens['john@patient.com']);

      if (res.ok) {
        console.log(`   ✅ John → Dr. Michael (STREAM slot 10:00-10:30) Token: ${res.data?.token_number}`);
      } else {
        console.log(`   ⚠️  John → Dr. Michael: ${res.data?.message || 'failed'}`);
      }

      // Try Jane in same slot — should FAIL for STREAM
      const res2 = await api('POST', '/appointments/book', {
        doctorId: michaelDoc.id,
        appointment_date: bookingDate,
        start_time: '10:00:00',
        end_time: '10:30:00',
      }, patientTokens['jane@patient.com']);

      if (!res2.ok) {
        console.log(`   ✅ Jane → Dr. Michael (STREAM same slot) — CORRECTLY REJECTED! (${res2.data?.message})`);
      } else {
        console.log(`   ⚠️  Jane → Dr. Michael: Should have been rejected for STREAM!`);
      }

      // Jane books DIFFERENT slot — should work
      const res3 = await api('POST', '/appointments/book', {
        doctorId: michaelDoc.id,
        appointment_date: bookingDate,
        start_time: '11:00:00',
        end_time: '11:30:00',
      }, patientTokens['jane@patient.com']);

      if (res3.ok) {
        console.log(`   ✅ Jane → Dr. Michael (STREAM different slot 11:00-11:30) Token: ${res3.data?.token_number}`);
      } else {
        console.log(`   ⚠️  Jane → Dr. Michael different slot: ${res3.data?.message || 'failed'}`);
      }
    } else if (michaelDoc) {
      console.log(`   ℹ️  Dr. Michael not available on ${bookingDay} — skipping STREAM test`);
    }

    // --- Booking 5: Jane → Dr. Emily (WAVE - General Medicine) ---
    const emilyDoc = findDoc('emily@example.com');
    if (emilyDoc && patientTokens['jane@patient.com']) {
      const res = await api('POST', '/appointments/book', {
        doctorId: emilyDoc.id,
        appointment_date: bookingDate,
        start_time: '09:00:00',
        end_time: '09:20:00',
      }, patientTokens['jane@patient.com']);

      if (res.ok) {
        console.log(`   ✅ Jane → Dr. Emily (WAVE 09:00-09:20) Token: ${res.data?.token_number}`);
      } else {
        console.log(`   ⚠️  Jane → Dr. Emily: ${res.data?.message || 'failed'}`);
      }
    }

    // --- Booking 6: Rahul → Dr. Linda (Pediatrics WAVE) ---
    const lindaDoc = findDoc('linda@example.com');
    if (lindaDoc && patientTokens['rahul@patient.com']) {
      const res = await api('POST', '/appointments/book', {
        doctorId: lindaDoc.id,
        appointment_date: bookingDate,
        start_time: '14:00:00',
        end_time: '14:30:00',
      }, patientTokens['rahul@patient.com']);

      if (res.ok) {
        console.log(`   ✅ Rahul → Dr. Linda (WAVE 14:00-14:30) Token: ${res.data?.token_number}`);
      } else {
        console.log(`   ⚠️  Rahul → Dr. Linda: ${res.data?.message || 'failed'}`);
      }
    }
  }

  // =========================================================
  // SUMMARY
  // =========================================================
  console.log('\n' + '='.repeat(60));
  console.log('✅ SEEDING COMPLETE!');
  console.log('='.repeat(60));
  console.log('\n📊 Test Accounts:');
  console.log('─'.repeat(50));
  console.log('   DOCTORS (password: password123):');
  for (const d of doctors) {
    console.log(`     • ${d.name} — ${d.email} (${d.spec})`);
  }
  console.log('\n   PATIENTS (password: password123):');
  for (const p of patients) {
    console.log(`     • ${p.name} — ${p.email}`);
  }
  console.log('\n📋 Schedule Types Seeded:');
  console.log('   • WAVE (multiple patients per slot): Dr. Sarah, Dr. Emily, Dr. Linda, Dr. Priya, Dr. Ahmed');
  console.log('   • STREAM (1 patient per slot): Dr. Michael, Dr. Robert, Dr. James');
  console.log('\n');
}

seed().catch(console.error);
