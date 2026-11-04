// 播放栏逻辑
$(function () {
  // 获取音频和按钮
  const $audio = $("#my-audio");
  const $playBtn = $("#play_song");
  const $pauseBtn = $("#pause_song");
  const $Album_cover = $("#Album_Cover");
  const $miniLyric = $("#mini-lyric"); //歌词原文
  const $miniLyricTrans = $("#mini-lyric-trans"); //歌词翻译

  //=======================================================================
  //=========迷你歌词播放逻辑=========
  let lyricLines = []; // 存解析后的歌词：[{ time: 秒, text: '歌词' }]
  let currentOffset = 0; // 当前这首歌的歌词偏移（秒）

  // 每首歌自己的偏移：正数 = 歌词延后出现，负数 = 提前出现
  // 加新歌时在这里补一行，没写的歌默认 0
  const LYRIC_OFFSETS = {
    "LRC/INTERNET OVERDOSE - NEEDY GIRL OVERDOSE _ KOTOKO _ Aiobahn +81.lrc": 1.6,
  };

  // 把 LRC 文本解析成数组（一行形如 [01:23.45]歌词）
  function parseLrc(text) {
    const result = [];
    text.split("\n").forEach(function (line) {
      const m = line.match(/\[(\d+):(\d+)(?:\.(\d+))?\](.*)$/);
      if (!m) return;
      const time =
        parseInt(m[1]) * 60 +
        parseInt(m[2]) +
        (m[3] ? parseFloat("0." + m[3]) : 0);

      // 从行尾往前找一组配对的括号：括号里是翻译，前面才是原文。
      // 这样 "(Eyes) On sharp threats (翻译：…)" 能正确拆成原文 + 翻译。
      const raw = m[4].trim();
      let content = raw;
      let trans = "";
      if (/[\)）】]$/.test(raw)) {
        let depth = 0;
        let start = -1;
        for (let i = raw.length - 1; i >= 0; i--) {
          if (/[\)）】]/.test(raw[i])) {
            depth++;
          } else if (/[\(（【]/.test(raw[i])) {
            depth--;
            if (depth === 0) {
              start = i;
              break;
            }
          }
        }
        if (start >= 0) {
          trans = raw.slice(start + 1, raw.length - 1).trim();
          content = raw.slice(0, start).trim();
        }
      }

      const content_text = content; //原文
      if (content_text || trans) {
        result.push({ time: time, text: content_text, trans: trans });
      }
    });
    return result;
  }

  // 切歌时调用：清空旧歌词，按 lrcUrl 读新歌词
  function loadLyric(url) {
    lyricLines = [];
    currentOffset = LYRIC_OFFSETS[url] || 0; // 取这首歌的偏移
    $miniLyric.text("纯音乐，请欣赏");
    $miniLyricTrans.text("").addClass("hidden");
    if (!url) return;

    $.get(url)
      .done(function (text) {
        lyricLines = parseLrc(text);
      })
      .fail(function () {
        console.warn("歌词文件读取失败（用本地服务器打开才能读）：" + url);
      });
  }

  // 播放进度变化时，找到当前该显示的那一句
  function updateMiniLyric() {
    if (!lyricLines.length) return;

    const now = $audio[0].currentTime - currentOffset;
    let text = "";
    let trans = "";
    for (let i = 0; i < lyricLines.length; i++) {
      if (now >= lyricLines[i].time) {
        text = lyricLines[i].text;
        trans = lyricLines[i].trans;
      } else {
        break;
      }
    }
    $miniLyric.text(text || "纯音乐，请欣赏");
    if (trans) {
      $miniLyricTrans.text(`(${trans})`).removeClass("hidden");
    } else {
      $miniLyricTrans.text("").addClass("hidden");
    }
  }
  $audio.on("timeupdate", updateMiniLyric);
  //=======================================================================
  // 1. 监听音频播放事件（切换图标）
  $audio.on("play", function () {
    $playBtn.addClass("hidden");
    $pauseBtn.removeClass("hidden");
    $Album_cover.removeClass("[animation-play-state:paused]");
  });
  // 2. 监听音频暂停事件（切换图标）
  $audio.on("pause", function () {
    $playBtn.removeClass("hidden");
    $pauseBtn.addClass("hidden");
    $Album_cover.addClass("[animation-play-state:paused]");
  });

  // 点击播放/暂停按钮
  $playBtn.on("click", () => $audio[0].play());
  $pauseBtn.on("click", () => $audio[0].pause());
  //=======================================================================

  // 准备数据（模拟从后台拿到的 10 首歌）(歌曲列表封装成包)
  const songs = [
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
      singer: "DECO*27",
      cover: "Album_Cover/妄想感傷代償連盟 -Hello ver.-  - DECO_27.webp",
      audio: "audio/妄想感傷代償連盟 -Hello ver.-  - DECO_27.mp3",
      lrcUrl: "LRC/妄想感傷代償連盟 -Hello ver.-  - DECO_27.lrc",
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
  ];
  // ===========================================================
  // 2. 拿到你的网格容器
  const $container = $("#card-container");

  // 3. 循环遍历数据，拼接 HTML 字符串
  // 现代写法：用 map 和 join 替代 $.each
  // map 负责把每个数据变成一段 HTML 字符串，join('') 负责把它们拼接起来
  const htmlString = songs
    .map(
      (song) => `
        <div class="song-card text-center w-full h-full bg-white/30 rounded-lg p-2 flex flex-col cursor-pointer group" 
             data-id="${song.id}" 
             data-src="${song.audio}"
             data-lrc="${song.lrcUrl || ""}">
            <img src="${song.cover}" class="w-full aspect-square object-cover rounded-md shadow-md" alt="专辑图片">
            <div class=" h-full bg-gradient-to-t from-white/30 to-transparent rounded-md">
                <p class="singer font-japan-bit text-[10px] w-full truncate mt-2 group-hover:text-blue-500">${song.singer}</p>
                <p class="name font-japan-bit text-[15px] w-full  line-clamp-2 text-[#373838] group-hover:text-blue-400">${song.name}</p>
            </div>
        </div>
    `,
    )
    .join("");

  // 一键渲染到页面上
  $container.html(htmlString);
  //=======================================================================
  // =================  点击卡片播放逻辑 =================
  $container.on("click", ".song-card", function () {
    const audioSrc = $(this).data("src");
    const songName = $(this).find(".name").text();
    const singerName = $(this).find(".singer").text();
    const coverSrc = $(this).find("img").attr("src");

    if (!audioSrc) {
      alert("这首歌还没上传音频哦！");
      return;
    }

    // 换歌的同时换歌词
    loadLyric($(this).data("lrc"));

    // 1. 先把动画移除，图片瞬间回正
    $Album_cover.removeClass("animate-[spin_8s_linear_infinite]");

    // 2. 强制浏览器立刻计算一次元素尺寸，刷新它的重绘引擎
    void $Album_cover[0].offsetWidth;

    // 3. 再把动画加回去，并让它处于暂停状态（因为马上要播放了，play 事件会接管让它转）
    $Album_cover.addClass(
      "animate-[spin_8s_linear_infinite] [animation-play-state:paused]",
    );

    // 1. 改变音频源并播放（这会触发 play 事件，play 事件里会去掉 paused 让它转）
    $audio.attr("src", audioSrc)[0].play();

    // 2. 把播放栏下方的文字和图片也同步换掉
    $("#songName").text(songName);
    $("#singerName").text(singerName);
    $Album_cover.attr("src", coverSrc); // 换图
  });
  //=======================================================================
  // ===== 点击播放栏的图片或文字，播放/暂停 =====
  $("#Album_Cover, #songName, #singerName")
    .css("cursor", "pointer")
    .on("click", function () {
      // 如果暂停了，就播放；否则就暂停
      if ($audio[0].paused) {
        $audio[0].play();
      } else {
        $audio[0].pause();
      }
    });
  // ===== 音量控制逻辑 =====
  // 1. 点击图标，切换面板显示/隐藏
  $("#volume-btn").on("click", function () {
    $("#volume-panel").toggle();
  });

  // 2. 拖动滑块调整音量
  $("#volume-slider").on("input", function () {
    $audio[0].volume = $(this).val();
  });
});
