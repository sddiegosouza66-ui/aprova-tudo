# Aprova Tudo

Pré-visualizador de posts com links para aprovação pelo WhatsApp. Feito em React + Vite com Tailwind.

## Como rodar
```bash
npm install
npm run dev
```
Abrir http://localhost:5173.

## Build
```bash
npm run build
```

## Deploy no GitHub Pages
- Workflow já incluído em `.github/workflows/deploy.yml`.
- Ajuste do caminho configurado em `vite.config.js` com `base: "/aprova-tudo/"`.
- Basta dar push na branch `main`; o GitHub Actions publica em Pages automaticamente. Depois de ativar Pages (Settings → Pages → Source: GitHub Actions), o site fica em `https://<seu-usuario>.github.io/aprova-tudo/`.
