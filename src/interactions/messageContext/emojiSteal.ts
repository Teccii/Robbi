import { ApplicationCommandType, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction } from "discord.js";
import { InteractionCommand } from "lib/command";
import { EmbedColor } from "lib/config";
import { extractEmojis, getEmojiUrl } from "lib/emoji";

const emojiSteal: InteractionCommand = {
    data: new ContextMenuCommandBuilder()
        .setName("Steal Emoji")
        .setType(ApplicationCommandType.Message),
    exec: async (client, interaction) => {
        if (!(interaction instanceof MessageContextMenuCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const emojis = extractEmojis(interaction.targetMessage.content);

        if (emojis) {
            let embeds = [client.simpleEmbed({
                title: `Found ${emojis.length} emoji(s)!`,
                color: EmbedColor.Success,
            }).setImage(getEmojiUrl(emojis[0]))];

            for (const emoji of emojis.slice(1)) {
                const url = getEmojiUrl(emoji);

                if (url) {
                    embeds.push(client.simpleEmbed({ color: EmbedColor.Success }).setImage(url));
                }
            }

            if (emojis.length > 1) {
                let dmSuccessful = true;

                if (interaction.user.bot) {
                    dmSuccessful = false;
                } else {
                    await interaction.user.send({ embeds }).catch(_ => {
                        dmSuccessful = false;
                    });
                }

                if (dmSuccessful) {
                    return {
                        embeds: [client.simpleEmbed({
                            description: "Robbi has sent you the emoji(s)",
                            color: EmbedColor.Success,
                        })],
                        ephemeral: true
                    };
                } else {
                    return { error: "Unable to send messages to this user", ephemeral: true };
                }
            } else {
                return { embeds };
            }
        } else {
            return { error: "That message does not contain any emojis", ephemeral: true };
        }
    },
    help: {
        subcommands: [],
        description: "Rips emojis from a message.",
        category: "Miscellaneous"
    }
};

export default emojiSteal;