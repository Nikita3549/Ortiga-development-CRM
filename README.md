1. Создайте .env файл

И вставьте в него: 

DATABASE_URL="postgresql://postgres:dbDevPassword@db/ortiga-crm?schema=public"

DATABASE_USER=postgres
DATABASE_PASSWORD=dbDevPassword
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_DBNAME=ortiga-crm
DATABASE_SCHEMA=public

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redisDevPassword

API_PORT=3000

JWT_SECRET=S9lQqjREjzolA8IOqn6LpTezyiZQTdNT

FRONTEND_DOMEN=https://app.example.com

2. Скачайте докер с офицального сайта и в корне проекта запустите команду:
    docker-compose --profile api up

3. API будет доступно по порту 3000, (http://localhost:3000/v1). Спецификация находится в файле specification.yaml

