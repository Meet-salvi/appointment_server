const fs = require('fs');

async function api(method, endpoint, data = null, token = null) {
  const url = `http://localhost:3000/api/v1${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  
  const text = await res.text();
  let json = {};
  try { json = JSON.parse(text); } catch(e) {}
  
  if (!res.ok) {
     console.error(`ERROR on ${method} ${endpoint}:`, json || text);
  }
  return { data: json, status: res.status };
}

async function seed() {
  console.log('Starting DB Seed...');
  
  // 1. Create specializations
  const specs = ['Cardiology', 'Neurology', 'General', 'Orthopedics', 'Pediatrics'];
  const specMap = {};
  for (let s of specs) {
     await api('POST', '/specializations', { name: s });
  }
  
  const specsRes = await api('GET', '/specializations');
  for(let s of specsRes.data) {
     specMap[s.name] = s.id;
  }

  // 2. Create Doctors
  const doctors = [
     { name: 'Dr. Sarah Johnson', email: 'sarah@example.com', pass: 'password123', spec: 'Cardiology', exp: 12 },
     { name: 'Dr. Michael Chen', email: 'michael@example.com', pass: 'password123', spec: 'Neurology', exp: 8 },
     { name: 'Dr. Emily Davis', email: 'emily@example.com', pass: 'password123', spec: 'General', exp: 4 },
     { name: 'Dr. Robert Smith', email: 'robert@example.com', pass: 'password123', spec: 'Orthopedics', exp: 15 },
     { name: 'Dr. Linda Taylor', email: 'linda@example.com', pass: 'password123', spec: 'Pediatrics', exp: 10 },
  ];

  for (let d of doctors) {
      // Signup
      await api('POST', '/auth/signup', {
          full_name: d.name,
          email: d.email,
          password: d.pass,
          role: 'DOCTOR'
      });
      
      // Signin
      const res = await api('POST', '/auth/signin', { email: d.email, password: d.pass });
      const token = res.data?.accessToken;
      if(!token) { console.error('No token for', d.name); continue; }

      // Get profile
      const profRes = await api('GET', '/doctors/me', null, token);
      const doctorId = profRes.data?.id;
      
      if(!doctorId) continue;

      // Update profile
      await api('PUT', `/doctors/${doctorId}/profile`, {
         experience_years: d.exp,
         consultation_fee: 100,
         qualification: 'MD',
         specializationId: specMap[d.spec]
      }, token);

      // Add Recurring Availability (Monday - Friday)
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      for (let day of days) {
         await api('POST', `/doctor-availability/recurring/${doctorId}`, {
            day_of_week: day,
            start_time: '09:00:00',
            end_time: '17:00:00',
            schedule_type: 'WAVE',
            interval_minutes: 30,
            capacity: 3,
            is_available: true
         }, token);
      }
      
      // Add a custom day with STREAM scheduling for testing elastic stream
      const today = new Date().toISOString().split('T')[0];
      await api('POST', `/doctor-availability/custom/${doctorId}`, {
            date: today,
            start_time: '10:00:00',
            end_time: '14:00:00',
            schedule_type: 'STREAM',
            interval_minutes: 15,
            capacity: 1, // STREAM is usually 1
            is_available: true
      }, token);
      
      console.log(`Successfully seeded ${d.name}`);
  }
  
  // 3. Create a Patient
  await api('POST', '/auth/signup', { full_name: 'John Patient', email: 'john@patient.com', password: 'password123', role: 'PATIENT' });
  const pRes = await api('POST', '/auth/signin', { email: 'john@patient.com', password: 'password123' });
  const pToken = pRes.data?.accessToken;
  
  // Fetch doctors to book
  const allDocs = await api('GET', '/doctors');
  if(pToken && allDocs.data && allDocs.data.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      // Book an appointment (Wait, booking requires patientId implicitly via token)
      await api('POST', '/appointments/book', {
          doctorId: allDocs.data[0].id,
          appointment_date: today,
          start_time: '10:00:00',
          end_time: '10:15:00',
          notes: 'Test booking'
      }, pToken);
      console.log('Successfully booked a test appointment for John Patient with', allDocs.data[0].user?.full_name);
  }

  console.log('Seeding COMPLETE');
}

seed().catch(console.error);
