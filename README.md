# Movie Night Polls

A serverless, peer-to-peer movie voting app. Create a poll, nominate movies, and rank them — no account, no server, no data leaving your browser.

**[Live demo →](https://abrahammurciano.github.io/movie-night-polls/)**

## How it works

1. **Create a poll** — you get a 6-character code and a shareable link/QR code
2. **Everyone nominates** — each participant searches [TMDB](https://www.themoviedb.org/) and picks one movie
3. **Everyone votes** — rank the nominations in order of preference
4. **See the winner** — [instant-runoff voting](https://en.wikipedia.org/wiki/Instant-runoff_voting) determines the result

No sign-up required. The host controls phase transitions (nominations → voting → results). Voting closes automatically once all participants have submitted a ballot.

## Architecture

The app is entirely client-side. Peers discover each other via [Nostr](https://nostr.com/) relays and then communicate directly over WebRTC using [Trystero](https://github.com/dmotz/trystero). The shared state is an append-only event log replicated across peers using [Yjs](https://github.com/yjs/yjs) CRDTs — so every peer always converges to the same state, even if they join late or messages arrive out of order.

The Yjs document is also persisted to `localStorage`, so polls survive a page refresh.

## Tech stack

| | |
|---|---|
| [Vite](https://vite.dev/) + [React](https://react.dev/) | Build tooling and UI |
| [Trystero](https://github.com/dmotz/trystero) (Nostr transport) | P2P peer discovery and WebRTC data channels |
| [Yjs](https://github.com/yjs/yjs) | CRDT-based replicated event log |
| [TMDB API](https://developer.themoviedb.org/) | Movie search, posters, metadata |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |

## Development

```sh
npm install
npm run dev
npm run test
```

To simulate multiple participants in one browser, open tabs with `?session=1`, `?session=2`, etc.

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via the included Actions workflow.
Pull requests also run a deployment-equivalent build in CI with `VITE_BASE_PATH=/movie-night-polls/dev/<pr-number>/`, and CI comments the preview URL on the PR.

To deploy manually:

```sh
npm run build   # outputs to dist/
```
