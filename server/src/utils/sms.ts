import twilio from 'twilio';

export const sendSMS = async (to: string, body: string) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone) {
    console.warn('\n[WARNING]: Twilio credentials missing in .env. Falling back to console logging.');
    console.log(`\n--- MOCK SMS TO: ${to} ---\n${body}\n---------------------------\n`);
    return;
  }

  const client = twilio(accountSid, authToken);

  await client.messages.create({
    body,
    from: fromPhone,
    to,
  });
};
