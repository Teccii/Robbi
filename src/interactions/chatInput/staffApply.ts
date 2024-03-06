import {
    ChatInputCommandInteraction,
    ModalBuilder,
    SlashCommandBuilder,
    TextInputStyle
} from "discord.js";
import { InteractionCommand } from "lib/command";
import { Question, toActionRows } from "lib/modal";

export const staffApplyModalId = "staffApply";
export const staffApplyQuestions = [
    new Question("reason", "Why should we pick you?", TextInputStyle.Paragraph, true),
    new Question("age", "How old are you?", TextInputStyle.Short, true),
    new Question("timezone", "What is your timezone?", TextInputStyle.Short, true),
];

const description = "Apply for staff.";

const staffApply: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addSubcommand(subcmd =>
            subcmd
                .setName("apply")
                .setDescription(description)    
        )
        .setName("staff")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const cooldownId = `${interaction.user.id}-staffApply`;
        const cooldown = await client.getCooldown(cooldownId);

        if (cooldown === null) {
            const modal = new ModalBuilder()
                .setCustomId(staffApplyModalId)
                .setTitle(`Staff Application for ${interaction.guild.name}`)
                .setComponents(toActionRows(staffApplyQuestions));

            await interaction.showModal(modal);
            await client.addCooldown(cooldownId, 7 * 24 * 60 * 60);

            return {};
        } else {
            return {
                error: `You can apply again <t:${cooldown.endsAt}:R>`,
                ephemeral: true
            };
        }
    },
    help: {
        subcommands: [],
        description,
        category: "Miscellaneous"
    }
};

export default staffApply;