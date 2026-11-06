<h1 align=center>terminal-start</h1>
<h5 align=center>a bash-flavored startpage for firefox</h5>

A tribute to [yuune's vimstart](https://github.com/yuune/yuune-vim-startpage). Same idea, but instead of
vim `:keys` you get a small shell: type a command, hit enter, go.

```
kai@firefox:~$ yt lofi hip hop
kai@firefox:~$ gh firefox userchrome
kai@firefox:~$ cd github
kai@firefox:~$ open news.ycombinator.com
```

### Commands

| command | does |
| --- | --- |
| `search <q>` | google |
| `yt <q>` | youtube |
| `ytm <q>` | youtube music |
| `gh <q>` | github |
| `r <q>` | reddit |
| `maps <q>` | google maps |
| `amz <q>`, `ml <q>` | amazon, mercadolibre |
| `steam <q>` | steam store |
| `cr <q>` | crunchyroll |
| `cd <name>` | open a bookmark (or just type its name) |
| `open <url>` | go to a url (typing a bare domain works too) |
| `help`, `ls`, `history`, `clear`, `date`, `whoami`, `echo` | the usual |

Anything that is not a command, bookmark or url prints `command not found` and points you to `help`.

Engines with no query open their homepage, so `yt` alone takes you to youtube.

### Keys

- `tab` completes commands and bookmarks
- `↑` / `↓` walks through history
- `ctrl+enter` opens the result in a new tab
- `esc` / `ctrl+c` drops the current line

Opening a site doesn't print anything, it just goes. If a command can't run (like `cd` to a bookmark that
doesn't exist) the prompt shakes.

History only keeps commands that worked, and searches are never saved, so typos like `search asdfkjh`
don't come back when you press `↑`.

### Installation

```
git clone https://github.com/kaitsubaka/terminal-start.git
```

**Homepage:** in firefox go to `about:preferences#home`, set *Homepage and new windows* to *Custom URLs*
and paste the path to `home.html`, e.g. `file:///C:/Users/kai/terminal-start/home.html`.

**New tab:** firefox doesn't let you pick a local file for new tabs out of the box. The easiest way is an
extension like [New Tab Override](https://addons.mozilla.org/firefox/addon/new-tab-override/) pointed at
the same `file:///` path.

### Editing

Everything lives in [`config.js`](config.js): user and host for the prompt, search engines and bookmarks.
Colors are css variables at the top of [`style.css`](style.css).

The config is a plain script instead of json because firefox blocks `fetch` on `file://` pages.

### License

[MIT](LICENSE). Original work by Yasushi Nanda Vera.
