const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType } = require('discord.js');
const fs = require('fs');
const { TableBuilder } = require('../../utils/table.js');
const { convertStrToTimetamp } = require('../../utils/date.js');
const schedule = require('node-schedule')

const { GoogleGenerativeAI } = require("@google/generative-ai");

var aiCode = process.env.aiCode;
const genAI = new GoogleGenerativeAI(aiCode);

const generationConfig = {
    maxOutputTokens: 1500,
    temperature: 0.9,
    topP: 0.1,
    topK: 16,
  };
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig});

const data = new SlashCommandBuilder()
    .setName('wuwa')
    .setDescription('Wuthering News Command!')
    .addSubcommand(subCommand => 
        subCommand
            .setName('add')
            .setDescription("Enable the bot to send news on a schedule.")
            .addBooleanOption(option => 
                option.setName("schedule")
                        .setDescription("Enable the bot to send news on a schedule.")
            )
            .addChannelOption(option => 
                option.setName("channel")
                        .setDescription('The channel the message should be sent to')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
            )
    );

const execute = async (interaction, client) => {
    try {
        await interaction.deferReply();

        // const schedule = interaction.options.getChannel('schedule');


        //await interaction.reply({ ephemeral: false, content: 'Waiting', fetchReply: true });

        const isSchedule = interaction.options.getBoolean('schedule');
        const channel = interaction.options.getChannel('channel');

        if (isSchedule) {
            await interaction.editReply({ ephemeral: false, content: 'Schedule added!', fetchReply: true });
            schedule.scheduleJob('* * 1 * * *', async () => {
                const contents = await retriveContent();
                if (contents) {
                    channel.send({ content: contents.slice(0, 2000) });
                }
            });
        } else {
            const contents = await retriveContent();
            if (contents) {
                await interaction.editReply({ ephemeral: false, content: contents.slice(0, 2000), fetchReply: true });
            } else {
                await interaction.editReply({ ephemeral: false, content: 'Content not found', fetchReply: true });
            }
        }

    } catch (e) {
        console.log(e);
        await interaction.editReply({ ephemeral: false, content: 'Error!', fetchReply: true });
    }
}

const autocomplete = async() => {
    
}

const retriveContent = async() => {
    let content;
    const newDate = new Date();
    newDate.setHours(0,0,0,0);
    const urlArticle = "https://hw-media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/en/ArticleMenu.json";
    const responseArticle = await fetch(urlArticle);
    const dataArticles = await responseArticle.json();
    const dataArticleFilters = dataArticles.filter(x => convertStrToTimetamp(x.createTime) === newDate.getTime());
    if (dataArticleFilters && dataArticleFilters.length > 0) {
        //console.log('dataArticleFilters', dataArticleFilters);
        const dataArticle = dataArticleFilters[0];
        // for(const dataArticle in dataArticleFilters) {
        const urlArticleDetail = `https://hw-media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/en/article/${dataArticle.articleId}.json`;
        const responseArticleDetail = await fetch(urlArticleDetail);
        const dataArticleDetail = await responseArticleDetail.json();
        if (dataArticleDetail) {
            console.log('call bot');

            const prompt = `Summarize the following content according to the timeline.
            Must follow these rules:
            1. Convert time from UTC+8 to GMT+7.
            2. No need to write GMT+7 for the entire content, only write it once.
            3. Add the content creation date in the header: ${dataArticleDetail?.startTime}
            4. If the content relates to a reward, write it concisely in the following format: Item (quantity) - method of receipt
            5. Limit to 1000 characters
            6. Group contents of the same day together
            7. Date format: yyyy/MM/dd HH:mm
            8. Keep the original language (English)
            9. Replace special characters code for HTML with normal characters
            10. Add source link: https://wutheringwaves.kurogames.com/en/main/news/detail/${dataArticleDetail?.articleId}
            11. Full header
            Content: ${dataArticleDetail?.articleContent}`;
            
            const result = await model.generateContent(prompt);
            const response = result.response;
            content = response.text();
        } else {
            content = '';
        }
        // }
    } else {
        content = `Không có nội dung mới hôm nay (${newDate})`;
    }

    return content;
};

module.exports = { data, autocomplete, execute };