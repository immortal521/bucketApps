/**
 * MusicFree QQ音乐插件
 * API提供: https://api.xingzhige.com
 *
 * @author: Yingyya
 * @date: 2023-09-30 17:05
 * @update time: 2023-09-30 21:36
 */
const axios = require("axios");
const platform = "QQ";
function get(url, params) {
  return axios({
    url,
    method: "GET",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    params,
  });
}
async function getMusicData(mid, br) {
  try {
    let { code, data } = (
      await get("https://api.xingzhige.com/API/QQmusicVIP/", {
        mid,
        format: "lrc",
        br,
      })
    ).data;
    return code === 0 ? data : {};
  } catch {
    return {};
  }
}
async function getAlbumData(mid) {
  try {
    let { code, data } = (
      await get("https://api.xingzhige.com/API/QQmusicVIP/album.php", { mid })
    ).data;
    return code === 0 ? data : {};
  } catch {
    return {};
  }
}
async function customSearch(
  { type = "music", page = 1, name, ...params },
  callback
) {
  const limit = 20;
  let url = "https://api.xingzhige.com/API/QQmusicVIP/";
  if (type === "album") {
    url += "album.php";
  }
  try {
    let response = await get(url, { page, limit, name, ...params });
    let { code, data: results } = response.data;
    if (code === 0) {
      let data = results.map(callback);
      let total = Math.ceil(response.headers.estimate_sum / limit);
      return { isEnd: page >= total, data };
    }
  } catch (r) {
    console.error(r);
    console.error("请求出错拉!");
  }
  return { isEnd: true, data: [] };
}
async function search(name, page, type) {
  if (type === "music") {
    return customSearch({ name, page }, (song) => ({
      platform,
      id: song.mid,
      title: song.songname,
      artist: song.name,
      artwork: song.cover,
      album: song.album,
    }));
  } else if (type === "album") {
    return customSearch(
      { name, page, type: "album", data: "song_list" },
      (album) => ({
        platform,
        id: album.mid,
        title: album.name,
        artist: album.singer.name,
        artwork: album.cover,
        date: album.public_time,
        musicList: album.song_list.map((song) => ({
          platform,
          id: song.mid,
          title: song.songname,
          artist: song.name,
          artwork: song.cover,
          album: song.album,
        })),
        description: "正在加载...",
      })
    );
  }
}
async function getMediaSource(music, br) {
  try {
    const BREmun = { super: 14, high: 11, standard: 8, low: 6 };
    let data = await getMusicData(music.id, BREmun[br]);
    if (data.src !== undefined) {
      return { url: data.src };
    }
  } catch {
    console.error("请求出错拉!");
  }
}
async function getLyric(music) {
  let data = await getMusicData(music.id);
  if (data.lrc.content !== undefined) {
    return { rawLrc: data.lrc.content };
  }
}
async function getAlbumInfo(album) {
  let data = await getAlbumData(album.id);
  return {
    isEnd: true,
    musicList: data.songlist.map((song) => ({
      platform,
      id: song.mid,
      title: song.songname,
      artist: song.name,
      artwork: song.cover,
      album: song.album,
    })),
    albumItem: { ...album, description: data.desc },
  };
}
module.exports = {
  platform,
  version: "1.1.0",
  appVersion: ">0.0",
  defaultSearchType: "music",
  search,
  getMediaSource,
  getLyric,
  getAlbumInfo,
};
