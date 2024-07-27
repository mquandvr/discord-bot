import { SlashCommandBuilder } from "@discordjs/builders";

import logger from "../../../utils/log.js";
const log = logger(import.meta.filename);

import got from "got";

import {
  COLLECTION_HSR_ACCOUNT,
  COLLECTION_HSR_CHANNEL,
  COLLECTION_HSR_CODE,
  COLLECTION_HSR_REDEEM,
} from "../../../utils/constants.js";

import ConnectionHSR from "../../../db/databaseHSR.js";

const connection = new ConnectionHSR();

const data = new SlashCommandBuilder()
  .setName("hsr-redeem")
  .setDescription("Honkai Star Rail Redeem Code Command!");

const validate = async () => {
  return true;
};

const execute = async (interaction, client) => {
  try {
    // const schedule = interaction.options.getChannel('schedule');
    //await interaction.reply({ ephemeral: false, content: 'Waiting', fetchReply: true });
    await doRedeemCode(client, false);
    await interaction.deleteReply();
  } catch (e) {
    log.error(`Error execute wuwa news: ${e}`);
  }
};

const doRedeemCode = async (client, isSendCode) => {
  try {
    const accounts = await connection
      .setCollection(COLLECTION_HSR_ACCOUNT)
      .setQuery({ enabled: true })
      .findByCondition();

    if (accounts.length === 0) {
      log.warn("No account found");
    }

    const redeems = await connection
      .setCollection(COLLECTION_HSR_REDEEM)
      .findAll();

    const codes = await getCodeApi();

    const pendingCodes = await getHoyoCodes();

    const newCodes = [...codes];
    const hoyoCodes = pendingCodes.filter(
      (i) => !codes.some((j) => j.code === i.code),
    );
    if (hoyoCodes.length !== 0) {
      newCodes.push(...hoyoCodes);
    }

    // const webCodes = pageCodes.filter(
    //   (i) => !codeList.some((j) => j.code === i.code),
    // );
    // if (webCodes.length !== 0) {
    //   newCodes.push(...webCodes);
    // }

    if (newCodes.length === 0) {
      log.info("No code found");
      return;
    }

    for (const account of accounts) {
      const redeemedCode = redeems.find((r) => r.uid === account.uid) ?? [];
      const avaliableCodes = newCodes.filter(
        (i) => !redeemedCode.codes?.includes(i.code),
      );
      if (avaliableCodes && avaliableCodes.length > 0) {
        for (const code of avaliableCodes) {
          const res = await got({
            url: process.env.url_hsr_hoyoverse_api,
            searchParams: {
              cdkey: code.code,
              game_biz: "hkrpg_global",
              lang: "en",
              region: account.region,
              t: Date.now(),
              uid: account.uid,
            },
            headers: {
              "x-rpc-app_version": "2.42.0",
              "x-rpc-client_type": 4,
              Cookie: account.cookie,
            },
          });

          if (res.statusCode !== 200) {
            log.error(
              `Error while redeeming code. uid: ${account.uid} - code: ${code.code} - status: ${res.statusCode} - message: ${res.body}`,
            );

            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }

          const codeBody = JSON.parse(res.body);

          if (codeBody.retcode !== 0) {
            log.warn(
              `uid: ${account.uid} - code: ${code.code} - error: ${codeBody.message}`,
            );

            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }

          log.info(
            `uid: ${account.uid} - code: ${code.code} - message: ${codeBody.message}`,
          );

          code.status = "Expired";

          await new Promise((r) => setTimeout(r, 5000));
        }

        if (!redeemedCode.codes) {
          redeemedCode.codes = [...avaliableCodes];
        } else {
          redeemedCode.codes.push(...avaliableCodes);
        }
        const data = {
          $set: {
            uid: account.uid,
            codes: redeemedCode.codes.map((x) => x.code),
          },
        };
        const options = { upsert: true };
        await connection
          .setCollection(COLLECTION_HSR_REDEEM)
          .setQuery({ uid: account.uid })
          .setData(data)
          .setOptions(options)
          .updateOneData();
      } else {
        log.warn(`uid: ${account.uid} - message: No new code`);
      }
    }

    const codeDiscordSent = await connection
      .setCollection(COLLECTION_HSR_CODE)
      .findAll();
    const codeSend =
      newCodes.filter((i) => !codeDiscordSent.some((j) => i.code === j.code)) ??
      [];

    if (codeSend.legnth > 0) {
      const baseUrl = "https://hsr.hoyoverse.com/gift";
      const message = codeSend
        .map(
          (i) =>
            `Code: ${i.code}\nRewards: ${i.rewards}\nClaim Here: ${baseUrl}?code=${i.code}`,
        )
        .join("\n\n");
      log.info(`New code(s) found:\n${message}`);

      if (isSendCode) {
        const channelRegs = await connection
          .setCollection(COLLECTION_HSR_CHANNEL)
          .setQuery({ enabled: true })
          .findByCondition();
        for (const chan of channelRegs) {
          const channel = client.channels.cache.get(chan.id);
          await channel.send({ content: message });
        }
      }

      await connection
        .setData(codeSend)
        .setCollection(COLLECTION_HSR_CODE)
        .insertManyData();
    }
  } catch (e) {
    log.error(`Error execute schedule hsr codes: ${e}`);
  }
};

// async function getPageCodes() {
//   const content = await got({
//     url: process.env.url_hsr_3rd_page_code,
//     responseType: "text",
//   });

//   const $ = load(content.body);
//   const $codes = $("table");
//   let pageCodes = [];
//   $codes.find("tr").each((i, row) => {
//     if (i !== 0) {
//       // Initialize an empty object to store the row data
//       const rowData = {};
//       const status = $(row).find("td:nth-child(3)").text();

//       if (status.indexOf("Active") >= 0) {
//         rowData["code"] = $(row).find("td").first().text();
//         rowData["rewards"] = $(row).find("td:nth-child(2)").text();
//         rowData["status"] = status;

//         // Add the row data to the table data array
//         pageCodes.push(rowData);
//       }
//     }
//   });

//   return pageCodes;
// }

async function getCodeApi() {
  const urlCodes = process.env.url_hsr_code_api;
  const responseCodes = await fetch(urlCodes);
  const data = await responseCodes.json();

  return data.active ?? [];
}

async function getHoyoCodes() {
  const hoyoRes = await got({
    url: process.env.url_hsr_hoyoverse_page_code,
    searchParams: {
      game_id: 6,
    },
    headers: {
      "x-rpc-app_version": "2.42.0",
      "x-rpc-client_type": 4,
    },
  });

  if (hoyoRes.statusCode !== 200) {
    log.json({
      message: "Error while retrieving redeem code from HoyoLab",
      args: {
        statusCode: hoyoRes.statusCode,
        body: hoyoRes.body,
      },
    });

    return;
  }

  const hoyoBody = JSON.parse(hoyoRes.body);
  const exchangeGroup = hoyoBody.data.modules.find(
    (i) => i.exchange_group !== null,
  );

  const pictureHash = [
    {
      hash: "77cb5426637574ba524ac458fa963da0_6409817950389238658",
      name: "Stellar Jade",
    },
    {
      hash: "7cb0e487e051f177d3f41de8d4bbc521_2556290033227986328",
      name: "Refined Aether",
    },
    {
      hash: "508229a94e4fa459651f64c1cd02687a_6307505132287490837",
      name: "Traveler's Guide",
    },
    {
      hash: "0b12bdf76fa4abc6b4d1fdfc0fb4d6f5_4521150989210768295",
      name: "Credit",
    },
  ];

  const pendingCodes = [];
  const bonuses =
    (exchangeGroup &&
      exchangeGroup.exchange_group &&
      exchangeGroup.exchange_group.bonuses) ??
    [];
  if (bonuses.length !== 0) {
    const avaliableCodes = bonuses.filter((i) => i.code_status === "ON");
    for (const code of avaliableCodes) {
      const rewards = code.icon_bonuses.map((i) => ({
        code: i.bonus_num,
        reward:
          // eslint-disable-next-line no-constant-binary-expression
          `${i.bonus_num} ${pictureHash.find((j) => i.icon_url.includes(j.hash))?.name}` ??
          "Unknown",
      }));

      pendingCodes.push({
        code: code.exchange_code,
        rewards: rewards.map((i) => `${i.reward}`).join(" + "),
      });
    }
  }

  return pendingCodes;
}

const devOnly = false;

export { data, validate, execute, doRedeemCode, devOnly };
