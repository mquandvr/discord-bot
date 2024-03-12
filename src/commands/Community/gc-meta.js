const { SlashCommandBuilder } = require('@discordjs/builders');
const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs');

var domainName = process.env.domain;

const metas = require('../../data/meta.json');

const data = new SlashCommandBuilder()
    .setName('gc-meta')
    .setDescription('Grandchase Hero Build Command!')
    .addStringOption(option =>
        option.setName('content')
            .setDescription('Select a content')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addStringOption(option =>
        option.setName('phase')
            .setDescription('Select a phase')
            .setRequired(false)
            .setAutocomplete(true)
    );

const autocomplete = async (interaction, client) => {
    const focusedValue = interaction.options.getFocused();
    let fileterChoices = [];
    let metaFileterChoices = [];

    const content = interaction.options.getString('content');
    const phase = interaction.options.getString('phase');
    console.log("content", content);
    console.log("phase", phase);

    if (phase !== null) {
        metaFileterChoices = metas.filter((meta) =>
            meta.value.toLowerCase() === content
        );
        fileterChoices = metaFileterChoices[0].data.filter((data) =>
            data.name.toLowerCase().includes(focusedValue.toLowerCase())
        );
    } else if (content !== null) {
        metaFileterChoices = metas.filter((meta) =>
            meta.name.toLowerCase().includes(focusedValue.toLowerCase())
        );
        fileterChoices = metaFileterChoices;
    }

    const results = fileterChoices.map((choice) => {
        return {
            name: choice.name,
            value: choice.value
        };
    });
    await interaction.respond(results.slice(0, 25));
}

const execute = async (interaction, client) => {
    const contentValue = interaction.options.getString('content');
    const phaseValue = interaction.options.getString('phase');
    console.log("content", contentValue);
    console.log("phase", phaseValue);

    const metaData = metas.find(h => h.value === contentValue);

    if (!contentValue || !metaData) return await interaction.reply({ content: 'Meta not found!' });

    let content = "";
    for (const phase of metaData.data) {
        if (phaseValue && phaseValue !== phase.value) {
            continue;
        }
        content += dataTemplate(phase);
    }

    if (!content || content.length === 0) {
        content = "Data not found";
    }
    
    content = `# ${metaData.name} \r ${content}`;

    await interaction.reply({ ephemeral: false, content: content });
}

const dataTemplate = (data, title) => {
    const headerData = `**${data.name}**`;
    const dataKey = `\`\`\`${data.key}\`\`\``;
    return `${headerData} ${dataKey} \r`;
}

module.exports = { data, autocomplete, execute };