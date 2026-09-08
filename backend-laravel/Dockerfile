# syntax=docker/dockerfile:1
FROM php:8.3-cli

WORKDIR /var/www

# System dependencies + PHP extensions used by the app
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        libonig-dev \
        libzip-dev \
        unzip \
        git \
        curl \
    && docker-php-ext-install pdo_pgsql pdo_mysql mbstring zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Application source
COPY . .

# Install dependencies (production), build manifests, prepare writable dirs
RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && chmod -R 775 storage bootstrap/cache \
    && mkdir -p public/uploads/avatars \
                public/uploads/purchases \
                public/uploads/assets/photos \
                public/uploads/assets/receipts \
                public/uploads/damages

EXPOSE $PORT

# Run migrations on boot, then serve the API
CMD ["sh", "-c", "php artisan migrate --force --no-interaction && php artisan serve --host=0.0.0.0 --port=$PORT"]