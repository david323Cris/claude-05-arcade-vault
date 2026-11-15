import { ApiError, httpRequest } from "@/shared/infrastructure/http/http-client";
import type { ContactGateway, ContactSubmitResult } from "../../application/ports/contact-gateway";
import type { ContactMessageInput } from "../../domain/contact-message";

export class HttpContactGateway implements ContactGateway {
  async submit(input: ContactMessageInput): Promise<ContactSubmitResult> {
    try {
      await httpRequest("/api/contact", { method: "POST", body: input });
      return { ok: true };
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) return { ok: false, reason: "invalid" };
      return { ok: false, reason: "failed" };
    }
  }
}
