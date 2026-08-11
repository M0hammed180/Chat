const nodemailer = require("nodemailer");
const { config } = require("dotenv");
config()
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.email,
    pass: process.env.password,
  },
});

 const sendEmail = async ({ to, subject, html }) => {
  try {
    const mail = await transporter.sendMail({
      from: "Online App <mohammed2006tarek@gmail.com>",
      to,
      subject,
      html,
    });

    console.log("message send:" + mail.messageId);
  } catch (error) {
    console.log("sendError:" + error);
  }
};
module.exports = { sendEmail };