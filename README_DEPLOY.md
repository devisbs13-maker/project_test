ьзVercel deployment for the Telegram WebApp (apps/web)

Steps

1) Install Vercel CLI and login

   npm i -g vercel
   vercel login

2) Link and deploy the web app folder

   vercel --cwd apps/web
   vercel deploy --prod --cwd apps/web

Notes

- Use the resulting HTTPS domain (for example, https://your-app.vercel.app) in BotFather as the Telegram WebApp URL (via /setdomain or the Web App configuration for a button). The domain must be HTTPS.
- The app’s Vite base is set to '/', which is correct for Vercel.
- If your API is required, ensure it is accessible over HTTPS and that the client is built with VITE_API_URL pointing to that endpoint.

Build locally (optional)

From the web app folder:

   cd apps/web
   npm install
   npm run build

