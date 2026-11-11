// ==================== 数据 ====================
// 歌曲和歌单的原始数据集中在这里，加歌 / 改歌单只需要动这个文件。

window.AppData = {
  // ---------- 推荐歌曲（首页第二行） ----------
  songs: [
    {
      id: 1,
      name: "イタズラものたちの行進",
      singer: "ジャージと愉快な仲間たち",
      cover: "Album_Cover/Tierra- Piedra-Cielo-y-Hombre土と石と空と人.jpg",
      audio: "audio/ジャージと愉快な仲間たち - イタズラものたちの行進.mp3",
    },
    {
      id: 2,
      name: "Crimewave",
      singer: "Crystal Castles",
      cover: "Album_Cover/Track-cover-album-artwork300x300.jpg",
      audio: "audio/Crimewave.mp3",
      lrcUrl: "LRC/Crimewave.lrc",
    },
    {
      id: 3,
      name: "INTERNET OVERDOSE",
      singer: "KOTOKO/Aiobahn+81",
      cover: "Album_Cover/INTERNET_OVERDOSE640x640.webp",
      audio:
        "audio/spotiget.com_NEEDY_GIRL_OVERDOSE_KOTOKO_Aiobahn_+81_INTERNET_OVERDOSE.mp3",
      lrcUrl:
        "LRC/INTERNET OVERDOSE - NEEDY GIRL OVERDOSE _ KOTOKO _ Aiobahn +81.lrc",
    },
    {
      id: 4,
      name: "Fiesta de la Luna ～魔法少女達の百年祭",
      singer: "ジャージと愉快な仲間たち",
      cover: "Album_Cover/63／64 Completion.jpg",
      audio:
        "audio/ジャージと愉快な仲間たち - Fiesta de la Luna ～魔法少女達の百年祭.mp3",
    },
    {
      id: 5,
      name: "妄想感傷代償連盟 -Hello ver.-",
      singer: "DECO*27/初音未来",
      cover: "Album_Cover/妄想感傷代償連盟 -Hello ver.- - DECO_27.webp",
      audio: "audio/妄想感傷代償連盟 -Hello ver.- - DECO_27.mp3",
      lrcUrl: "LRC/妄想感傷代償連盟 -Hello ver.- - DECO_27.lrc",
    },
    {
      id: 6,
      name: "Коммерсанты",
      singer: "Molchat Doma",
      cover: "Album_Cover/Коммерсанты - Molchat Doma.webp",
      audio: "audio/Коммерсанты - Molchat Doma.mp3",
      lrcUrl: "LRC/Коммерсанты - Molchat Doma.lrc",
    },
    {
      id: 7,
      name: "На Дне",
      singer: "Molchat Doma",
      cover: "Album_Cover/Коммерсанты - Molchat Doma.webp",
      audio: "audio/На Дне - Molchat Doma.mp3",
      lrcUrl: "LRC/На Дне - Molchat Doma.lrc",
    },
    {
      id: 8,
      name: "タイムパラドックス",
      singer: "あよ / 森羅万象",
      cover: "Album_Cover/タイムパラドックス - あよ _ 森羅万象.jpg",
      audio: "audio/spotiget.com_森羅万象_タイムパラドックス.mp3",
      lrcUrl: "LRC/タイムパラドックス - あよ _ 森羅万象.lrc",
    },
    {
      id: 9,
      name: "东方之珠",
      singer: "羅大佑",
      cover: "Album_Cover/东方之珠 - 罗大佑.jpg",
      audio: "audio/spotiget.com_羅大佑_東方之珠.mp3",
      lrcUrl: "LRC/东方之珠 - 罗大佑.lrc",
    },
    {
      id: 10,
      name: "Судно (Борис Рыжий)",
      singer: "Molchat Doma",
      cover: "Album_Cover/Коммерсанты - Molchat Doma.webp",
      audio: "audio/spotiget.com_Molchat_Doma_Судно_(Борис_Рыжий).mp3",
      lrcUrl: "LRC/Судно (Борис Рыжий) - Molchat Doma.lrc",
    },
    {
      id: 11,
      name: "火车",
      singer: "羅大佑",
      cover: "Album_Cover/原乡.jpg",
      audio: "audio/羅大佑 - 火車.mp3",
      lrcUrl: "LRC/火车 - 罗大佑.lrc",
    },
  ],

  // ---------- 推荐歌单（首页第三行） ----------
  playlistData: [
    {
      title: "イタズラものたちの行進",
      desc: "ジャージと愉快な仲間たち,IOSYS,lyowa等歌手",
      cover: "Album_Cover/Tierra- Piedra-Cielo-y-Hombre土と石と空と人.jpg",
    },
    {
      title: "Crimewave",
      desc: "",
      cover: "Album_Cover/Track-cover-album-artwork300x300.jpg",
    },
    {
      title: "INTERNET OVERDOSE",
      desc: "",
      cover: "Album_Cover/INTERNET_OVERDOSE640x640.webp",
    },
    {
      title: "//////////////////",
      desc: "",
      cover: "Album_Cover/63／64 Completion.jpg",
    },
    {
      title: "第五首歌",
      desc: "",
      cover: "Album_Cover/63／64 Completion.jpg",
    },
  ],
};