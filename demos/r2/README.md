# r2

R2 (object storage) basics: streaming upload, download, list, delete.

Uploads and downloads are streamed — the Worker never buffers the whole
object in memory.

## Routes

| Method | Path          | Description            |
| ------ | ------------- | ---------------------- |
| GET    | `/files`      | List objects           |
| GET    | `/files/:key` | Download (streamed)    |
| PUT    | `/files/:key` | Upload body (streamed) |
| DELETE | `/files/:key` | Delete an object       |

## Run

```sh
pnpm -F r2 dev
```

```sh
curl -X PUT localhost:8787/files/hello.txt -H 'content-type: text/plain' -d 'hello r2'
curl localhost:8787/files/hello.txt
curl localhost:8787/files
```

## Deploy

```sh
wrangler r2 bucket create cf-demos-r2
pnpm -F r2 deploy
```
