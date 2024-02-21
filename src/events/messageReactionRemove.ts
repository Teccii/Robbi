import { Events, Message, MessageReaction, User } from "discord.js";
import { SettingsModel } from "models/Settings";
import { log } from "lib/log";
import Event from "lib/event";
import colors from "colors";
import { StarboardMessageModel } from "models/StarboardMessage";
import { getStarboardMessage } from "lib/starboard";

const messageReactionRemove: Event = {
    name: Events.MessageReactionRemove,
    once: false,
    exec: async (client, reaction: MessageReaction, user: User) => {
        const _message = reaction.message;
        let message: Message<boolean>;

        if (_message.partial) {
            message = await _message.fetch();
        } else {
            message = _message;
        }

        if (reaction.me || !message.guild || message.author.bot || user.bot) {
            return;
        }

        /*
        If we don't have a config for this guild,
        we either find it in the database or create an empty one.
        */
        if (!client.settings.has(message.guild.id)) {
            const s = await SettingsModel.findOneAndUpdate(
                { _id: message.guild.id },
                { toUpdate: true },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            );

            log("sync", colors.cyan, `Database -> Client (${message.guild.id})`);

            client.settings.set(message.guild.id, s);
            message.settings = s;
        } else {
            const s = client.settings.get(message.guild.id)!;

            message.settings = s;
        }

        const starboard = message.settings.starboards.find(v => v.emoji == reaction.emoji.toString() || v.emoji.includes(reaction.emoji.id!));

        if (starboard) {
            const channel = await message.guild.channels.fetch(starboard.channel);

            if (channel && !channel.isDMBased() && channel.isTextBased() && channel.id != message.channel.id) {
                const _starboardMessage = await StarboardMessageModel.findOneAndDelete({
                    guildId: message.guild.id,
                    starboardId: starboard.id,
                    originalMessageId: message.id,
                });

                if (_starboardMessage) {
                    const starboardMessage = await channel.messages.fetch(_starboardMessage.starboardMessageId);

                    if (reaction.count < starboard.threshold) {
                        await starboardMessage.delete();
                    } else {
                        const payload = getStarboardMessage(
                            client,
                            message,
                            starboard.emoji,
                            reaction.count
                        );

                        await starboardMessage.edit(payload);
                    }
                }
            }
        }
    }
};

export default messageReactionRemove;