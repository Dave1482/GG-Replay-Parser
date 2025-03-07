import { Role } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      discordId: string;
      email?: string;
      name?: string;
      image?: string;
    };
  }

  interface User {
    id: string;
    role: Role;
    discordId: string;
  }
}
