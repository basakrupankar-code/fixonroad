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

  console.log(`\n--- ATTEMPTING TO SEND SMS TO: ${to} ---\n${body}\n----------------------------------\n`);

  try {
    await client.messages.create({
      body,
      from: fromPhone,
      to,
    });
  } catch (error: any) {
    console.error('\n[TWILIO ERROR]: Failed to send SMS. This is usually because Trial Accounts cannot send custom messages to India without predefined templates.');
    console.error(`Error details: ${error.message}\n`);
    console.log(`Please use the OTP printed above to continue testing!`);
    // We don't throw the error so the app flow can continue for testing purposes.
  }
};
