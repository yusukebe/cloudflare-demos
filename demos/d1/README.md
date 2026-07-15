# d1

D1 (serverless SQLite) basics: migrations and a `posts` table CRUD.

## Routes

| Method | Path         | Description                    |
| ------ | ------------ | ------------------------------ |
| GET    | `/posts`     | List posts                     |
| GET    | `/posts/:id` | Read a post                    |
| POST   | `/posts`     | `{ "title", "body" }` → create |
| DELETE | `/posts/:id` | Delete a post                  |

## Run

```sh
pnpm -F d1 exec wrangler d1 migrations apply DB --local
pnpm -F d1 dev
```

```sh
curl -X POST localhost:8787/posts -H 'content-type: application/json' -d '{"title":"Hello","body":"First post"}'
curl localhost:8787/posts
```

## Deploy

```sh
wrangler d1 create cf-demos-d1        # put the returned id into wrangler.jsonc
wrangler d1 migrations apply DB --remote
pnpm -F d1 deploy
```
