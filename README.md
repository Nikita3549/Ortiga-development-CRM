1. Создайте .env файл

И заполните его по образцу(если после равно какое то значение, то оставьте его таким же):

DATABASE_USER=postgres 
DATABASE_PASSWORD= - пароль для базы данных
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_DBNAME=ortiga-crm
DATABASE_SCHEMA=public

Вместо значения в {} вставьте то что вставлено сверху ^
DATABASE_URL="postgresql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_DBNAME}?schema={DATABASE_SCHEMA}"

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD= - пароль от хранилища Redis

Инструкция по настройке yandex.smtp - https://help.reg.ru/support/pochta-i-servisy/google-workspace/nastroyka-pochtovykh-kliyentov-dlya-yandeks-pochtyy#0

YANDEX_LOGIN= - логин для отправки почты через yandex.smtp
YANDEX_PASSWORD= - пароль приложения от yandex.smtp

SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true

API_PORT=3000

JWT_SECRET= - строка из 32 случайных символов

2. Скачайте докер с офицального сайта и в корне проекта запустите команду:
    docker-compose --profile api up

3. API будет доступно по порту 3000, (http://localhost:3000/v1). Спецификация находится в файле specification.yaml

