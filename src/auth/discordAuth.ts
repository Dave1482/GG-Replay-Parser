import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function handleDiscordAuth(discordUser: any) {
  try {
    console.log(
      "Attempting to create/update user with Discord ID:",
      discordUser.id,
    );

    const user = await prisma.user.upsert({
      where: {
        discordId: discordUser.id,
      },
      update: {
        username: discordUser.username,
        avatarUrl: discordUser.avatar
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : null,
      },
      create: {
        discordId: discordUser.id,
        username: discordUser.username,
        avatarUrl: discordUser.avatar
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : null,
      },
    });

    console.log("User created/updated successfully:", user);
    return user;
  } catch (error) {
    console.error("Error in handleDiscordAuth:", error);
    throw error;
  }
}
