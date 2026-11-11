// ==================== 页面通用交互 ====================
// 用户名、歌名滚动、大详情页、横向列表翻页。
// 只处理界面，不碰音频播放，播放相关见 player.js。
(function ($) {
  "use strict";

  // ---------- 用户名：第一次进站时询问，存到 localStorage ----------
  function initUsername() {
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
  }

  // ---------- 歌名滚动：超长时用 marquee 动画滚动 ----------
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

  // ---------- 大详情页：点播放栏歌名 / 歌词弹出 ----------
  function openDetail() {
    if (!$("#detail-page").hasClass("hidden")) return;

    // 默认用当前专辑封面做背景
    const currentCover = $(".Album_Cover").first().attr("src");
    $("#detail-bg").css("background-image", `url('${currentCover}')`);

    $("#detail-page").removeClass("hidden").addClass("flex flex-col");
    updateSongNameScroll();
  }

  function closeDetail() {
    $("#detail-page").addClass("hidden").removeClass("flex flex-col");
  }

  // ---------- 横向列表的左右翻页按钮 ----------
  // 推荐歌曲和推荐歌单共用；卡片渲染完再调用，才能算准滚动边界。
  const SCROLL_STEP = 320; // 每点一次翻动的距离

  function bindScrollButtons(trackId, prevId, nextId) {
    const track = document.getElementById(trackId);
    const $prev = $(prevId);
    const $next = $(nextId);
    if (!track || !$prev.length || !$next.length) return;

    // 到边界就把按钮置灰，避免用户以为按钮坏了
    function updateState() {
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      const atStart = track.scrollLeft <= 1;
      const atEnd = track.scrollLeft >= max - 1;

      $prev
        .prop("disabled", atStart)
        .toggleClass("opacity-40 cursor-not-allowed", atStart);
      $next
        .prop("disabled", atEnd)
        .toggleClass("opacity-40 cursor-not-allowed", atEnd);
    }

    $prev.on("click", function () {
      track.scrollBy({ left: -SCROLL_STEP, behavior: "smooth" });
    });

    $next.on("click", function () {
      track.scrollBy({ left: SCROLL_STEP, behavior: "smooth" });
    });

    track.addEventListener("scroll", updateState, { passive: true });
    window.addEventListener("resize", updateState);
    updateState();
  }

  // ---------- 初始化 ----------
  $(function () {
    initUsername();
    updateSongNameScroll();

    $("#song-info, .mini-lyric").on("click", openDetail);
    $("#detail-close").on("click", closeDetail);
  });

  window.AppUI = {
    updateSongNameScroll,
    openDetail,
    closeDetail,
    bindScrollButtons,
  };
})(jQuery);