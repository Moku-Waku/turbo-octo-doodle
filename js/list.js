// ==================== 列表页逻辑 ====================
// 1) 从 sessionStorage 读取上一步点中的歌单封面 / 标题
// 2) 点击简介文字展开 / 收起
// （原 js/songlist.js 中 list 页相关的部分已合并到这里）
$(function () {
  // ---------- 歌单详情：封面 + 标题 ----------
  const savedCover = sessionStorage.getItem("list_cover");
  const savedTitle = sessionStorage.getItem("list_title");

  // sessionStorage 里可能是首页存下的绝对地址，也可能是相对项目根的路径。
  // list.html 自己在 other_pages/ 下，相对路径要补一级 ../
  function resolveCover(src) {
    if (!src) return "../Album_Cover/63／64 Completion.jpg";
    // http: / https: / file: / data: / //cdn... 这类直接用
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src)) return src;
    if (/^(?:\.\.?\/|\/)/.test(src)) return src;
    return "../" + src;
  }

  $("#detail-cover").attr("src", resolveCover(savedCover));

  if (savedTitle) {
    $(".detail-title").text(savedTitle);
  }

  // ---------- 用户名：和首页保持一致 ----------
  const savedName = localStorage.getItem("username");
  if (savedName) {
    $(".username").text(savedName);
  }

  // ---------- 简介展开 / 收起 ----------
  $(".song_desc").on("click", function () {
    // 有 line-clamp-2 就是收起状态，点一下展开；再点一下收起
    $(this).toggleClass("line-clamp-2");
  });
});