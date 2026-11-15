import type { ContactGateway } from "./application/ports/contact-gateway";
import { HttpContactGateway } from "./infrastructure/client/http-contact-gateway";

export const contactGateway: ContactGateway = new HttpContactGateway();
