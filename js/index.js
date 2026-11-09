// ==================== 音乐播放器主逻辑 ====================
$(function () {
  // ==================================================
  // 1. 常用元素
  // ==================================================
  const $audio = $("#my-audio");
  const $playBtn = $(".play_song");
  const $pauseBtn = $(".pause_song");
  const $albumCover = $(".Album_Cover");
  const $miniLyric = $(".mini-lyric");
  const $miniLyricTrans = $(".mini-lyric-trans");
  const $container = $("#card-container");

  // 频谱画布（位于大详情页底部）
  const canvas = document.getElementById("visualizer");
  const ctx = canvas ? canvas.getContext("2d") : null;

  // ==================================================
  // 2. 用户名：第一次进站时询问，存到 localStorage
  // ==================================================
  let savedName = localStorage.getItem("username");

  if (!savedName) {
    const inputName = prompt("请输入您的用户名:");

    if (inputName && inputName.trim() !== "") {
      savedName = inputName.trim();
      localStorage.setItem("username", savedName);
    } else {
      savedName = "默认用户";
    }
  }

  $(".username").text(savedName);

  // ==================================================
  // 3. 歌名滚动：超长时用 marquee 动画滚动
  // ==================================================
  function updateSongNameScroll() {
    document.querySelectorAll(".songName").forEach((el) => {
      el.classList.remove("animate-marquee", "w-max", "min-w-full");
      el.classList.add("w-full", "truncate");

      // 文字比容器宽，就换成滚动
      if (el.scrollWidth > el.clientWidth) {
        el.classList.remove("truncate", "w-full");
        el.classList.add("w-max", "min-w-full", "animate-marquee");
      }
    });
  }

  // ==================================================
  // 4. 歌词：LRC 解析 / 加载 / 按进度更新
  // ==================================================
  let lyricLines = []; // [{ time: 秒, text: 原文, trans: 翻译 }]
  let currentOffset = 0; // 当前歌曲的歌词偏移（秒）

  // 每首歌的偏移：正数 = 歌词延后出现，负数 = 提前出现
  const LYRIC_OFFSETS = {
    "LRC/INTERNET OVERDOSE - NEEDY GIRL OVERDOSE _ KOTOKO _ Aiobahn +81.lrc": 1.6,
  };

  // 解析 LRC：一行形如 [01:23.45]原文（翻译）
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

      if (content || trans) {
        result.push({ time: time, text: content, trans: trans });
      }
    });

    return result;
  }

  // 切歌时调用：清空旧歌词，读取新歌词
  function loadLyric(url) {
    lyricLines = [];
    currentOffset = LYRIC_OFFSETS[url] || 0;

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

  // 播放进度变化时，显示当前这一句
  function updateMiniLyric() {
    if (!lyricLines.length || !$audio[0]) return;

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

  // ==================================================
  // 5. 音频频谱：详情页底部的柱状条（纯随机律动）
  // ==================================================
  let visualizerStarted = false;

  let barHeights = []; // 每根柱子的当前高度
  let barPeaks = []; // 每根柱子的峰值帽
  let barTargets = []; // 每根柱子当前的随机目标值（0~1）
  let barNextChange = []; // 下一次换目标的时间戳
  let barSeeds = []; // 每根柱子固定的随机权重，让鼓点冲击参差不齐

  const BAR_COUNT = 48; // 柱子数量
  const BAR_GAP = 6; // 柱子间距
  const BEAT_INTERVAL = 420; // 鼓点间隔（毫秒），越小越躁

  // ---------- 封面取色：让柱子跟着专辑封面变色 ----------
  let vizBase = [140, 210, 255]; // 当前主色（默认青蓝）
  const colorCache = {}; // 每张封面只取一次色

  function rgba(color, alpha) {
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
  }

  function lift(color, factor) {
    return color.map((v) => Math.min(255, Math.round(v * factor)));
  }

  // 把封面缩小后统计颜色，挑「面积够大且足够鲜艳」的那一个
  function pickCoverColor(img) {
    const size = 96;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const cctx = c.getContext("2d");
    cctx.drawImage(img, 0, 0, size, size);

    const { data } = cctx.getImageData(0, 0, size, size);
    const buckets = new Map();

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (lum < 25 || lum > 240) continue;

      const key = `${r >> 4},${g >> 4},${b >> 4}`;
      const item = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 };
      item.r += r;
      item.g += g;
      item.b += b;
      item.n++;
      buckets.set(key, item);
    }

    const all = [...buckets.values()];
    if (!all.length) return null;

    const maxN = Math.max(...all.map((i) => i.n));
    const saturation = (item) => {
      const r = item.r / item.n;
      const g = item.g / item.n;
      const b = item.b / item.n;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      return max === 0 ? 0 : (max - min) / max;
    };

    // 只考虑有一定面积的色块（至少占到最大色块的 8%），再从中挑最鲜艳的
    const vivid = all.filter((i) => i.n >= maxN * 0.08);
    const best = (vivid.length ? vivid : all).sort(
      (a, b) => saturation(b) - saturation(a),
    )[0];

    let color = [
      Math.round(best.r / best.n),
      Math.round(best.g / best.n),
      Math.round(best.b / best.n),
    ];

    // 主色太暗就把亮度拉起来，保证柱子在深色背景上看得见
    const lum = 0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2];
    if (lum < 150) {
      const t = ((150 - lum) / (255 - lum)) * 0.85;
      color = color.map((v) => Math.round(v + (255 - v) * t));
    }

    return color;
  }

  function updateVizColors(src) {
    if (!src) return;

    if (colorCache[src]) {
      vizBase = colorCache[src];
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      try {
        const color = pickCoverColor(img);
        if (color) {
          colorCache[src] = color;
          vizBase = color;
        }
      } catch (error) {
        // 图片跨域时读不到像素，保留默认色即可
      }
    };
    img.src = src;
  }

  function initVisualizer() {
    if (visualizerStarted) return; // 只启动一次
    visualizerStarted = true;
    drawVisualizer();
  }

  function drawVisualizer() {
    if (!ctx) return;
    requestAnimationFrame(drawVisualizer);

    // 详情页没打开就不画，省性能
    if ($("#detail-page").hasClass("hidden")) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const paused = $audio[0].paused;
    const count = BAR_COUNT;
    const barWidth = Math.max(2, canvas.width / count - BAR_GAP);
    const maxHeight = canvas.height - 6;
    const now = performance.now();

    if (barHeights.length !== count) {
      barHeights = new Array(count).fill(0);
      barPeaks = new Array(count).fill(0);
      barTargets = new Array(count).fill(0).map(() => 0.2 + Math.random() * 0.6);
      barNextChange = new Array(count).fill(0);
      barSeeds = new Array(count).fill(0).map(() => 0.5 + Math.random() * 0.5);
    }

    // 每 420ms 一次「鼓点」，冲击后快速衰减
    const beat = Math.exp(-((now % BEAT_INTERVAL) / BEAT_INTERVAL) * 7);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 柱体渐变：用封面主色，底部偏暗、顶部提亮
    const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
    grad.addColorStop(0, rgba(lift(vizBase, 0.85), 0.55));
    grad.addColorStop(0.6, rgba(lift(vizBase, 1.2), 0.85));
    grad.addColorStop(1, "rgba(255, 255, 255, 0.98)");

    for (let i = 0; i < count; i++) {
      // 每根柱子错开换目标，避免整排整齐划一地一起动
      if (now > barNextChange[i]) {
        barTargets[i] = 0.12 + Math.random() * 0.88;
        barNextChange[i] = now + 90 + Math.random() * 170;
      }

      // 一层缓慢的波浪，让整排看起来在「流动」
      const wave = ((Math.sin(now / 420 + i * 0.4) + 1) / 2) * 0.25;

      // 随机目标 + 波浪 + 鼓点冲击
      const targetValue = Math.min(
        1,
        barTargets[i] * 0.7 + wave + beat * 0.4 * barSeeds[i],
      );
      const target = paused ? 0 : targetValue * maxHeight;

      // 上升快、回落稍慢，看起来有弹性
      const speed = target > barHeights[i] ? 0.65 : 0.32;
      barHeights[i] += (target - barHeights[i]) * speed;

      // 峰值帽：先跟住柱子，之后缓慢下落
      barPeaks[i] = Math.max(barPeaks[i] - 1.8, barHeights[i]);

      const height = barHeights[i];
      if (height < 0.5) continue;

      const x = i * (barWidth + BAR_GAP);
      const radius = Math.min(3, barWidth / 2);

      ctx.fillStyle = grad;
      ctx.beginPath();
      // 不支持 roundRect 的浏览器退回直角矩形
      if (ctx.roundRect) {
        ctx.roundRect(x, canvas.height - height, barWidth, height, radius);
      } else {
        ctx.rect(x, canvas.height - height, barWidth, height);
      }
      ctx.fill();

      // 顶部小亮点：制造「跳」的感觉
      if (!paused && barPeaks[i] > 2) {
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.fillRect(x, canvas.height - barPeaks[i] - 7, barWidth, 3);
        // 亮点外侧再描一层淡光，颜色跟着封面走
        ctx.fillStyle = rgba(lift(vizBase, 1.3), 0.35);
        ctx.fillRect(x - 1, canvas.height - barPeaks[i] - 9, barWidth + 2, 7);
      }
    }
  }

  // ==================================================
  // 6. 播放 / 暂停
  // ==================================================
  $audio.on("play", function () {
    $playBtn.addClass("hidden");
    $pauseBtn.removeClass("hidden");
    $albumCover.removeClass("[animation-play-state:paused]");

    // 播放时显示卡片的「正在播放」小圆点
    if (playingCard) playingCard.find(".playing-dot").removeClass("hidden");

    initVisualizer();
  });

  $audio.on("pause", function () {
    $playBtn.removeClass("hidden");
    $pauseBtn.addClass("hidden");
    $albumCover.addClass("[animation-play-state:paused]");

    // 暂停时隐藏小圆点，但卡片的高亮边框保留
    if (playingCard) playingCard.find(".playing-dot").addClass("hidden");
  });

  $playBtn.on("click", () => $audio[0].play());
  $pauseBtn.on("click", () => $audio[0].pause());

  // ==================================================
  // 7. 歌曲数据
  // ==================================================
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
  ];

  // ==================================================
  // 8. 渲染歌曲卡片
  // ==================================================
  const htmlString = songs
    .map(
      (song) => `
        <div class="song-card relative text-center w-full h-full bg-white/30 rounded-lg p-2 flex flex-col cursor-pointer group transition"
             data-id="${song.id}"
             data-src="${song.audio}"
             data-lrc="${song.lrcUrl || ""}">
            <span class="playing-dot hidden absolute top-2 right-2 w-3 h-3 rounded-full bg-white ring-2 ring-black/30 shadow-md animate-pulse"></span>
            <img src="${song.cover}" class="w-full aspect-square object-cover rounded-md shadow-md" alt="专辑图片">
            <div class="h-full bg-linear-to-t from-white/30 to-transparent rounded-md">
                <p class="singer font-japan-bit text-[10px] w-full truncate mt-2 group-hover:text-blue-500">${song.singer}</p>
                <p class="name font-japan-bit text-[15px] w-full line-clamp-2 text-[#373838] group-hover:text-blue-400">${song.name}</p>
            </div>
        </div>
    `,
    )
    .join("");

  $container.html(htmlString);

  // ==================================================
  // 9. 点击卡片切歌
  // ==================================================
  // 高亮当前正在播放的卡片
  let playingCard = null;

  function highlightPlayingCard($card) {
    $(".song-card")
      .removeClass("ring-2 ring-white/80 bg-white/40")
      .find(".playing-dot")
      .addClass("hidden");

    playingCard = $card && $card.length ? $card : null;
    if (!playingCard) return;

    playingCard.addClass("ring-2 ring-white/80 bg-white/40");
    if (!$audio[0].paused) {
      playingCard.find(".playing-dot").removeClass("hidden");
    }
  }

  $container.on("click", ".song-card", function () {
    const audioSrc = $(this).data("src");
    const songName = $(this).find(".name").text();
    const singerName = $(this).find(".singer").text();
    const coverSrc = $(this).find("img").attr("src");

    if (!audioSrc) {
      alert("这首歌还没上传音频哦！");
      return;
    }

    loadLyric($(this).data("lrc"));

    // 让封面旋转动画从头开始：先移除、强制重排、再加回暂停状态
    $albumCover.removeClass("animate-[spin_8s_linear_infinite]");
    void $albumCover[0].offsetWidth;
    $albumCover.addClass(
      "animate-[spin_8s_linear_infinite] [animation-play-state:paused]",
    );

    // 换源并播放（play 事件里会解除暂停状态）
    $audio.attr("src", audioSrc)[0].play();

    // 同步播放栏和详情页信息
    $(".songName").text(songName);
    updateSongNameScroll();
    $(".singerName").text(singerName);
    $albumCover.attr("src", coverSrc);
    $("#detail-bg").css("background-image", `url(${coverSrc})`);

    // 频谱柱子跟着新封面换色
    updateVizColors(coverSrc);

    // 高亮这张卡片
    highlightPlayingCard($(this));
  });

  // ==================================================
  // 10. 音量控制
  // ==================================================
  $("#volume-btn").on("click", function () {
    $("#volume-panel").toggle();
  });

  $("#volume-slider").on("input", function () {
    $audio[0].volume = $(this).val();
  });

  // ==================================================
  // 11. 大详情页
  // ==================================================
  function openDetail() {
    if (!$("#detail-page").hasClass("hidden")) return;

    // 默认用当前专辑封面做背景
    const currentCover = $(".Album_Cover").first().attr("src");
    $("#detail-bg").css("background-image", `url('${currentCover}')`);

    $("#detail-page").removeClass("hidden").addClass("flex flex-col");
    updateSongNameScroll();
  }

  // 点播放栏的歌名或歌词打开详情页
  $("#song-info, .mini-lyric").on("click", openDetail);

  $("#detail-close").on("click", function () {
    $("#detail-page").addClass("hidden").removeClass("flex flex-col");
  });

  // ==================================================
  // 12. 初始化
  // ==================================================
  updateSongNameScroll();

  // 首屏就用当前封面的主色给频谱上色
  updateVizColors($(".Album_Cover").first().attr("src"));
});
