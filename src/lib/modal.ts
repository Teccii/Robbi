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
    placeholder?: string;
    value?: string;
    required: boolean;

    constructor (customId: string, label: string, style: TextInputStyle, required: true, placeholder?: string, value?: string) {
        this.customId = customId;
        this.label = label;
        this.style = style;
        this.placeholder = placeholder;
        this.value = value;
        this.required = required;
    }

    toActionRow(): ActionRowBuilder<ModalActionRowComponentBuilder> {
        let component = new TextInputBuilder()
            .setCustomId(this.customId)
            .setLabel(this.label)
            .setStyle(this.style)
            .setRequired(this.required);

        if (this.placeholder) {
            component = component.setPlaceholder(this.placeholder);
        }

        if (this.value) {
            component = component.setValue(this.value);
        }
        
        return new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(component);
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