import {
    ActionRowBuilder,
    ModalActionRowComponentBuilder,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import CustomClient from "./client";

export class Question {
    customId: string;
    label: string;
    style: TextInputStyle;
    required: boolean;

    constructor (customId: string, label: string, style: TextInputStyle, required: true) {
        this.customId = customId;
        this.label = label;
        this.style = style;
        this.required = required;
    }

    toActionRow(): ActionRowBuilder<ModalActionRowComponentBuilder> {
        return new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            new TextInputBuilder()
                .setCustomId(this.customId)
                .setLabel(this.label)
                .setStyle(this.style)
                .setRequired(this.required)
        );
    }
}

export function toActionRows(questions: Question[]): ActionRowBuilder<ModalActionRowComponentBuilder>[] {
    return questions.map(q => q.toActionRow());
}

export async function parseAnswers(client: CustomClient, interaction: ModalSubmitInteraction, questions: Question[]): Promise<Map<string, string>> {
    const answers: Map<string, string> = new Map();

    for (const question of questions) {
        const answer = interaction.fields.getTextInputValue(question.customId);

        if (answer == "" && question.required) {
            await interaction.reply({
                embeds: [client.simpleError("Issue receiving options, please try again.")]
            });

            return new Map();
        }

        answers.set(question.customId, answer);
    }

    return answers;

}