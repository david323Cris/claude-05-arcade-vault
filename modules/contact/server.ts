import "server-only";

export { sendContactMessage } from "./composition.server";
export type {
  ContactMessageInput,
  ContactValidationError,
} from "./domain/contact-message";
