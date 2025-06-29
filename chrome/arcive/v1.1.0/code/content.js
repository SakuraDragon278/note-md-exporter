// console.log("content.js 実行開始");

// ユーティリティ関数：HTMLをMarkdownに変換（基本）
function convertToMarkdown(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const tag = node.tagName.toLowerCase();
  const children = Array.from(node.childNodes).map(convertToMarkdown).join('');

  switch (tag) {
    case 'textarea': return `# ${children}\n\n================\n\n`;
    case 'h2': return `## ${children}\n\n`;
    case 'h3': return `### ${children}\n\n`;
    case 'p': return `${children.trim()}\n\n`;
    case 'strong': return `**${children.trim()}**`;
    // case 'em': return `*${children.trim()}*`;
    case 'ul': return `${Array.from(node.children).map(li => `- ${convertToMarkdown(li).trim()}`).join('\n')}\n\n`;
    case 'ol': return `${Array.from(node.children).map((li, i) => `${i + 1}. ${convertToMarkdown(li).trim()}`).join('\n')}\n\n`;
    case 'li': return `${children.trim()}`;
    case 'br': return `\n`;
    case 'hr': return `---\n\n`;
    case 'img': {
      const figure = node.closest("figure");
      const caption = figure ? figure.querySelector("figcaption") : null;
      const alt = caption ? caption.textContent.trim() : node.alt || '（altなし）';
      return `画像（alt: ${alt}）\n\n`;
    }
    case 'blockquote': {
      const figure = node.closest("figure");
      const caption = figure ? figure.querySelector("figcaption") : null;
      const alt = caption ? caption.textContent.trim() : node.alt || '（altなし）';
      return `${children.split('\n').map(line => `| ${line}`).join('\n')}（alt: ${alt}）\n\n`;
    }
    case 'table-of-contents': return `===目次===\n\n`;
    case 'figcaption': return ``
    default: return children;
  }
}

function insertExportButton() {
  if (document.getElementById("note-md-export-button")) {
    console.log("エクスポートボタンはすでに存在します");
    return true;
  }

  const headerContainer = document.querySelector(
    "body > div > div > div > div > div > header > div > div > div"
  );
  if (!headerContainer) {
    console.log("headerContainer がまだ見つかりません");
    return false;
  }

  // console.log("エクスポートボタンを追加します");

  const button = document.createElement("button");
  button.id = "note-md-export-button";
  button.setAttribute("data-name", "Button");
  button.setAttribute("type", "button");
  button.setAttribute(
    "class",
    "relative m-0 inline-flex cursor-pointer touch-manipulation appearance-none items-center justify-center overflow-hidden whitespace-nowrap rounded bg-surface-normal text-center align-top font-base font-bold no-underline transition-colors duration-200 ease-inOutExpo border border-solid border-border-default text-text-primary min-h-[2rem] px-3 text-xs outline-0 hover:outline-0 focus:outline-0 active:outline-0 outline-none"
  );
  button.setAttribute("style", "user-select: none;");
  button.innerHTML = `
    <span data-name="reaction-overlay" class="absolute inset-0 block overflow-hidden before:absolute before:inset-0 before:opacity-0 before:transition-opacity before:duration-200 before:ease-inOutExpo after:absolute after:inset-0 after:opacity-0 after:transition-opacity after:duration-200 after:ease-inOutExpo z-0 before:bg-reactionOverlay after:bg-reactionOverlay"></span>
    <span class="relative flex items-center justify-center font-bold">エクスポート</span>
  `;

  button.onclick = () => {
    // console.log("エクスポートボタンがクリックされました");

    const main = document.querySelector("body > div > div > div > div > div > main > div:last-child");
    if (!main) {
      console.log("本文要素が見つかりません");
      alert("本文が見つかりませんでした。");
      return;
    }

    let title = `${document.querySelector("body > div > div > div > div > div > main > textarea").textContent}`;
    var text = `# ${title}\n\n`;

    text += convertToMarkdown(main).trim();

    console.log(text)

    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Note_${new Date().toISOString().slice(0,10).replace(/-/g,"")}_${new Date().toTimeString().slice(0,5).replace(/:/g,"")}_${title.replace(/ /g, "_")}.md`;
;
    a.click();
    URL.revokeObjectURL(url);
    console.log("Markdownファイルをダウンロードしました");
  };

  headerContainer.insertBefore(button, headerContainer.firstChild);

  return true;
}

function waitForButtonsAndInsert() {
  const btn = document.querySelector("body > div > div > div > div > div > header > div > div > div > button");

  if (btn) {
    // console.log("ボタンが存在したのでエクスポートボタンを追加します");
    insertExportButton();
    return true;
  }
  return false;
}

function watchDomChanges() {
  if (waitForButtonsAndInsert()) return;

  function startObserving() {
    const body = document.body;
    if (!body) {
      // console.log("document.body がまだ存在しないため、少し待機します");
      setTimeout(startObserving, 100);
      return;
    }

    // console.log("MutationObserver を開始します");
    const observer = new MutationObserver(() => {
      if (waitForButtonsAndInsert()) {
        // console.log("条件を満たしたので MutationObserver を停止します");
        observer.disconnect();
      }
    });

    observer.observe(body, { childList: true, subtree: true });
  }
  // console.log("startObserving()");
  startObserving();
}


// console.log("即時実行で watchDomChanges を呼び出します");
watchDomChanges();

// SPA対応の監視追加
(function () {
  // console.log("SPA監視ロジックを初期化します");

  const originalPushState = history.pushState;
  history.pushState = function () {
    // console.log("pushState が呼び出されました");
    originalPushState.apply(this, arguments);
    setTimeout(() => {
      // console.log("pushState後にwatchDomChangesを実行します");
      watchDomChanges();
    }, 300);
  };

  window.addEventListener('popstate', () => {
    // console.log("popstate イベントを検知しました（戻る・進む）");
    setTimeout(() => {
      // console.log("popstate後にwatchDomChangesを実行します");
      watchDomChanges();
    }, 300);
  });

  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      // console.log(`URL変化を検知: ${lastUrl} → ${location.href}`);
      lastUrl = location.href;
      if (!/^https:\/\/editor\.note\.com\/notes\/[^/]+\/edit\/?$/.test(location.href)) return;
      setTimeout(() => {
        // console.log("URL変化後にwatchDomChangesを実行します");
        watchDomChanges();
      }, 0);
    }
  }, 500);
})();

