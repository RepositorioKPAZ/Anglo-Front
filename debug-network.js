require('dotenv').config({ path: '.env.local' });
const dns = require('dns');
const net = require('net');

const dbHost = process.env.DB_HOST;
const dbPort = parseInt(process.env.DB_PORT || '3306');

console.log('🔍 Network Debugging for Database Connection');
console.log('Host:', dbHost);
console.log('Port:', dbPort);
console.log('');

// Step 1: DNS Resolution Test
console.log('1. Testing DNS resolution...');
dns.lookup(dbHost, (err, address, family) => {
  if (err) {
    console.log('❌ DNS resolution failed:', err.message);
    if (err.code === 'ENOTFOUND') {
      console.log('   The hostname could not be resolved.');
      console.log('   Check if DB_HOST is correct in .env.local');
    }
  } else {
    console.log('✅ DNS resolution successful');
    console.log('   IP Address:', address);
    console.log('   Family:', family === 4 ? 'IPv4' : 'IPv6');
  }
  
  // Step 2: Port Connectivity Test
  console.log('\n2. Testing port connectivity...');
  
  const socket = new net.Socket();
  socket.setTimeout(10000); // 10 second timeout
  
  socket.on('connect', () => {
    console.log('✅ Port connection successful!');
    console.log('   Database server is reachable on', dbHost + ':' + dbPort);
    socket.destroy();
  });
  
  socket.on('timeout', () => {
    console.log('❌ Port connection timeout');
    console.log('   Possible issues:');
    console.log('   - Firewall blocking the connection');
    console.log('   - Database server is down');
    console.log('   - Incorrect port number');
    console.log('   - Network connectivity issues');
    socket.destroy();
  });
  
  socket.on('error', (err) => {
    console.log('❌ Port connection failed:', err.message);
    
    if (err.code === 'ECONNREFUSED') {
      console.log('   The connection was refused by the server.');
      console.log('   The database server might not be running.');
    } else if (err.code === 'ETIMEDOUT') {
      console.log('   The connection timed out.');
      console.log('   Check firewall settings and network connectivity.');
    } else if (err.code === 'EHOSTUNREACH') {
      console.log('   The host is unreachable.');
      console.log('   Check your network connection and routing.');
    }
    
    socket.destroy();
  });
  
  try {
    socket.connect(dbPort, address || dbHost);
  } catch (error) {
    console.log('❌ Failed to initiate connection:', error.message);
  }
});

// Step 3: Additional Network Info
console.log('\n3. Additional network information:');

// Check if we're behind a proxy or VPN
const proxyVars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy'];
const activeProxies = proxyVars.filter(v => process.env[v]);

if (activeProxies.length > 0) {
  console.log('⚠️  Proxy detected:', activeProxies.map(v => `${v}=${process.env[v]}`));
  console.log('   This might affect database connectivity.');
} else {
  console.log('ℹ️  No proxy environment variables detected.');
} 