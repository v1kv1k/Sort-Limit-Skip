# MongoDB Cursor та Aggregation Express API

Цей проект демонструє використання курсорів MongoDB та агрегаційних запитів у додатку Express. Додаток реалізує різні маршрути для ефективної обробки великих наборів даних за допомогою курсорів та збору статистичних даних за допомогою фреймворку агрегації MongoDB.

## Технології

- Node.js
- Express.js
- MongoDB Atlas

## Налаштування

1. Клонуйте цей репозиторій
2. Встановіть залежності:
   ```
   npm install
   ```
3. Створіть файл `.env` у кореневому каталозі з наступними змінними:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   PORT=3000
   ```
4. Замініть `your_mongodb_atlas_connection_string` на власний рядок підключення MongoDB Atlas
5. Запустіть додаток:
   ```
   npm run dev
   ```

## API Маршрути

### Ініціалізація тестових даних

**POST /api/init-products**

Ініціалізує колекцію товарів тестовими даними.

Приклад запиту:
```
POST http://localhost:3000/api/init-products
```

Приклад відповіді:
```json
{
  "message": "Initialized collection with 12 products",
  "insertedIds": {
    "0": "60d21b4667d0d8992e610c85",
    ...
  }
}
```

### Маршрути з використанням курсорів

#### 1. Пагінація товарів

**GET /api/products**

Отримує товари з пагінацією, використовуючи курсори для підвищення ефективності.

Параметри запиту:
- `page` (за замовчуванням: 1): Номер сторінки
- `limit` (за замовчуванням: 5): Кількість елементів на сторінці

Приклад запиту:
```
GET http://localhost:3000/api/products?page=1&limit=3
```

Приклад відповіді:
```json
{
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Laptop",
      "price": 1200,
      "category": "Electronics",
      "stock": 45
    },
    {
      "_id": "60d21b4667d0d8992e610c86",
      "name": "Smartphone",
      "price": 800,
      "category": "Electronics",
      "stock": 120
    },
    {
      "_id": "60d21b4667d0d8992e610c87",
      "name": "Headphones",
      "price": 100,
      "category": "Electronics",
      "stock": 78
    }
  ],
  "pagination": {
    "currentPage": 1,
    "limit": 3,
    "totalPages": 4,
    "totalProducts": 12
  }
}
```

#### 2. Фільтрація товарів

**GET /api/products/filter**

Отримує товари, відфільтровані за категорією та/або ціновим діапазоном, використовуючи курсори.

Параметри запиту:
- `category`: Категорія товару
- `minPrice`: Мінімальна ціна
- `maxPrice`: Максимальна ціна

Приклад запиту:
```
GET http://localhost:3000/api/products/filter?category=Electronics&minPrice=200
```

Приклад відповіді:
```json
{
  "filter": {
    "category": "Electronics",
    "price": {
      "$gte": 200
    }
  },
  "count": 3,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Laptop",
      "price": 1200,
      "category": "Electronics",
      "stock": 45
    },
    {
      "_id": "60d21b4667d0d8992e610c86",
      "name": "Smartphone",
      "price": 800,
      "category": "Electronics",
      "stock": 120
    },
    {
      "_id": "60d21b4667d0d8992e610c88",
      "name": "Monitor",
      "price": 300,
      "category": "Electronics",
      "stock": 35
    }
  ]
}
```

#### 3. Потокова передача товарів

**GET /api/products/stream**

Передає товари безпосередньо клієнту, по одному, без зберігання всіх в пам'яті. Цей підхід особливо ефективний для великих наборів даних.

Приклад запиту:
```
GET http://localhost:3000/api/products/stream
```

Приклад відповіді:
JSON-масив усіх товарів, що передається клієнту поступово.

### Агрегаційні маршрути

#### 1. Статистика за категоріями

**GET /api/products/stats/by-category**

Використовує фреймворк агрегації MongoDB для обчислення статистики товарів за категоріями.

Приклад запиту:
```
GET http://localhost:3000/api/products/stats/by-category
```

Приклад відповіді:
```json
{
  "categoryStats": [
    {
      "_id": "Electronics",
      "count": 4,
      "averagePrice": 600,
      "minPrice": 100,
      "maxPrice": 1200,
      "totalStock": 278
    },
    {
      "_id": "Clothing",
      "count": 4,
      "averagePrice": 53.75,
      "minPrice": 10,
      "maxPrice": 120,
      "totalStock": 735
    },
    {
      "_id": "Furniture",
      "count": 4,
      "averagePrice": 175,
      "minPrice": 120,
      "maxPrice": 250,
      "totalStock": 96
    }
  ]
}
```

#### 2. Розподіл цінових діапазонів

**GET /api/products/stats/price-ranges**

Використовує етап агрегації `$bucket` MongoDB для групування товарів за ціновими діапазонами.

Приклад запиту:
```
GET http://localhost:3000/api/products/stats/price-ranges
```

Приклад відповіді:
```json
{
  "priceRangeDistribution": [
    {
      "_id": 0,
      "count": 2,
      "products": ["Socks", "T-shirt"],
      "averageStock": 250
    },
    {
      "_id": 50,
      "count": 1,
      "products": ["Jeans"],
      "averageStock": 150
    },
    {
      "_id": 100,
      "count": 4,
      "products": ["Headphones", "Coffee Table", "Jacket", "Chair"],
      "averageStock": 55.25
    },
    {
      "_id": 200,
      "count": 3,
      "products": ["Desk", "Bookshelf", "Monitor"],
      "averageStock": 24.33
    },
    {
      "_id": 500,
      "count": 1,
      "products": ["Smartphone"],
      "averageStock": 120
    },
    {
      "_id": 1000,
      "count": 1,
      "products": ["Laptop"],
      "averageStock": 45
    }
  ]
}
```

## Переваги продуктивності

### Переваги підходу на основі курсорів

1. **Ефективність пам'яті**: Використовуючи курсори, додаток не завантажує всі документи в пам'ять одночасно, що критично важливо для обробки великих наборів даних.

2. **Можливість потокової передачі**: Курсор дозволяє передавати документи один за одним, що ефективно для великих наборів результатів.

3. **Пагінація**: Пагінація на основі курсорів ефективніша, ніж отримання всіх документів і подальше розбиття масиву.

### Переваги агрегації

1. **Серверна обробка**: Операції агрегації відбуваються на сервері MongoDB, зменшуючи обсяг даних, що передаються до додатку.

2. **Оптимізовані обчислення**: Фреймворк агрегації MongoDB оптимізований для складних перетворень даних та обчислень.

3. **Ефективність одного запиту**: Складні статистичні дані обчислюються в одному запиті, а не в кількох, зменшуючи мережеве навантаження.

## Тестування

Для тестування додатку:

1. Запустіть сервер: `npm run dev`
2. Ініціалізуйте базу даних тестовими даними:
   ```
   POST http://localhost:3000/api/init-products
   ```
3. Протестуйте маршрути на основі курсорів:
   ```
   GET http://localhost:3000/api/products
   GET http://localhost:3000/api/products/filter?category=Electronics
   GET http://localhost:3000/api/products/stream
   ```
4. Протестуйте агрегаційні маршрути:
   ```
   GET http://localhost:3000/api/products/stats/by-category
   GET http://localhost:3000/api/products/stats/price-ranges
   ```

Ви можете використовувати такі інструменти, як Postman або curl, для тестування цих кінцевих точок.

## Примітка

Для підключення до MongoDB Atlas переконайтеся, що вашу IP-адресу внесено до білого списку в панелі керування MongoDB Atlas. 