
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

const resend = apiKey ? new Resend(apiKey) : null;

export default resend;
