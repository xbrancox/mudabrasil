// Temporary file to check mailer configuration
const mailer = require('./server/mailer');
console.log('=== MAILER CONFIGURATION DEBUG ===');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_FROM:', process.env.SMTP_FROM);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('IS_DEV:', mailer.IS_DEV);

const transporter = mailer.getTransporter();
if (transporter) {
  console.log('Transporter created successfully');
  console.log('Transporter options:', JSON.stringify(transporter.options, null, 2));
} else {
  console.log('Transporter is null (IS_DEV is true)');
}

// Test connection
if (transporter && !mailer.IS_DEV) {
  transporter.verify()
    .then(() => console.log('SMTP verification: SUCCESS'))
    .catch(err => console.error('SMTP verification: FAILED', err.message));
}