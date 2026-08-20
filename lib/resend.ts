import { Resend } from "resend";

let _resend: Resend | undefined;

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = "Reputation Dashboard <alerts@reputationdashboard.app>";

export async function sendEmail(params: { to: string; subject: string; html: string }) {
  await getResend().emails.send({ from: FROM, to: params.to, subject: params.subject, html: params.html });
}
