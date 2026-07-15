# images

Images binding basics: inspect and transform images inside a Worker —
resize, convert format, all streamed.

## Routes

| Method | Path      | Description                             |
| ------ | --------- | --------------------------------------- |
| POST   | `/info`   | Image body → format and dimensions      |
| POST   | `/resize` | Image body (`?width=200`) → resized PNG |

## Run

```sh
pnpm -F images dev
```

```sh
curl -X POST localhost:8787/info --data-binary @photo.jpg
curl -X POST 'localhost:8787/resize?width=100' --data-binary @photo.jpg -o small.png
```

## Deploy

```sh
pnpm -F images deploy
```
