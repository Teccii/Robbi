import { IntentsBitField, Partials } from "discord.js";
import { error, warning } from "lib/log";
import CustomClient from "lib/client";
import ClientConfig from "lib/config";
import mongoose from "mongoose";

require('dotenv').config();

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
    }
};

const client = new CustomClient(
    config,
    {
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
        ]
    }
);

const run = async () => {
    await mongoose.connect(process.env.mongo!, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    }).catch(e => {
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