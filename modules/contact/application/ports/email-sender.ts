export interface OutgoingEmail {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailSender {
  /** Lanza si el envío falla. */
  send(email: OutgoingEmail): Promise<void>;
}
