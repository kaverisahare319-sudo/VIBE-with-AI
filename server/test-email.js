const nodemailer = require('nodemailer');

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'sakshicharlewar4@gmail.com',
      pass: 'ejnl xuus iabs dsnz'
    },
    debug: true, // show debug output
    logger: true // log information in console
  });

  try {
    const info = await transporter.sendMail({
      from: 'sakshicharlewar4@gmail.com', // sender address
      to: 'sakshicharlewar@gmail.com', // list of receivers
      subject: 'Test Email from Nodemailer', // Subject line
      text: 'Hello world! This is a test from the MockMate backend.', // plain text body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

testEmail();
