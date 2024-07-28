# discord-bot

# Features
1. GrandChase
    - Commands
      - [x] `/gc-hero` : Get character build (Gear / Soul Imprint).
      
        <img src="https://github.com/mquandvr/discord-bot/blob/main/assets/gc-image.png" alt="" width="250"/>
            
      - [x] `/gc-meta` : Get the team key for the content.
                 
        <img src="https://github.com/mquandvr/discord-bot/blob/main/assets/gc-image-2.png" alt="" width="500"/>

3. Wuthering Waves
    - Commands
      - [x] `/ww-hero` : Get character build.
                 
        <img src="https://github.com/mquandvr/discord-bot/blob/main/assets/ww-image.png" alt="" width="250"/>
        
      - [x] `/ww-news` : Select the channel to get alerts on.
                 
        <img src="https://github.com/mquandvr/discord-bot/blob/main/assets/ww-image-2.png" alt="" width="500"/>

4. Honkai Star Rail
    - Code Redeem
      - Will send you notification if there's a new code available.
      - Will automatically redeem the code for you.
    - Commands
      - [x] `/hsr add` : Delete, edit, or add a user get code.
      - [x] `/hsr-redeem` : Get the code redeem manual.
      - [x] `/hsr schedule` : Select the channel to get alerts on.

# Installation
1. Clone the repository.
2. Run `npm install` to install the dependencies.
3. Create a new file `.env` with the below properties:
   ```
    token=xxx
    domain=xxx
    url_meta=xxx
    max_record_of_page=4
    db_uri=xxx
    ai_code=xxx
    client_id=xxx
    url_wuwa_acticle=https://hw-media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/en/ArticleMenu.json
    url_wuwa_acticle_detail=https://hw-media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/en/article
    url_hsr_hoyoverse_api=https://sg-hkrpg-api.hoyolab.com/common/apicdkey/api/webExchangeCdkeyHyl
    url_hsr_hoyoverse_page_code=https://bbs-api-os.hoyolab.com/community/painter/wapi/circle/channel/guide/material
    url_hsr_3rd_page_code=https://www.rockpapershotgun.com/honkai-star-rail-codes-list
    url_hsr_code_api=https://api.ennead.cc/starrail/code
   ```
4. Run `npm run start` to start bot.
