import type { EmailSender, OutgoingEmail } from "../application/ports/email-sender";

export class InMemoryEmailSender implements EmailSender {
  readonly sent: OutgoingEmail[] = [];

  constructor(private readonly failWith?: Error) {}

  async send(email: OutgoingEmail): Promise<void> {
    if (this.failWith) throw this.failWith;
    this.sent.push(email);
  }
}
