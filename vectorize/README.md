# vectorize

Vectorize basics: semantic search. Texts are embedded with Workers AI
(`bge-base-en-v1.5`, 768 dims) and stored in a Vectorize index; a query
embeds the search text and returns the nearest notes.

Setup (the index lives on your account — both bindings are `"remote": true`):

```sh
wrangler vectorize create cf-demos-notes --dimensions=768 --metric=cosine
```

## Routes

| Method | Path      | Description                           |
| ------ | --------- | ------------------------------------- |
| POST   | `/notes`  | `{ "id", "text" }` → embed and upsert |
| GET    | `/search` | `?q=...` → top-3 nearest notes        |

## Run

```sh
pnpm -F vectorize dev
```

```sh
curl -X POST localhost:8787/notes -H 'content-type: application/json' -d '{"id":"1","text":"I love ramen"}'
curl -X POST localhost:8787/notes -H 'content-type: application/json' -d '{"id":"2","text":"Cloudflare Workers is a serverless platform"}'
curl 'localhost:8787/search?q=noodle+soup'
```

## Deploy

```sh
pnpm -F vectorize deploy
```
