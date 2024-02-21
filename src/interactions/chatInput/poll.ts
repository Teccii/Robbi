import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import { EmbedColor } from "lib/config";
import { InteractionCommand } from "lib/command";
import { PollModel } from "models/Poll";
import { endPoll } from "lib/poll";

export const pollCreateId = "pollCreate";

const description = "Manages polls for this guild.";
const numberEmojis: Map<number, string> = new Map([
    [1, "1️⃣"],
    [2, "2️⃣"],
    [3, "3️⃣"],
    [4, "4️⃣"]
]);

const poll: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addSubcommand(subcmd =>
            subcmd
                .addStringOption(option =>
                    option
                        .setRequired(true)
                        .setName("id")
                        .setDescription("The id of the new poll.")
                )
                .addIntegerOption(option =>
                    option
                        .setRequired(true)
                        .setName("time")
                        .setDescription("The duration of the poll. The unit is minutes.")
                )
                .addStringOption(option =>
                    option
                        .setRequired(true)
                        .setName("question")
                        .setDescription("The question of the new poll.")
                )
                .addStringOption(option =>
                    option
                        .setRequired(true)
                        .setName("option1")
                        .setDescription("The first option of the new poll.")
                )
                .addStringOption(option =>
                    option
                        .setRequired(true)
                        .setName("option2")
                        .setDescription("The second option of the new poll.")
                )
                .addStringOption(option =>
                    option
                        .setRequired(false)
                        .setName("option3")
                        .setDescription("The third option of the new poll.")
                )
                .addStringOption(option =>
                    option
                        .setRequired(false)
                        .setName("option4")
                        .setDescription("The fourth option of the new poll.")
                )
                .setName("create")
                .setDescription("Creates a new poll. To give options emojis, input in the format of `emoji - option`.")
        )
        .addSubcommand(subcmd =>
            subcmd
                .addStringOption(option =>
                    option
                        .setRequired(true)
                        .setName("id")
                        .setDescription("The id of the poll.")
                )
                .setName("end")
                .setDescription("Ends a poll.")
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName("poll")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const subcmd = interaction.options.getSubcommand();

        if (subcmd == "create") {
            const id = interaction.options.getString("id", true);
            const time = interaction.options.getInteger("time", true) * 60;
            const question = interaction.options.getString("question", true);

            let options: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder();

            for (let i = 1; i <= 4; i++) {
                const option = interaction.options.getString(`option${i}`, false);

                if (option) {
                    const split = option.split("-", 2).map(v => v.trim());

                    if (split.length == 1) {
                        const emoji = numberEmojis.get(i)!;

                        options = options.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`${pollCreateId}-${id}-${i}`)
                                .setEmoji(emoji)
                                .setLabel(option)
                                .setStyle(ButtonStyle.Primary)
                        );
                    } else {
                        const emoji = split[0];
                        const label = split[1];

                        options = options.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`${pollCreateId}-${id}-${i}`)
                                .setEmoji(emoji)
                                .setLabel(label)
                                .setStyle(ButtonStyle.Primary)
                        );
                    }
                }
            }

            const endsAt = Math.trunc(Date.now() / 1000) + time;

            await interaction.reply({
                embeds: [client.simpleEmbed({
                    title: "Poll",
                    color: EmbedColor.Neutral,
                }).setFields(
                    { name: "Question", value: question },
                    { name: "Ends", value: `<t:${endsAt}:R>` }
                )],
                components: [options]
            });

            const msg = await interaction.fetchReply();

            await new PollModel({
                guildId: interaction.guild.id,
                pollId: id,
                channelId: msg.channel.id,
                messageId: msg.id,
                endsAt,
                votes: [0, 0, 0, 0],
                voted: [],
            }).save();

            return {};
        } else if (subcmd == "end") {
            const id = interaction.options.getString("id", true);

            const poll = await PollModel.findOne({
                guildId: interaction.guild.id,
                pollId: id
            });

            if (poll) {
                await endPoll(client, interaction.guild, poll, true);

                return {
                    embeds: [client.simpleEmbed({
                        description: `Successfully ended \`${id}\``,
                        color: EmbedColor.Neutral,
                    })],
                    ephemeral: true,
                };
            } else {
                return { error: `No ongoing poll with the id \`${id}\`` };
            }
        }

        return { error: "Unknown Error", ephemeral: true };
    },
    help: {
        subcommands: ["create", "end"],
        description,
        category: "Miscellaneous"
    }
};

export default poll;