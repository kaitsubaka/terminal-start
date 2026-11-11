// Edit this file to make the startpage yours.
var CONFIG = {
  user: "kai",
  host: "firefox",

  // Settings for each firefox profile, by its name. `colors` overrides the variables at the top of style.css.
  profiles: {
    Fluffy: { colors: { user: "#b44dff", ok: "#b44dff" } }
  },

  // Engine used for anything that is not a command, bookmark or url.
  fallback: "search",

  // `<name> <query>` searches with the engine. `%s` is replaced by the query.
  engines: {
    search: { url: "https://www.google.com/search?q=%s", home: "https://www.google.com", desc: "google" },
    yt:     { url: "https://www.youtube.com/results?search_query=%s", home: "https://www.youtube.com", desc: "youtube" },
    ytm:    { url: "https://music.youtube.com/search?q=%s", home: "https://music.youtube.com", desc: "youtube music" },
    gh:     { url: "https://github.com/search?q=%s", home: "https://github.com", desc: "github" },
    r:      { url: "https://www.reddit.com/search/?q=%s", home: "https://www.reddit.com", desc: "reddit" },
    maps:   { url: "https://www.google.com/maps/search/%s", home: "https://www.google.com/maps", desc: "google maps" },
    amz:    { url: "https://www.amazon.com/s?k=%s", home: "https://www.amazon.com", desc: "amazon" },
    ml:     { url: "https://listado.mercadolibre.com.co/%s", home: "https://www.mercadolibre.com.co", desc: "mercadolibre" },
    steam:  { url: "https://store.steampowered.com/search/?term=%s", home: "https://store.steampowered.com", desc: "steam" },
    cr:     { url: "https://www.crunchyroll.com/search?q=%s", home: "https://www.crunchyroll.com", desc: "crunchyroll" }
  },

  // `cd <name>` (or just `<name>`) opens the bookmark.
  bookmarks: {
    claude:  "https://claude.ai/new",
    gemini:  "https://gemini.google.com",
    github:  "https://github.com/kaitsubaka",
    youtube: "https://www.youtube.com",
    prime:   "https://www.primevideo.com",
    crunchy: "https://www.crunchyroll.com",
    twitch:  "https://www.twitch.tv",
    gmail:   "https://mail.google.com",
    drive:   "https://drive.google.com"
  }
};
