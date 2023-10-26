const nodemailer = require('nodemailer');

const sendMail =async (options) => {
  //1) create transporter
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USERNAME , // generated ethereal user
      pass: process.env.EMAIL_PASSWORD // generated ethereal password
    }
  });
  //2) define the email options
  const mailOptions = {
    from: 'sabreen ahmed <hello@sabreen.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };
  //3) send the email
  await transport.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent: %s', info.messageId);
  });
}
module.exports = sendMail;