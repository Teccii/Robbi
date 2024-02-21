import {
  IntentsBitField,
  Partials,
  PermissionFlagsBits,
  Role,
} from "discord.js";
import { error, warning } from "lib/log";
import CustomClient from "lib/client";
import ClientConfig from "lib/config";
import mongoose from "mongoose";

require("dotenv").config();

if (!process.env.token) {
  warning("No bot token was found in .env");
  process.exit(1);
}

if (!process.env.mongo) {
  warning("No MongoDB url was found in .env");
  process.exit(1);
}

if (!process.env.owner) {
  warning("No owner ID was found in .env");
  process.exit(1);
}

const ownerId = process.env.owner!;

const config: ClientConfig = {
  ownerId: ownerId,
  embedColors: {
    neutral: "#FFAAD4",
    success: "#66FF00",
    warning: "#FFDD32",
    error: "#FF3232",
  },
  permLevels: [
    {
      name: "User",
      level: 0,
      check: () => true,
    },
    {
      name: "Helper",
      level: 1,
      check: (member) => {
        let helperRole: Role | null;

        if (member && member.guild) {
          helperRole = member.guild.roles.resolve(
            member.settings.staffRoles.helper
          );
        } else {
          return false;
        }

        return Boolean(
          helperRole && member && member.roles.cache.has(helperRole.id)
        );
      },
    },
    {
      name: "Moderator",
      level: 2,
      check: (member) => {
        let modRole: Role | null;

        if (member && member.guild) {
          modRole = member.guild.roles.resolve(
            member.settings.staffRoles.moderator
          );
        } else {
          return false;
        }

        return Boolean(modRole && member && member.roles.cache.has(modRole.id));
      },
    },
    {
      name: "Administrator",
      level: 3,
      check: (member) => {
        let adminRole: Role | null;

        if (member && member.guild) {
          adminRole = member.guild.roles.resolve(
            member.settings.staffRoles.admin
          );
        } else {
          return false;
        }

        return Boolean(
          (member &&
            member.permissions.has(PermissionFlagsBits.Administrator)) ||
            (adminRole && member && member.roles.cache.has(adminRole.id))
        );
      },
    },
    {
      name: "Server Owner",
      level: 4,
      check: (member) => {
        return Boolean(member && member.guild.ownerId == member.id);
      },
    },
    {
      name: "Bot Owner",
      level: 10,
      check: (member) => {
        return Boolean(member && member.id == ownerId);
      },
    },
  ],
};

const client = new CustomClient(config, {
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.Reaction,
    Partials.User,
  ],
  intents: [
    IntentsBitField.Flags.DirectMessages,
    IntentsBitField.Flags.DirectMessageReactions,
    IntentsBitField.Flags.DirectMessageTyping,
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildEmojisAndStickers,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildIntegrations,
    IntentsBitField.Flags.MessageContent,
  ],
});

const run = async () => {
  await mongoose.connect(process.env.mongo!, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
  }).catch((e) => {
    error(`Caught an error while trying to connect to MongoDB: ${e}`);
    process.exit(1);
  });

  client.loadCommands();
  client.loadEvents();

  try {
    client.login(process.env.token!);
  } catch (e) {
    error(`Caught an error while trying to login to the bot: ${e}`);
    process.exit(1);
  }
};

export default run();
