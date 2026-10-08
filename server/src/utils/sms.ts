import twilio from 'twilio';

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
};

export const sendSMS = async (to: string, body: string) => {
  const client = getTwilioClient();
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!client || !fromPhone) {
    console.warn('\n[WARNING]: Twilio credentials missing in .env. Falling back to console logging.');
    console.log(`\n--- MOCK SMS TO: ${to} ---\n${body}\n---------------------------\n`);
    return;
  }

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
  }
};

export const requestTwilioVerify = async (to: string) => {
  const client = getTwilioClient();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!client || !verifyServiceSid) {
    console.warn('\n[WARNING]: Twilio Verify Service SID missing. Falling back to mock local OTP.');
    return false; // Indicating it didn't use Twilio Verify
  }

  try {
    console.log(`\n--- ATTEMPTING TWILIO VERIFY TO: ${to} ---`);
    await client.verify.v2.services(verifyServiceSid).verifications.create({ to, channel: 'sms' });
    return true; // Successfully requested
  } catch (error: any) {
    console.error('\n[TWILIO VERIFY ERROR]: Failed to request Verify OTP.', error.message);
    throw new Error('Failed to send OTP via Twilio Verify. ' + error.message);
  }
};

export const checkTwilioVerify = async (to: string, code: string) => {
  const client = getTwilioClient();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!client || !verifyServiceSid) {
    return false; // Not using Twilio Verify
  }

  try {
    const verification = await client.verify.v2.services(verifyServiceSid).verificationChecks.create({ to, code });
    return verification.status === 'approved';
  } catch (error: any) {
    console.error('\n[TWILIO VERIFY ERROR]: Failed to check Verify OTP.', error.message);
    return false;
  }
};
