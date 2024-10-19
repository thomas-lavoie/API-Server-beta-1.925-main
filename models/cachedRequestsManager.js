import * as utilities from "../utilities.js";
import * as serverVariables from "../serverVariables.js";

let requestsCachesExpirationTime = serverVariables.get(
  "main.requests.CacheExpirationTime"
);

global.requestsCaches = [];
global.cachedRequestsCleanerStarted = false;

export default class CachedRequestsManager {
  static startCachedRepositoriesCleaner() {
    setInterval(
      CachedRequestsManager.flushExpired,
      requestsCachesExpirationTime * 1000
    );
    console.log(
      BgWhite + FgBlue,
      "[Periodic requests data caches cleaning process started...]"
    );
  }

  static add(url, content, ETag = "") {
    if (!cachedRequestsCleanerStarted) {
      cachedRequestsCleanerStarted = true;
      CachedRequestsManager.startCachedRepositoriesCleaner();
    }
    if (url != "") {
      CachedRequestsManager.clear(url);
      requestsCaches.push({
        url,
        content,
        ETag,
        Expire_Time: utilities.nowInSeconds() + requestsCachesExpirationTime,
      });
      console.log(
        BgWhite + FgBlue,
        `[Data of ${url} requests has been cached]`
      );
    }
  }

  static find(url) {
    try {
      if (url != "") {
        for (let cache of requestsCaches) {
          if (cache.url == url) {
            cache.Expire_Time =
              utilities.nowInSeconds() + requestsCachesExpirationTime;
            console.log(
              BgWhite + FgBlue,
              `${cache.url} request data retrieved from cache`
            );
            return cache;
          }
        }
      }
    } catch (error) {
      console.log(BgWhite + FgRed, "[requests cache error!]", error);
    }
    return null;
  }

  static clear(url) {
    if (url != "") {
      let indexToDelete = [];
      let index = 0;
      for (let cache of requestsCaches) {
        if (cache.url == url) {
          indexToDelete.push(index);
        }
        index++;
      }
      utilities.deleteByIndex(requestsCaches, indexToDelete);
    }
  }

  static flushExpired() {
    let now = utilities.nowInSeconds();
    for (let cache of requestsCaches) {
      if (cache.Expire_Time <= now) {
        console.log(
          BgWhite + FgBlue,
          "Cache file data of " + cache.url + ".json expired"
        );
      }
    }
    requestsCaches = requestsCaches.filter((cache) => cache.Expire_Time > now);
  }

  static get(HttpContext) {
    let cache = CachedRequestsManager.find(HttpContext.req.url);
    if (cache !== null) {
      HttpContext.response.JSON(cache.content, cache.ETag, true);
      return true;
    }
  }
}
