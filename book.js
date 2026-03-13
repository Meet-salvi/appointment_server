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

async function bookAppointments() {
  console.log('Starting Bookings...');
  
  // 3. Create a Patient
  await api('POST', '/auth/signup', { full_name: 'Jane Patient', email: 'jane@patient.com', password: 'password123', role: 'PATIENT' });
  const pRes = await api('POST', '/auth/signin', { email: 'jane@patient.com', password: 'password123' });
  const pToken = pRes.data?.accessToken;
  
  // Fetch doctors to book
  const allDocs = await api('GET', '/doctors');
  if(pToken && allDocs.data && allDocs.data.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      
      // Let's book with the newly added Dr. Sarah Johnson if possible
      const doc = allDocs.data.find(d => d.user.email === 'sarah@example.com') || allDocs.data[0];
      
      await api('POST', '/appointments/book', {
          doctorId: doc.id,
          appointment_date: today,
          start_time: '10:00:00',
          end_time: '10:30:00'
      }, pToken);

      // Create another patient and book with same doctor to test wave capacity
      await api('POST', '/auth/signup', { full_name: 'Mark Patient', email: 'mark@patient.com', password: 'password123', role: 'PATIENT' });
      const pRes2 = await api('POST', '/auth/signin', { email: 'mark@patient.com', password: 'password123' });
      
      await api('POST', '/appointments/book', {
          doctorId: doc.id,
          appointment_date: today,
          start_time: '10:00:00', // same slot for WAVE
          end_time: '10:30:00'
      }, pRes2.data.accessToken);

      console.log('Successfully booked test appointments for WAVE scheduling logic');
  }

  console.log('Booking COMPLETE');
}

bookAppointments().catch(console.error);
