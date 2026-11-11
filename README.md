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

Anything that is not a command, bookmark or url is searched with `fallback` from the config (google by
default). Those searches don't count as commands: they aren't saved in history and don't change the mode.

Engines with no query open their homepage, so `yt` alone takes you to youtube.

### Mode

The box next to the prompt shows the last command you ran. Text that doesn't start with a command is passed
to it, so `cd` and then `claude` is `cd claude`, and after `yt lofi` (with `ctrl+enter`) typing `jazz` runs
`yt jazz`. A bare `cd`, `open` or `echo` only switches the mode. Commands without arguments like `ls` show up
dimmed and leave the input alone. `backspace` on an empty line drops the mode back to the default search.
The mode lives in the page, so every new tab starts fresh.

### Keys

- `tab` completes commands and bookmarks
- `↑` / `↓` walks through history
- right after `ls`, `history` or a tab that lists several matches, the arrows and `tab` / `shift+tab` pick an
  item from the list and `enter` runs it. Typing anything goes back to the normal keys
- `ctrl+enter` opens the result in a new tab
- `esc` / `ctrl+c` drops the current line
- `backspace` on an empty line drops the mode

Opening a site doesn't print anything, it just goes. If a command can't run (like `cd` to a bookmark that
doesn't exist) the prompt shakes.

History only keeps commands that worked, and searches are never saved, so typos like `search asdfkjh`
don't come back when you press `↑`.

### Installation

Clone it next to your firefox data so it doesn't clutter your desktop:

| os | clone into | `home.html` url |
| --- | --- | --- |
| windows | `%APPDATA%\Mozilla\Firefox` | `file:///C:/Users/<you>/AppData/Roaming/Mozilla/Firefox/terminal-start/home.html` |
| macos | `~/Library/Application Support/Firefox` | `file:///Users/<you>/Library/Application%20Support/Firefox/terminal-start/home.html` |
| linux | `~/.mozilla/firefox` | `file:///home/<you>/.mozilla/firefox/terminal-start/home.html` |

```
git clone https://github.com/kaitsubaka/terminal-start.git
```

Any folder works, just use its path wherever the steps below say `<url>`.

#### Homepage

Find your profile folder in `about:profiles` (*Root Directory* of the profile in use) and create a
`user.js` there:

```js
user_pref("browser.startup.homepage", "<url>?user=<profile name>");
user_pref("browser.startup.page", 1);
```

Firefox reads it on every start. `browser.startup.page` set to `1` opens the homepage instead of restoring
the last session, drop that line if you want to keep your tabs. `?user=` shows the profile name in the
prompt, leave it out to use the `user` from `config.js`.

#### New tab

Firefox can't point new tabs to a local file from its settings, so this uses
[autoconfig](https://support.mozilla.org/kb/customizing-firefox-using-autoconfig). It goes in the firefox
install folder, so it needs admin rights and applies to every user on the machine.

| os | install folder |
| --- | --- |
| windows | `C:\Program Files\Mozilla Firefox` |
| macos | `/Applications/Firefox.app/Contents/Resources` |
| linux | `/usr/lib/firefox` (or `/usr/lib64/firefox`, `/opt/firefox`) |

Snap and flatpak builds keep that folder read-only, so this doesn't work with them. Use the tarball or your
distro's package instead.

1. Create `defaults/pref/autoconfig.js` inside the install folder:

   ```js
   // Loads mozilla.cfg from the install folder, which points new tabs to terminal-start.
   pref("general.config.filename", "mozilla.cfg");
   pref("general.config.obscure_value", 0);
   pref("general.config.sandbox_enabled", false);
   ```

2. Create `mozilla.cfg` in the install folder itself. Firefox skips its first line, so keep the comment:

   ```js
   // Firefox skips the first line of this file.
   // Opens terminal-start on every new tab and gives the prompt focus instead of the url bar.
   // The profile name goes in the url so the prompt shows it as the user.
   try {
     const START = "<url>";
     const { AboutNewTab } = ChromeUtils.importESModule("resource:///modules/AboutNewTab.sys.mjs");
     AboutNewTab.newTabURL = START;

     let named = false;
     Services.obs.addObserver(function (win) {
       if (!named) {
         named = true;
         // Profiles from the profile menu keep their name in their own store, older ones in profiles.ini.
         const { SelectableProfileService } = ChromeUtils.importESModule(
           "resource:///modules/profiles/SelectableProfileService.sys.mjs");
         SelectableProfileService.init().then(function () {
           const profile = SelectableProfileService.currentProfile ||
             Cc["@mozilla.org/toolkit/profile-service;1"].getService(Ci.nsIToolkitProfileService).currentProfile;
           if (profile) AboutNewTab.newTabURL = START + "?user=" + encodeURIComponent(profile.name);
         }).catch(Cu.reportError);
       }

       win.gBrowser.addTabsProgressListener({
         onLocationChange: function (browser, progress, request, location) {
           if (!progress.isTopLevel || location.spec.split("?")[0] !== START) return;
           win.setTimeout(function () {
             if (browser === win.gBrowser.selectedBrowser) browser.focus();
           }, 0);
         }
       });
     }, "browser-delayed-startup-finished");
   } catch (e) {
     Cu.reportError(e);
   }
   ```

3. Quit firefox completely and open it again.

If new tabs still show the default page, check the browser console (`ctrl+shift+j`, `cmd+shift+j` on macos) for errors from
`mozilla.cfg`. A firefox update can remove these files, if that happens copy them back.

### Editing

Everything lives in [`config.js`](config.js): user and host for the prompt (a `?user=` in the url, which
the setup above fills with the profile name, replaces the user), colors for each profile, search engines and bookmarks.
Colors are css variables at the top of [`style.css`](style.css).

The config is a plain script instead of json because firefox blocks `fetch` on `file://` pages.

### License

[MIT](LICENSE). Original work by Yasushi Nanda Vera.
