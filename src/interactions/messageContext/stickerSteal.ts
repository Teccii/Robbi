import { ApplicationCommandType, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction } from "discord.js";
import { InteractionCommand } from "lib/command";
import { EmbedColor } from "lib/config";

const stickerSteal: InteractionCommand = {
    data: new ContextMenuCommandBuilder()
        .setName("Steal Sticker")
        .setType(ApplicationCommandType.Message),
    exec: async (client, interaction) => {
        if (!(interaction instanceof MessageContextMenuCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const sticker = interaction.targetMessage.stickers.first();

        if (sticker) {
            
            let dmSuccessful = true;

            if (interaction.user.bot) {
                dmSuccessful = false;
            } else {
                await interaction.user.send({
                    embeds: [client.simpleEmbed({
                        title: `Found a sticker!`,
                        color: EmbedColor.Success,
                    }).setImage(`https://media.discordapp.net/stickers/${sticker.id}.webp`)]
                }).catch(_ => {
                    dmSuccessful = false;
                });
            }

            if (dmSuccessful) {
                return {
                    embeds: [client.simpleEmbed({
                        description: "Robbi has sent you the sticker",
                        color: EmbedColor.Success,
                    })],
                    ephemeral: true
                };
            } else {
                return { error: "Unable to send messages to this user", ephemeral: true };
            }
        } else {
            return { error: "That message does not contain a sticker", ephemeral: true };
        }
    },
    help: {
        subcommands: [],
        description: "Rips the sticker from a message.",
        category: "Miscellaneous"
    }
};

export default stickerSteal;