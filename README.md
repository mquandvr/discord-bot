# discord-bot

![Alt](https://repobeats.axiom.co/api/embed/7c5ea2f2b8f4d9db4b249cd4b7fe09778e962aea.svg "Repobeats analytics image")

# Features
1. GrandChase
    - Commands
      - [x] `/gc-hero` : Check character build (Gear/SI)
      - [x] `/gc-meta` : Get team key setup for content

2. Wuthering Waves
    - Commands
      - [x] `/ww-hero` : Check character build 
      - [x] `/ww-news` : Notification news

4. Honkai Star Rail
    - Code Redeem
      - Will send you notification if there's a new code available
      - Will automatically redeem the code for you
    - Commands
      - [x] `/hsr add` : Add/Update/Delete user receive code
      - [x] `/hsr-redeem` : Receive code redeem manual
      - [x] `/hsr schedule` : Choose channel receive notification.

# Installation
1. Clone the repository.
2. Run `npm install` to install the dependencies.
3. Create new file `.env` with below properties:
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
4. Run `npm run start` to start bot
