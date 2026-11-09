(function () {
  var conf = CONFIG;
  var form = document.getElementById("prompt");
  var box = document.getElementById("box");
  var out = document.getElementById("out");
  var modeEl = document.getElementById("mode");
  var history = load();
  var pos = history.length;
  var newTab = false;
  // The last command run. Input that doesn't start with a command is passed to it as the argument.
  var mode = null;

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
      print('<span class="dim">anything else is a ' + esc(conf.fallback) + '. the box next to the prompt is the last ' +
        'command, text that doesn\'t start with a command goes to it (cd, then claude, is cd claude). ' +
        'backspace on an empty line drops it</span>');
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
      print(esc(arg));
    }
  };

  // Turns the input into { link, keep, line } where keep says if it belongs in history and line is how it's
  // saved there. Searches run but aren't kept, so typos and one-off queries don't pile up.
  function resolve(input) {
    var parts = split(input);
    var cmd = parts[0], arg = parts[1];

    if (cmd === "cd") return conf.bookmarks[arg] && { link: conf.bookmarks[arg], keep: true };
    if (cmd === "open") return arg && { link: url(arg), keep: true };
    if (conf.engines[cmd]) return search(cmd, arg);
    if (conf.bookmarks[input]) return { link: conf.bookmarks[input], keep: true, line: "cd " + input };
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(input) || /^https?:\/\//.test(input)) {
      return { link: url(input), keep: true, line: "open " + input };
    }
    return search(conf.fallback, input);
  }

  function search(name, q) {
    var e = conf.engines[name];
    return q ? { link: e.url.replace("%s", encodeURIComponent(q)), keep: false } : { link: e.home, keep: true };
  }

  function isCommand(cmd) {
    return !!builtins[cmd] || cmd === "cd" || cmd === "open" || !!conf.engines[cmd];
  }

  function takesArg(cmd) {
    return cmd === "cd" || cmd === "open" || cmd === "echo" || !!conf.engines[cmd];
  }

  // Prefixes the mode when the input doesn't name a command itself.
  function expand(input) {
    return mode && takesArg(mode) && !isCommand(split(input)[0]) ? mode + " " + input : input;
  }

  function setMode(cmd) {
    mode = cmd;
    modeEl.textContent = mode || conf.fallback;
    modeEl.classList.toggle("idle", !(mode && takesArg(mode)));
  }

  function run(raw) {
    var input = expand(raw);
    var parts = split(input);
    var cmd = parts[0], arg = parts[1];
    out.innerHTML = "";

    // A bare cd, open or echo only switches the mode. Engines open their homepage instead.
    if (!arg && takesArg(cmd) && !conf.engines[cmd]) return setMode(cmd);

    if (builtins[cmd]) {
      if (builtins[cmd](arg) === false) return fail();
      setMode(cmd);
      return remember(input);
    }

    var r = resolve(input);
    if (!r) return fail();
    if (isCommand(cmd)) setMode(cmd);
    if (r.keep) remember(r.line || input);
    if (newTab) window.open(r.link, "_blank");
    else window.location.href = r.link;
  }

  function remember(input) {
    if (history[history.length - 1] !== input) history.push(input);
    pos = history.length;
    save();
  }

  function split(input) {
    var parts = input.match(/^(\S*)\s*(.*)$/);
    return [parts[1], parts[2]];
  }

  function url(s) {
    return /^[a-z]+:\/\//i.test(s) ? s : "https://" + s;
  }

  // Completes against the expanded line, so `cl` under cd completes like `cd cl`.
  function complete() {
    var full = expand(box.value);
    var prefix = full.slice(0, full.length - box.value.length);
    var space = full.indexOf(" ");
    var pool = space === -1 ?
      ["cd", "open"].concat(Object.keys(builtins), Object.keys(conf.engines), Object.keys(conf.bookmarks)) :
      (full.slice(0, space) === "cd" ? Object.keys(conf.bookmarks) : []);
    var word = space === -1 ? full : full.slice(space + 1);
    var hits = pool.filter(function (k) { return k.indexOf(word) === 0; });
    if (!hits.length) return;

    var common = hits.reduce(function (a, b) {
      var i = 0;
      while (i < a.length && a[i] === b[i]) i++;
      return a.slice(0, i);
    });
    box.value = ((space === -1 ? "" : full.slice(0, space + 1)) + common + (hits.length === 1 ? " " : ""))
      .slice(prefix.length);
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
    var cmd = split(h)[0];
    if (builtins[cmd]) return true;
    var r = resolve(h);
    return r && r.keep;
  });
  pos = history.length;
  setMode(null);

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
    } else if (e.key === "Backspace" && !box.value) {
      setMode(null);
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
