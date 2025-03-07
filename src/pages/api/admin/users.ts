import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "GET") {
    const users = await prisma.user.findMany();
    return res.json(users);
  }

  res.status(405).json({ error: "Method not allowed" });
}
