# Как сделать сайт публичным (GitHub Pages)

## 1. Подготовка

Корневые файлы `index.html` и `jobs.json` уже являются публичным сайтом.
Данные обновляются командой:

```bash
npm run export:json
```

`index.html` сначала запрашивает локальный `/api/jobs` (при `npm run viewer`),
а на GitHub Pages автоматически загружает статический `jobs.json`.

## 2. Активация GitHub Pages

1. Откройте репозиторий на GitHub.
2. Перейдите в **Settings -> Pages**.
3. В блоке **Build and deployment** выберите:
   - **Source**: Deploy from a branch.
   - **Branch**: `main`.
   - **Folder**: `/ (root)`.
4. Нажмите **Save**.

## 3. Результат

Через 1-2 минуты появится ссылка вида `https://<user>.github.io/serbia-jobs/`.
После обновления базы выполните `npm run export:json` и запушьте `jobs.json`.
