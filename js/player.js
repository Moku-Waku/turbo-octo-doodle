// ==================== 播放器 ====================
// 音频播放 / 暂停、LRC 歌词解析与同步、频谱、音量。
// 卡片不在这里处理：卡片只负责调用 AppPlayer.play(song)。
(function ($) {
  "use strict";

  // 脚本在 body 末尾引入，此时这些元素已经存在
  const $audio = $("#my-audio");
  const $playBtn = $(".play_song");
  const $pauseBtn = $(".pause_song");
  const $albumCover = $(".Album_Cover");
  const $miniLyric = $(".mini-lyric");
  const $miniLyricTrans = $(".mini-lyric-trans");

  // 频谱画布（位于大详情页底部）
  const canvas = document.getElementById("visualizer");
  const ctx = canvas ? canvas.getContext("2d") : null;

  // ==================================================
  // 1. 歌词：LRC 解析 / 加载 / 按进度更新
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
  // 2. 音频频谱：详情页底部的柱状条（纯随机律动）
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
      barTargets = new Array(count)
        .fill(0)
        .map(() => 0.2 + Math.random() * 0.6);
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
  // 3. 播放 / 暂停
  // ==================================================
  $audio.on("play", function () {
    $playBtn.addClass("hidden");
    $pauseBtn.removeClass("hidden");
    $albumCover.removeClass("[animation-play-state:paused]");
    initVisualizer();
  });

  $audio.on("pause", function () {
    $playBtn.removeClass("hidden");
    $pauseBtn.addClass("hidden");
    $albumCover.addClass("[animation-play-state:paused]");
  });

  $playBtn.on("click", () => $audio[0].play());
  $pauseBtn.on("click", () => $audio[0].pause());

  // ==================================================
  // 4. 音量控制
  // ==================================================
  $("#volume-btn").on("click", function () {
    $("#volume-panel").toggle();
  });

  $("#volume-slider").on("input", function () {
    $audio[0].volume = $(this).val();
  });

  // ==================================================
  // 5. 切歌：换源、更新播放栏信息、换频谱颜色
  // ==================================================
  // song: { audio, lrcUrl, name, singer, cover }
  function play(song) {
    if (!song || !song.audio) return;

    loadLyric(song.lrcUrl);

    // 让封面旋转动画从头开始：先移除、强制重排、再加回暂停状态
    $albumCover.removeClass("animate-[spin_8s_linear_infinite]");
    void $albumCover[0].offsetWidth;
    $albumCover.addClass(
      "animate-[spin_8s_linear_infinite] [animation-play-state:paused]",
    );

    // 换源并播放（play 事件里会解除暂停状态）
    $audio.attr("src", song.audio)[0].play();

    // 同步播放栏和详情页信息
    $(".songName").text(song.name);
    $(".singerName").text(song.singer);
    $albumCover.attr("src", song.cover);
    $("#detail-bg").css("background-image", `url(${song.cover})`);

    // 频谱柱子跟着新封面换色
    updateVizColors(song.cover);

    if (window.AppUI) window.AppUI.updateSongNameScroll();
  }

  // ==================================================
  // 6. 初始化：首屏就用当前封面的主色给频谱上色
  // ==================================================
  $(function () {
    updateVizColors($albumCover.first().attr("src"));
  });

  window.AppPlayer = {
    play,
    pause: () => $audio[0].pause(),
    resume: () => $audio[0].play(),
    setVolume: (value) => {
      $audio[0].volume = value;
    },
    updateVizColors,
  };
})(jQuery);