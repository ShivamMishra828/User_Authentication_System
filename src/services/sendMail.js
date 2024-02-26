import transporter from "../config/nodemailer.js";

const sendMail = async (senderInfo, receiverInfo, subject, body) => {
  try {
    const info = await transporter.sendMail({
      from: senderInfo,
      to: receiverInfo,
      subject: subject,
      html: body,
    });

    console.log(`Mail Send to User Successfully:- ${info.response}`);
    return info;
  } catch (error) {
    console.log(`Error Occured while Sending Mail:- ${error.message}`);
  }
};

export default sendMail;
