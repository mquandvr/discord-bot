import { SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType } from 'discord.js';
import { convertStrToTimetamp } from '../../utils/date.js';
import schedule from 'node-schedule';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { findAll, insertOneData } from '../../database.js';
import { COLLECTION_WUWE_NEWS, DATABASE_NAME_WUWE } from '../../utils/constants.js';

var aiCode = process.env.ai_code;
const genAI = new GoogleGenerativeAI(aiCode);

const generationConfig = {
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
        // const schedule = interaction.options.getChannel('schedule');


        //await interaction.reply({ ephemeral: false, content: 'Waiting', fetchReply: true });

        const isSchedule = interaction.options.getBoolean('schedule');
        const channel = interaction.options.getChannel('channel') ?? interaction.channel;

        if (isSchedule) {
            await interaction.editReply({ ephemeral: false, content: 'Schedule added!', fetchReply: true });
            // run 1 time / 1 hour
            schedule.scheduleJob('* * 1 * * *', async () => {
                await retriveContent(channel);
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

const retriveContent = async(channel) => {
    const newDate = new Date(2024,5,2);
    newDate.setHours(0,0,0,0);
    const urlArticle = "https://hw-media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/en/ArticleMenu.json";
    const responseArticle = await fetch(urlArticle);
    const dataArticles = await responseArticle.json();
    const dataPosted = await findAll(COLLECTION_WUWE_NEWS, DATABASE_NAME_WUWE);
    const dataArticleFilters = dataArticles
                                    .filter(x => convertStrToTimetamp(x.createTime) === newDate.getTime()
                                                    && !dataPosted.some(p => p.articleId === x.articleId));
    console.log('dataArticleFilters', dataArticleFilters);
    if (dataArticleFilters && dataArticleFilters.length > 0) {
        // const dataArticle = dataArticleFilters[0];
        for(const dataArticle of dataArticleFilters) {
            const urlArticleDetail = `https://hw-media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/en/article/${dataArticle.articleId}.json`;
            const responseArticleDetail = await fetch(urlArticleDetail);
            const dataArticleDetail = await responseArticleDetail.json();
            // console.log('dataArticleDetail', dataArticleDetail)
            if (dataArticleDetail) {
                // console.log('call bot');

                const prompt = `Summarize the following content according to the timeline.
                Must follow these rules:
                1. Convert time from UTC+8 to GMT+7.
                2. No need to write GMT+7 for the entire content, only write it once in header.
                3. Add the content creation date in the header: ${dataArticleDetail?.startTime}
                4. If the content relates to a reward, write it concisely in the following format: Item (quantity) - method of receipt
                5. Group contents of the same day together
                6. Date format: yyyy/MM/dd HH:mm
                7. Keep the original language (English)
                8. Replace special characters code for HTML with normal characters (Ext: '&times;' must be 'x')
                9. Add source link: https://wutheringwaves.kurogames.com/en/main/news/detail/${dataArticleDetail?.articleId}
                10. Full header
                Content: ${dataArticleDetail?.articleContent}`;
                
                const result = await model.generateContent(prompt);
                const responseText = await result.response.text();
                console.log(responseText)
                const array = responseText?.split(/\r\n|\n/)?.filter(x => x && x.length > 0);
                for (const content of array) {
                    channel.send({ content: content });
                    await sleep(500);
                }

                await insertOneData(COLLECTION_WUWE_NEWS, {articleId: dataArticleDetail?.articleId}, DATABASE_NAME_WUWE);
            }
        }
    }
};

let sleep = async (ms) => await new Promise(r => setTimeout(r,ms));

export { data, autocomplete, execute };