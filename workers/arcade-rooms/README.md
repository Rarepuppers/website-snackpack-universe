# Thirteen friend rooms

A Cloudflare Worker with one Durable Object per table. The rules run here, so each
browser receives only its own hand. Rooms store a random seat token and the game, with
no names, accounts or chat, and delete themselves after two idle hours. Empty seats are
played by the computer. A disconnected player has 30 seconds to return, and an idle
player is moved on after 60 seconds.

## Test

    node --test workers/arcade-rooms/test/rooms.test.mjs

For a local run, use `npx wrangler@4 dev --local --port 8791 --persist-to <short path>`.
A long path makes the local database fail on Windows with "internal error". Then open
`http://localhost:4191/play/thirteen/?roomsUrl=http://localhost:8791`.

## Go live

1. From this folder, run `npx wrangler@4 deploy` and note the workers.dev URL.
2. Set `ROOMS_URL` in `play/thirteen/rooms.js` to that URL and bump `CACHE` in `sw.js`.
3. Add this section to `privacy/arcade/index.html`, and the bullet "You can invite
   friends to a table with a link" to its summary:
   "Friend tables: when you open a table link, your browser connects to a server run
   on Cloudflare. It holds the cards, whose turn it is and a random seat code stored in
   your browser. There are no names and no chat. Tables are deleted after two idle hours."
4. Set `"playMode"` to `["SinglePlayer", "MultiPlayer"]` in the Thirteen page's schema,
   and add a "Can I play with friends?" FAQ entry.
5. Publish, then play a full game between two devices on the live site.
