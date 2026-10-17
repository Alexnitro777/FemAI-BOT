import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { memoryManager } from '../services/memory.js';

export const data = new SlashCommandBuilder()
  .setName('reset')
  .setDescription('Очистить память диалога и начать общение с чистого листа');

export async function execute(interaction: ChatInputCommandInteraction) {
  const sessionId = interaction.channelId;
  memoryManager.clearSession(sessionId);

  await interaction.reply({
    content: 'Я всё забыл и готов болтать с чистого листа, ня! О чём поболтаем? (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄) 💕'
  });
}
