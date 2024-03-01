import {
    ApplicationCommandType,
    ContextMenuCommandBuilder,
    MessageContextMenuCommandInteraction,
    PermissionFlagsBits,
    parseEmoji
} from "discord.js";
import { InteractionCommand } from "lib/command";
import { EmbedColor } from "lib/config";
import { extractEmojis } from "lib/emoji";

function getEmojiUrl(emoji: string): string | null {
    const parsedEmoji = parseEmoji(emoji);

    if (parsedEmoji?.id) {
        const extension = parsedEmoji.animated ? ".gif" : ".png";

        return `https://cdn.discordapp.com/emojis/${parsedEmoji.id}${extension}`;
    } else {
        return null;
    }
}

const emojiSteal: InteractionCommand = {
    data: new ContextMenuCommandBuilder()
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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
            
            return { embeds };
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