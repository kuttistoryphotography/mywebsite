
import { Resend } from "resend";

const resend = {
  emails: {
    send: (...args: Parameters<Resend["emails"]["send"]>) => {
      const apiKey = process.env.RESEND_API_KEY;

      if (!apiKey) {
        throw new Error("RESEND_API_KEY is not configured");
      }

      // Initialize Resend only when an email is actually sent.
      const client = new Resend(apiKey);

      return client.emails.send(...args);
    },
  },
};

export default resend;
