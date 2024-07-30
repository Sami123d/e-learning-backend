import mailgun from "mailgun-js";
import dotenv from "dotenv";

dotenv.config();

const mg = mailgun({
  apiKey: process.env.MAILGUN_API,
  domain: process.env.MAILGUN_DOMAIN,
});

const sendMail = (to, subject, text) => {
  const data = {
    from: "muhammaduzair25k@gmail.com", // Replace with your verified sender email
    to,
    subject,
    text,
  };

  return mg.messages().send(data);
};

export default sendMail;
