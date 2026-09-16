pm2 stop client
pm2 delete client

git stash
git fetch
git pull
npm install
npm run build

PORT=3001 pm2 start npm --name "client" -- run start

pm2 save
