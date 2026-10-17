import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Проверить отклик и состояние бота');

export async function execute(interaction: ChatInputCommandInteraction) {
  const sent = await interaction.reply({
    content: 'Ловлю мячик... ~nya! 🐾',
    fetchReply: true
  });

  const latency = sent.createdTimestamp - interaction.createdTimestamp;
  const apiLatency = Math.round(interaction.client.ws.ping);

  await interaction.editReply({
    content: `Понг! ✨ Задержка: **${latency}мс** (Discord API: **${apiLatency}мс**) (≧◡≦)`
  });
}
