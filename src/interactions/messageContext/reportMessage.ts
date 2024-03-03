import {
    ApplicationCommandType,
    ContextMenuCommandBuilder,
    MessageContextMenuCommandInteraction
} from "discord.js";
import { InteractionCommand } from "lib/command";
import { TicketType, createTicket } from "lib/tickets";

const reportMessage: InteractionCommand = {
    data: new ContextMenuCommandBuilder()
        .setName("Report Message")
        .setType(ApplicationCommandType.Message),
    exec: async (client, interaction) => {
        if (!(interaction instanceof MessageContextMenuCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const success = await createTicket(client, interaction, new Map(), TicketType.MessageReport);

        if (!success) {
            return {
                error: "Something went wrong while trying to open ticket, please try again",
                ephemeral: true,
            };
        }

        return {};
    },
    help: {
        subcommands: [],
        description: "Opens a ticket to report a message.",
        category: "Moderation"
    }
};

export default reportMessage;