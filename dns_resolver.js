const dns = require('dns');

// Force using Google Public DNS
dns.setServers(['8.8.8.8', '1.1.1.1']);

console.log('🔍 Querying Google & Cloudflare DNS for db.exdfaufrrleadzsotujh.supabase.co...');

dns.resolve4('db.exdfaufrrleadzsotujh.supabase.co', (err, addresses) => {
  if (err) {
    console.error('❌ DNS Resolution failed even on Google DNS:', err.message);
  } else {
    console.log('✅ Success! IP Address(es) found:', addresses);
  }
});
