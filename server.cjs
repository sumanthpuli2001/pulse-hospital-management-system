const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5173;
const BACKEND_PORT = process.env.BACKEND_PORT || 8085;
const BACKEND_HOST = process.env.BACKEND_HOST || '127.0.0.1';
const DIST_DIR = path.join(__dirname, 'frontend', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// Fallback Mock Data for Cloud Deployments (when Spring Boot backend is not hosted)
const DEMO_USERS = {
  superadmin: {
    userId: 1,
    username: 'superadmin',
    email: 'superadmin@hospital.com',
    firstName: 'System',
    lastName: 'SuperAdmin',
    roles: ['ROLE_SUPER_ADMIN'],
  },
  admin: {
    userId: 2,
    username: 'admin',
    email: 'admin@hospital.com',
    firstName: 'Hospital',
    lastName: 'Administrator',
    roles: ['ROLE_HOSPITAL_ADMIN'],
  },
  'dr.rajesh': {
    userId: 3,
    username: 'dr.rajesh',
    email: 'rajesh.sharma@hospital.com',
    firstName: 'Dr. Rajesh',
    lastName: 'Sharma',
    roles: ['ROLE_DOCTOR'],
    department: 'Cardiology',
  },
  nurse: {
    userId: 4,
    username: 'nurse',
    email: 'deepa.nair@hospital.com',
    firstName: 'Sister Deepa',
    lastName: 'Nair',
    roles: ['ROLE_NURSE'],
    department: 'ICU',
  },
  accountant: {
    userId: 5,
    username: 'accountant',
    email: 'accounts@hospital.com',
    firstName: 'Ramesh',
    lastName: 'Kumar',
    roles: ['ROLE_ACCOUNTANT'],
    department: 'Billing & Finance',
  },
};

const MOCK_DEPARTMENTS = [
  { id: 2, name: 'Cardiology', code: 'CARD', description: 'Cardiovascular diagnosis and heart care', active: true },
  { id: 3, name: 'Orthopedics', code: 'ORTH', description: 'Musculoskeletal and bone surgery', active: true },
  { id: 4, name: 'Pediatrics', code: 'PED', description: 'Infant and child healthcare', active: true },
  { id: 5, name: 'Neurology', code: 'NEUR', description: 'Brain and neurological system care', active: true },
  { id: 6, name: 'Emergency & Trauma', code: 'EMRG', description: '24/7 acute trauma and emergency resuscitation', active: true },
  { id: 8, name: 'Radiology', code: 'CT/MRI', description: 'X-Ray & Digital Radiography, MRI/CT diagnostics', active: true },
];

const MOCK_CENSUS = {
  totalPatients: 1420,
  totalDoctors: 48,
  availableDoctors: 42,
  todayAppointments: 65,
  activeInpatients: 184,
  totalBeds: 220,
  occupiedBeds: 184,
  bedOccupancyPercentage: 83.6,
  pendingLabOrders: 14,
  lowStockMedicines: 3,
  todayRevenue: 245000.0,
  totalOutstandingBalance: 42500.0,
};

function handleMockFallback(req, res, pathname, requestBody) {
  res.setHeader('Content-Type', 'application/json');

  // Handle Login
  if (pathname.includes('/auth/login') && req.method === 'POST') {
    try {
      const parsed = JSON.parse(requestBody || '{}');
      const u = (parsed.usernameOrEmail || '').toLowerCase();
      const user = DEMO_USERS[u] || DEMO_USERS['admin'];

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: 'Login successful',
        data: {
          accessToken: 'demo_jwt_token_pulse_hms_' + Buffer.from(JSON.stringify(user)).toString('base64'),
          refreshToken: 'demo_refresh_token_' + Date.now(),
          tokenType: 'Bearer',
          expiresIn: 900,
          userId: user.userId,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
        },
        timestamp: new Date().toISOString(),
      }));
      return;
    } catch (e) {
      // fallback
    }
  }

  // Handle Census Report
  if (pathname.includes('/reports/census')) {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      message: 'Hospital operational census retrieved',
      data: MOCK_CENSUS,
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // Handle Departments
  if (pathname.includes('/departments')) {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      message: 'Departments retrieved',
      data: MOCK_DEPARTMENTS,
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // Generic fallback for any other API
  res.writeHead(200);
  res.end(JSON.stringify({
    success: true,
    message: 'Operation processed successfully',
    data: { content: [], totalElements: 0, totalPages: 0 },
    timestamp: new Date().toISOString(),
  }));
}

const server = http.createServer((req, res) => {
  // 1. API Reverse Proxy to Spring Boot Backend (Port 8085)
  if (req.url.startsWith('/api')) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    let bodyChunks = [];
    req.on('data', chunk => bodyChunks.push(chunk));
    req.on('end', () => {
      const requestBody = Buffer.concat(bodyChunks);

      const proxyReq = http.request({
        hostname: BACKEND_HOST,
        port: BACKEND_PORT,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: `${BACKEND_HOST}:${BACKEND_PORT}`,
          origin: `http://localhost:${PORT}`,
          referer: `http://localhost:${PORT}/`,
          'content-length': requestBody.length,
        },
        timeout: 4000,
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('timeout', () => {
        proxyReq.destroy(new Error('Backend connection timeout'));
      });

      proxyReq.on('error', (err) => {
        console.warn(`[Proxy Fallback] Spring Boot unreachable (${err.message}). Serving fallback for ${req.url}`);
        handleMockFallback(req, res, pathname, requestBody.toString('utf8'));
      });

      if (requestBody.length > 0) {
        proxyReq.write(requestBody);
      }
      proxyReq.end();
    });

    return;
  }

  // 2. Serve Static Assets or fallback to index.html (SPA Client-Side Routing)
  let cleanUrl = req.url.split('?')[0];
  if (cleanUrl === '/') cleanUrl = '/index.html';

  let filePath = path.join(DIST_DIR, cleanUrl);

  // If file doesn't exist, fallback to index.html for React Router
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Server Error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
    });
    res.end(content);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`PULSE HMS Production Server running on port ${PORT}`);
  console.log(`Serving static files from: ${DIST_DIR}`);
  console.log(`Proxying /api to http://${BACKEND_HOST}:${BACKEND_PORT}`);
});
