(function () {
  var conf = CONFIG;
  var form = document.getElementById("prompt");
  var box = document.getElementById("box");
  var out = document.getElementById("out");
  var history = load();
  var pos = history.length;
  var newTab = false;

  document.getElementById("ps1").innerHTML = '<span class="u">' + esc(conf.user) + '</span>@<span class="h">' +
    esc(conf.host) + '</span>:<span class="p">~</span>$ ';

  // Commands that print something. They return false when they can't run.
  var builtins = {
    help: function () {
      print('<span class="ok">builtins</span>');
      print(cols([
        row("ls", "list bookmarks"), row("cd <name>", "open a bookmark"),
        row("open <url>", "go to a url"), row("history", "show history"),
        row("clear", "clear the screen"), row("date", "current date"),
        row("whoami", "who are you"), row("echo <text>", "print text")
      ]));
      print('<span class="ok">search</span>');
      print(cols(Object.keys(conf.engines).map(function (k) {
        return row(k + " <q>", conf.engines[k].desc);
      })));
      print('<span class="dim">tab completes, ↑/↓ walks history, ctrl+enter opens in a new tab, esc clears</span>');
    },
    ls: function () {
      print(cols(Object.keys(conf.bookmarks).map(function (k) {
        return '<a href="' + esc(conf.bookmarks[k]) + '">' + esc(k) + '/</a>';
      })));
    },
    history: function () {
      history.forEach(function (h, i) {
        print('<span class="dim">' + pad(i + 1) + '</span>  ' + esc(h));
      });
    },
    clear: function () {},
    date: function () {
      print(esc(new Date().toString()));
    },
    whoami: function () {
      print(esc(conf.user));
    },
    echo: function (arg) {
      if (!arg) return false;
      print(esc(arg));
    }
  };

  // Turns the input into { link, keep } where keep says if it belongs in history.
  // Searches run but aren't kept, so typos and one-off queries don't pile up.
  function resolve(input) {
    var parts = input.match(/^(\S+)\s*(.*)$/);
    var cmd = parts[1], arg = parts[2];

    if (cmd === "cd") return conf.bookmarks[arg] && { link: conf.bookmarks[arg], keep: true };
    if (cmd === "open") return arg && { link: url(arg), keep: true };
    if (conf.engines[cmd]) {
      var e = conf.engines[cmd];
      return arg ? { link: e.url.replace("%s", encodeURIComponent(arg)), keep: false } : { link: e.home, keep: true };
    }
    if (conf.bookmarks[input]) return { link: conf.bookmarks[input], keep: true };
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(input) || /^https?:\/\//.test(input)) return { link: url(input), keep: true };
  }

  function known(cmd) {
    return cmd === "cd" || cmd === "open" || !!conf.engines[cmd];
  }

  function run(input) {
    var cmd = input.split(/\s+/)[0];
    out.innerHTML = "";

    if (builtins[cmd]) {
      if (builtins[cmd](input.slice(cmd.length).trim()) === false) return fail();
      return remember(input);
    }

    var r = resolve(input);
    if (!r && !known(cmd)) print('<span class="err">' + esc(cmd) + ': command not found</span>, try <span class="u">help</span>');
    if (!r) return fail();
    if (r.keep) remember(input);
    if (newTab) window.open(r.link, "_blank");
    else window.location.href = r.link;
  }

  function remember(input) {
    if (history[history.length - 1] !== input) history.push(input);
    pos = history.length;
    save();
  }

  function url(s) {
    return /^[a-z]+:\/\//i.test(s) ? s : "https://" + s;
  }

  function complete() {
    var val = box.value;
    var space = val.indexOf(" ");
    var pool = space === -1 ?
      ["cd", "open"].concat(Object.keys(builtins), Object.keys(conf.engines), Object.keys(conf.bookmarks)) :
      (val.slice(0, space) === "cd" ? Object.keys(conf.bookmarks) : []);
    var word = space === -1 ? val : val.slice(space + 1);
    var hits = pool.filter(function (k) { return k.indexOf(word) === 0; });
    if (!hits.length) return;

    var common = hits.reduce(function (a, b) {
      var i = 0;
      while (i < a.length && a[i] === b[i]) i++;
      return a.slice(0, i);
    });
    box.value = (space === -1 ? "" : val.slice(0, space + 1)) + common + (hits.length === 1 ? " " : "");
  }

  function fail() {
    form.classList.remove("fail");
    void form.offsetWidth;
    form.classList.add("fail");
    return false;
  }

  function print(html) {
    var div = document.createElement("div");
    div.className = "line";
    div.innerHTML = html;
    out.appendChild(div);
  }

  function cols(items) {
    return '<div class="cols">' + items.map(function (i) { return "<span>" + i + "</span>"; }).join("") + "</div>";
  }

  function row(name, desc) {
    return '<span class="u">' + esc(name) + '</span> <span class="dim">' + esc(desc) + "</span>";
  }

  function pad(n) {
    return ("   " + n).slice(-4);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem("history")) || [];
    } catch (e) {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem("history", JSON.stringify(history.slice(-100)));
    } catch (e) {}
  }

  history = history.filter(function (h) {
    var cmd = h.split(/\s+/)[0];
    if (builtins[cmd]) return true;
    var r = resolve(h);
    return r && r.keep;
  });
  pos = history.length;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var input = box.value.trim();
    if (!input) return;
    if (run(input) === false) return;
    box.value = "";
  });

  box.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      newTab = e.ctrlKey || e.metaKey;
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (pos > 0) box.value = history[--pos];
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      pos = Math.min(pos + 1, history.length);
      box.value = history[pos] || "";
    } else if (e.key === "Escape" || (e.key === "c" && e.ctrlKey && !window.getSelection().toString())) {
      box.value = "";
      out.innerHTML = "";
      pos = history.length;
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      out.innerHTML = "";
    }
  });

  document.addEventListener("keydown", function (e) {
    if (document.activeElement !== box && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) box.focus();
  });

  box.focus();
})();
