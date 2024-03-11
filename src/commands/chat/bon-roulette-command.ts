import { ChatInputCommandInteraction, Message, PermissionsString, Role } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';
import { createRequire } from 'node:module';

import { BanRouletteCommandName } from '../../enums/ban-roulette-command-name.js';
import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { ClientUtils, InteractionUtils, MessageUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');

class BanRoulette {
    private Message: Message;
    private RoleToMention: Role;
    private CountDown: number;

    public initBanRoulette = async (
        intr: ChatInputCommandInteraction,
        roleMention: Role,
        countDown: number
    ): Promise<void> => {
        this.RoleToMention = roleMention;
        this.CountDown = countDown;
        this.Message = await InteractionUtils.send(intr, this.getBanRouletteMsg());

        let chrono: NodeJS.Timeout;

        chrono = setInterval(() => {
            if (this.CountDown > 0) {
                this.updateBanRouletteMessage();
            } else {
                clearInterval(chrono);
                // BAN
            }
        }, 1000);
    };

    private updateBanRouletteMessage = async (): Promise<void> => {
        this.CountDown--;
        await MessageUtils.edit(this.Message, this.getBanRouletteMsg());
    };

    private getBanRouletteMsg = (): string => {
        return `Hello ${this.RoleToMention} ! La ban roulette est lancée 🎲
Tirage au sort dans: **${this.CountDown} sec**`;
    };
}

export class BanRouletteCommand implements Command {
    public names = [Lang.getRef('chatCommands.ban-roulette', Language.Default)];
    public cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];

    private BanRoulette: BanRoulette = new BanRoulette();

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        //TODO modo only

        let args = {
            command: intr.options.getString(
                Lang.getRef('arguments.command', Language.Default)
            ) as BanRouletteCommandName,
        };

        switch (args.command) {
            case BanRouletteCommandName.START: {
                const roulisteRole = await ClientUtils.findRole(intr.guild, 'Les Roulistes');

                const countDown = 30;

                await this.BanRoulette.initBanRoulette(intr, roulisteRole, countDown);

                break;
            }
            case BanRouletteCommandName.RESULT: {
                await InteractionUtils.send(intr, `C'est pas prêt !`);
                break;
            }
            default: {
                return;
            }
        }
    }
}
