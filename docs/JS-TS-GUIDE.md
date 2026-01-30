# JavaScript & TypeScript - Tài Liệu Học Tập Chi Tiết

> Hướng dẫn từ cơ bản đến nâng cao, so sánh JS và TS

## 📋 Mục Lục

1. [Tổng quan](#1-tổng-quan)
2. [Cú pháp cơ bản](#2-cú-pháp-cơ-bản)
3. [Kiểu dữ liệu](#3-kiểu-dữ-liệu)
4. [Functions](#4-functions)
5. [Objects & Classes](#5-objects--classes)
6. [Modules](#6-modules)
7. [Async/Await](#7-asyncawait)
8. [TypeScript Types](#8-typescript-types)
9. [Generics](#9-generics)
10. [Thực hành với Express](#10-thực-hành-với-express)

---

## 1. Tổng Quan

### JavaScript (JS)
- Ngôn ngữ **động** (dynamic typing)
- Chạy trực tiếp trên browser/Node.js
- File extension: `.js`

### TypeScript (TS)
- **Superset** của JavaScript (mở rộng JS)
- Thêm **static typing** (kiểu tĩnh)
- Cần **compile** sang JS trước khi chạy
- File extension: `.ts`

```
TypeScript = JavaScript + Types
```

### So sánh nhanh:

| Tính năng | JavaScript | TypeScript |
|-----------|------------|------------|
| Typing | Dynamic | Static |
| Compile | Không cần | Cần (tsc) |
| IDE Support | Tốt | Tuyệt vời |
| Lỗi phát hiện | Runtime | Compile-time |
| Học tập | Dễ | Khó hơn |

---

## 2. Cú Pháp Cơ Bản

### 2.1. Khai báo biến

**JavaScript:**
```javascript
// var: function scope (cũ, không khuyên dùng)
var name = 'John';

// let: block scope (khuyên dùng cho biến thay đổi)
let age = 25;
age = 26; // OK

// const: block scope, không thể gán lại
const PI = 3.14;
// PI = 3.15; // ❌ Error
```

**TypeScript:**
```typescript
// Thêm type annotation
let name: string = 'John';
let age: number = 25;
const PI: number = 3.14;

// Type inference (TS tự suy luận)
let city = 'Hanoi'; // TS hiểu city là string
```

### 2.2. Operators

```javascript
// Arithmetic
5 + 3   // 8
5 - 3   // 2
5 * 3   // 15
5 / 3   // 1.666...
5 % 3   // 2 (modulo)
5 ** 3  // 125 (power)

// Comparison
5 == '5'   // true (loose equality - chỉ so sánh giá trị)
5 === '5'  // false (strict equality - so sánh cả type)
5 !== '5'  // true

// Logical
true && false  // false (AND)
true || false  // true (OR)
!true          // false (NOT)

// Nullish coalescing
null ?? 'default'      // 'default'
undefined ?? 'default' // 'default'
0 ?? 'default'         // 0 (0 không phải null/undefined)

// Optional chaining
user?.address?.city    // undefined nếu user hoặc address null
```

---

## 3. Kiểu Dữ Liệu

### 3.1. Primitive Types

**JavaScript (7 primitive types):**
```javascript
// string
let str = 'Hello';
let template = `Hello ${name}`; // Template literal

// number
let int = 42;
let float = 3.14;
let infinity = Infinity;
let notANumber = NaN;

// boolean
let isActive = true;

// undefined
let x; // undefined

// null
let y = null;

// symbol (ES6)
let sym = Symbol('id');

// bigint (ES2020)
let big = 9007199254740991n;
```

**TypeScript (thêm type annotations):**
```typescript
let str: string = 'Hello';
let num: number = 42;
let bool: boolean = true;
let undef: undefined = undefined;
let nul: null = null;

// Literal types
let direction: 'left' | 'right' = 'left';

// Any (tắt type checking - không khuyên dùng)
let anything: any = 'hello';
anything = 42; // OK với any

// Unknown (an toàn hơn any)
let unknownValue: unknown = 'hello';
// unknownValue.toUpperCase(); // ❌ Error
if (typeof unknownValue === 'string') {
  unknownValue.toUpperCase(); // ✅ OK sau khi check
}
```

### 3.2. Reference Types

**Arrays:**
```javascript
// JavaScript
let numbers = [1, 2, 3];
let mixed = [1, 'two', true]; // Có thể mixed types
```

```typescript
// TypeScript
let numbers: number[] = [1, 2, 3];
let strings: Array<string> = ['a', 'b', 'c'];
let tuple: [string, number] = ['hello', 42]; // Fixed length & types
```

**Objects:**
```javascript
// JavaScript
const user = {
  name: 'John',
  age: 25,
  greet() {
    return `Hello, ${this.name}`;
  }
};
```

```typescript
// TypeScript - Interface
interface User {
  name: string;
  age: number;
  email?: string;      // Optional property
  readonly id: string; // Cannot change after init
  greet(): string;     // Method
}

const user: User = {
  id: '123',
  name: 'John',
  age: 25,
  greet() {
    return `Hello, ${this.name}`;
  }
};
```

---

## 4. Functions

### 4.1. Function Declaration

**JavaScript:**
```javascript
// Function declaration
function add(a, b) {
  return a + b;
}

// Function expression
const subtract = function(a, b) {
  return a - b;
};

// Arrow function (ES6)
const multiply = (a, b) => a * b;

// Arrow function với body
const divide = (a, b) => {
  if (b === 0) throw new Error('Cannot divide by zero');
  return a / b;
};

// Default parameters
function greet(name = 'Guest') {
  return `Hello, ${name}`;
}

// Rest parameters
function sum(...numbers) {
  return numbers.reduce((acc, n) => acc + n, 0);
}
sum(1, 2, 3, 4); // 10
```

**TypeScript:**
```typescript
// Type annotations cho parameters và return
function add(a: number, b: number): number {
  return a + b;
}

// Arrow function với types
const multiply = (a: number, b: number): number => a * b;

// Optional parameters
function greet(name: string, greeting?: string): string {
  return `${greeting || 'Hello'}, ${name}`;
}

// Function type
type MathOperation = (a: number, b: number) => number;
const divide: MathOperation = (a, b) => a / b;

// Overloading
function getValue(key: 'name'): string;
function getValue(key: 'age'): number;
function getValue(key: string): string | number {
  // implementation
}
```

### 4.2. Arrow Function Chi Tiết (⭐ Quan trọng)

Arrow function có **3 khác biệt quan trọng** so với function thường:

#### 4.2.1. Cú pháp

```javascript
// Function expression thường
const add = function(a, b) {
  return a + b;
};

// Arrow function - cú pháp ngắn gọn
const add = (a, b) => a + b;

// Với 1 parameter - bỏ ngoặc ()
const double = n => n * 2;

// Với 0 parameter - cần ()
const getRandom = () => Math.random();

// Với body nhiều dòng - cần {} và return
const divide = (a, b) => {
  if (b === 0) {
    throw new Error('Cannot divide by zero');
  }
  return a / b;
};

// Return object - cần wrap trong ()
const getUser = (name) => ({ name, createdAt: new Date() });
```

#### 4.2.2. `this` Binding (⭐⭐⭐ RẤT QUAN TRỌNG)

**Function thường:** `this` phụ thuộc vào **cách gọi hàm**
**Arrow function:** `this` được **capture từ scope bao ngoài** (lexical this)

```javascript
// VẤN ĐỀ VỚI FUNCTION THƯỜNG
const user = {
  name: 'John',
  friends: ['Alice', 'Bob'],
  
  // ❌ BUG: this bị mất trong callback
  printFriends: function() {
    this.friends.forEach(function(friend) {
      console.log(this.name + ' knows ' + friend);
      // this.name = undefined! (this = global/undefined)
    });
  }
};

// GIẢI PHÁP 1: Dùng biến self/that
const user1 = {
  name: 'John',
  friends: ['Alice', 'Bob'],
  printFriends: function() {
    const self = this; // Lưu this
    this.friends.forEach(function(friend) {
      console.log(self.name + ' knows ' + friend); // ✅
    });
  }
};

// GIẢI PHÁP 2: Dùng .bind(this)
const user2 = {
  name: 'John',
  friends: ['Alice', 'Bob'],
  printFriends: function() {
    this.friends.forEach(function(friend) {
      console.log(this.name + ' knows ' + friend); // ✅
    }.bind(this));
  }
};

// GIẢI PHÁP 3: Dùng Arrow Function (✅ KHUYÊN DÙNG)
const user3 = {
  name: 'John',
  friends: ['Alice', 'Bob'],
  printFriends: function() {
    this.friends.forEach((friend) => {
      console.log(this.name + ' knows ' + friend); // ✅
      // Arrow function giữ this từ printFriends
    });
  }
};
```

#### 4.2.3. Không dùng Arrow Function khi nào?

```javascript
// ❌ Object method
const user = {
  name: 'John',
  greet: () => {
    console.log(this.name); // undefined! Arrow không có this riêng
  }
};

// ✅ Dùng shorthand method
const user = {
  name: 'John',
  greet() {
    console.log(this.name); // 'John'
  }
};

// ❌ Event handler cần truy cập element
button.addEventListener('click', () => {
  console.log(this); // Window, không phải button!
});

// ✅ Dùng function thường
button.addEventListener('click', function() {
  console.log(this); // button element
});

// ❌ Constructor
const Person = (name) => {
  this.name = name; // Error!
};
// new Person('John'); // ❌ Arrow function cannot be constructor

// ✅ Dùng class hoặc function
class Person {
  constructor(name) {
    this.name = name;
  }
}
```

#### 4.2.4. Bảng tổng kết Arrow vs Function

| Tính năng | Function thường | Arrow Function |
|-----------|-----------------|----------------|
| `this` | Dynamic (theo cách gọi) | Lexical (theo scope) |
| `arguments` | Có | ❌ Không có |
| `new` | Có thể dùng | ❌ Không thể |
| `prototype` | Có | ❌ Không có |
| Dùng làm method | ✅ Nên | ❌ Không nên |
| Callback | OK | ✅ Khuyên dùng |

### 4.3. Closure (Đóng gói)

```javascript
// Closure = function nhớ các biến từ scope tạo ra nó
function createCounter() {
  let count = 0; // Biến private
  
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count
  };
}

const counter = createCounter();
console.log(counter.getCount()); // 0
counter.increment();
counter.increment();
console.log(counter.getCount()); // 2
// count không thể truy cập trực tiếp từ bên ngoài

// Ứng dụng: Tạo private variables
function createUser(name) {
  let _password = '123456'; // Private
  
  return {
    getName: () => name,
    checkPassword: (pwd) => pwd === _password,
    setPassword: (oldPwd, newPwd) => {
      if (oldPwd === _password) {
        _password = newPwd;
        return true;
      }
      return false;
    }
  };
}
```

### 4.4. IIFE (Immediately Invoked Function Expression)

```javascript
// Function được gọi ngay khi định nghĩa
(function() {
  console.log('Executed immediately');
})();

// Arrow IIFE
(() => {
  console.log('Arrow IIFE');
})();

// Với parameters
((name) => {
  console.log(`Hello, ${name}`);
})('John');

// Ứng dụng: Tránh pollute global scope
const module = (() => {
  const privateVar = 'secret';
  
  return {
    publicMethod: () => console.log(privateVar)
  };
})();
```

### 4.5. Destructuring trong Parameters

```javascript
// Object destructuring
const printUser = ({ name, age, email = 'N/A' }) => {
  console.log(`${name}, ${age}, ${email}`);
};

printUser({ name: 'John', age: 25 });
// John, 25, N/A

// Array destructuring
const getFirst = ([first, second]) => first;
getFirst([1, 2, 3]); // 1

// Với rest operator
const logAll = (first, ...rest) => {
  console.log('First:', first);
  console.log('Rest:', rest);
};

logAll(1, 2, 3, 4);
// First: 1
// Rest: [2, 3, 4]

// TypeScript destructuring với types
interface User {
  name: string;
  age: number;
}

const greet = ({ name, age }: User): string => {
  return `Hello ${name}, you are ${age}`;
};
```

### 4.6. Higher-Order Functions

```javascript
// Array methods (rất quan trọng!)

const numbers = [1, 2, 3, 4, 5];

// map - transform each element
const doubled = numbers.map(n => n * 2);
// [2, 4, 6, 8, 10]

// filter - keep elements that pass test
const evens = numbers.filter(n => n % 2 === 0);
// [2, 4]

// find - get first matching element
const firstEven = numbers.find(n => n % 2 === 0);
// 2

// findIndex - get index of first match
const index = numbers.findIndex(n => n > 3);
// 3

// some - check if any element passes
const hasEven = numbers.some(n => n % 2 === 0);
// true

// every - check if all elements pass
const allPositive = numbers.every(n => n > 0);
// true

// reduce - accumulate to single value
const sum = numbers.reduce((acc, n) => acc + n, 0);
// 15

// forEach - side effects (no return)
numbers.forEach(n => console.log(n));

// Chaining
const result = numbers
  .filter(n => n > 2)
  .map(n => n * 2)
  .reduce((acc, n) => acc + n, 0);
// (3*2) + (4*2) + (5*2) = 24
```

---

## 5. Objects & Classes

### 5.1. Object Methods

```javascript
const user = { name: 'John', age: 25 };

// Object.keys - get all keys
Object.keys(user); // ['name', 'age']

// Object.values - get all values
Object.values(user); // ['John', 25]

// Object.entries - get [key, value] pairs
Object.entries(user); // [['name', 'John'], ['age', 25]]

// Spread operator
const userWithEmail = { ...user, email: 'john@example.com' };

// Destructuring
const { name, age } = user;
const { name: userName } = user; // rename

// Object.assign
const merged = Object.assign({}, user, { city: 'Hanoi' });
```

### 5.2. Classes

**JavaScript:**
```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    console.log(`${this.name} makes a sound`);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name); // Gọi constructor của parent
    this.breed = breed;
  }

  speak() {
    console.log(`${this.name} barks`);
  }

  // Getter
  get info() {
    return `${this.name} is a ${this.breed}`;
  }

  // Setter
  set nickname(value) {
    this._nickname = value;
  }

  // Static method
  static species() {
    return 'Canis familiaris';
  }
}

const dog = new Dog('Buddy', 'Golden Retriever');
dog.speak(); // "Buddy barks"
Dog.species(); // "Canis familiaris"
```

**TypeScript:**
```typescript
class Animal {
  // Access modifiers
  public name: string; // accessible everywhere (default)
  protected age: number; // accessible in class & subclasses
  private _id: string; // only in this class

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
    this._id = Math.random().toString();
  }

  speak(): void {
    console.log(`${this.name} makes a sound`);
  }
}

class Dog extends Animal {
  readonly breed: string; // cannot change after init

  constructor(name: string, age: number, breed: string) {
    super(name, age);
    this.breed = breed;
  }

  // Override parent method
  override speak(): void {
    console.log(`${this.name} barks`);
  }
}

// Abstract class (không thể instantiate)
abstract class Shape {
  abstract getArea(): number;
  
  describe(): string {
    return `Area: ${this.getArea()}`;
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }

  getArea(): number {
    return Math.PI * this.radius ** 2;
  }
}
```

---

## 6. Modules

### 6.1. ES Modules (ESM) - Hiện đại

**Export:**
```javascript
// math.js / math.ts

// Named exports
export const PI = 3.14159;

export function add(a, b) {
  return a + b;
}

export class Calculator {
  // ...
}

// Default export (mỗi file chỉ 1)
export default function multiply(a, b) {
  return a * b;
}
```

**Import:**
```javascript
// app.js / app.ts

// Named imports
import { PI, add, Calculator } from './math.js';

// Rename
import { add as sum } from './math.js';

// Default import
import multiply from './math.js';

// All as namespace
import * as Math from './math.js';
Math.add(1, 2);

// Combined
import multiply, { PI, add } from './math.js';
```

### 6.2. CommonJS (Node.js cũ)

```javascript
// math.js
const PI = 3.14159;

function add(a, b) {
  return a + b;
}

module.exports = { PI, add };
// hoặc
module.exports.PI = PI;
exports.add = add;

// app.js
const { PI, add } = require('./math');
const math = require('./math');
```

**Lưu ý package.json:**
```json
{
  "type": "module"  // Dùng ESM
  // Không có "type" = CommonJS (default)
}
```

---

## 7. Async/Await

### 7.1. Callbacks (cách cũ)

```javascript
// Callback hell
getData(function(a) {
  getMoreData(a, function(b) {
    getMoreData(b, function(c) {
      console.log(c);
    });
  });
});
```

### 7.2. Promises

```javascript
// Tạo Promise
const fetchData = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const data = { id: 1, name: 'John' };
      resolve(data);
      // hoặc reject(new Error('Failed'));
    }, 1000);
  });
};

// Sử dụng Promise
fetchData()
  .then(data => console.log(data))
  .catch(error => console.error(error))
  .finally(() => console.log('Done'));

// Promise.all - chờ tất cả
Promise.all([fetch1(), fetch2(), fetch3()])
  .then(([result1, result2, result3]) => {
    // Tất cả đều thành công
  });

// Promise.race - lấy cái xong trước
Promise.race([fetch1(), fetch2()])
  .then(firstResult => {
    // Cái nào xong trước
  });

// Promise.allSettled - chờ tất cả (kể cả reject)
Promise.allSettled([fetch1(), fetch2()])
  .then(results => {
    results.forEach(r => {
      if (r.status === 'fulfilled') console.log(r.value);
      if (r.status === 'rejected') console.log(r.reason);
    });
  });
```

### 7.3. Async/Await (khuyên dùng)

**JavaScript:**
```javascript
// async function luôn return Promise
async function fetchUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);
    
    if (!response.ok) {
      throw new Error('User not found');
    }
    
    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Parallel requests
async function fetchAllData() {
  const [users, products] = await Promise.all([
    fetch('/api/users'),
    fetch('/api/products')
  ]);
  
  return {
    users: await users.json(),
    products: await products.json()
  };
}

// Arrow async function
const getUser = async (id) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};
```

**TypeScript:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  
  if (!response.ok) {
    throw new Error('User not found');
  }
  
  return response.json() as Promise<User>;
}

// Với try-catch
async function safeGetUser(id: string): Promise<User | null> {
  try {
    return await fetchUser(id);
  } catch {
    return null;
  }
}
```

---

## 8. TypeScript Types

### 8.1. Type Aliases

```typescript
// Basic type alias
type ID = string | number;
type Status = 'pending' | 'active' | 'inactive';

// Object type
type User = {
  id: ID;
  name: string;
  status: Status;
};

// Function type
type Handler = (event: Event) => void;

// Intersection types
type Admin = User & {
  permissions: string[];
};

// Union types
type Result = Success | Error;
```

### 8.2. Interfaces

```typescript
interface User {
  id: string;
  name: string;
  email?: string; // optional
  readonly createdAt: Date; // immutable
}

// Extending interfaces
interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

// Interface với index signature
interface Dictionary {
  [key: string]: string;
}

// Interface cho function
interface SearchFunc {
  (query: string, limit?: number): User[];
}
```

### 8.3. Type vs Interface

```typescript
// Type: có thể dùng cho primitives, unions
type ID = string | number; // ✅
// interface ID = string | number; // ❌

// Interface: có thể merge (declaration merging)
interface User { name: string; }
interface User { age: number; }
// User = { name: string; age: number; }

// Type: không thể merge
type Person = { name: string; };
// type Person = { age: number; }; // ❌ Error

// Khuyến nghị:
// - Interface: cho objects, classes
// - Type: cho unions, primitives, function types
```

### 8.4. Type Guards

```typescript
// typeof guard
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase(); // TS knows it's string
  }
  return value * 2; // TS knows it's number
}

// instanceof guard
class Dog { bark() {} }
class Cat { meow() {} }

function speak(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark();
  } else {
    animal.meow();
  }
}

// in operator
interface Car { drive(): void; }
interface Boat { sail(): void; }

function move(vehicle: Car | Boat) {
  if ('drive' in vehicle) {
    vehicle.drive();
  } else {
    vehicle.sail();
  }
}

// Custom type guard
interface Fish { swim(): void; }
interface Bird { fly(): void; }

function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

function move(pet: Fish | Bird) {
  if (isFish(pet)) {
    pet.swim();
  } else {
    pet.fly();
  }
}
```

### 8.5. Utility Types

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

// Partial<T> - tất cả properties thành optional
type UpdateUser = Partial<User>;
// { id?: string; name?: string; ... }

// Required<T> - tất cả properties bắt buộc
type RequiredUser = Required<User>;

// Pick<T, K> - chọn một số properties
type UserPreview = Pick<User, 'id' | 'name'>;
// { id: string; name: string; }

// Omit<T, K> - loại bỏ một số properties
type UserWithoutId = Omit<User, 'id'>;
// { name: string; email: string; age: number; }

// Record<K, V> - tạo object type
type UserRoles = Record<string, 'admin' | 'user' | 'guest'>;
// { [key: string]: 'admin' | 'user' | 'guest' }

// Readonly<T> - tất cả readonly
type ImmutableUser = Readonly<User>;

// ReturnType<T> - lấy return type của function
function getUser() { return { id: '1', name: 'John' }; }
type UserType = ReturnType<typeof getUser>;
// { id: string; name: string; }

// Parameters<T> - lấy parameter types
type GetUserParams = Parameters<typeof getUser>;
// []
```

---

## 9. Generics

### 9.1. Cơ bản

```typescript
// Không dùng generics
function identity(value: any): any {
  return value;
}

// Dùng generics - giữ type information
function identity<T>(value: T): T {
  return value;
}

identity<string>('hello'); // returns string
identity<number>(42);      // returns number
identity('hello');         // TS infers string

// Multiple type parameters
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

pair<string, number>('hello', 42);
```

### 9.2. Generic Constraints

```typescript
// Constraint với extends
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(value: T): void {
  console.log(value.length);
}

logLength('hello');     // ✅ string có length
logLength([1, 2, 3]);   // ✅ array có length
// logLength(42);       // ❌ number không có length

// Keyof constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: 'John', age: 25 };
getProperty(user, 'name'); // ✅ returns string
// getProperty(user, 'email'); // ❌ 'email' không tồn tại
```

### 9.3. Generic Classes & Interfaces

```typescript
// Generic interface
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(item: Omit<T, 'id'>): Promise<T>;
  update(id: string, item: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Generic class
class ApiResponse<T> {
  constructor(
    public success: boolean,
    public data: T,
    public message?: string
  ) {}

  static ok<T>(data: T): ApiResponse<T> {
    return new ApiResponse(true, data);
  }

  static error<T>(message: string): ApiResponse<T> {
    return new ApiResponse(false, null as T, message);
  }
}

// Usage
interface User { id: string; name: string; }
const response = ApiResponse.ok<User>({ id: '1', name: 'John' });
```

---

## 10. Thực Hành với Express

### 10.1. JavaScript Version

```javascript
// src/server.js
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Route
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await prisma.user.create({ data: { name, email } });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.listen(3000, () => console.log('Server running'));
```

### 10.2. TypeScript Version

```typescript
// src/server.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Types
interface User {
  id: string;
  name: string;
  email: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Typed request handler
app.get('/api/users', async (
  req: Request,
  res: Response<ApiResponse<User[]>>
) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: (error as Error).message 
    });
  }
});

// Request with body type
interface CreateUserBody {
  name: string;
  email: string;
}

app.post('/api/users', async (
  req: Request<{}, {}, CreateUserBody>,
  res: Response<ApiResponse<User>>
) => {
  try {
    const { name, email } = req.body;
    const user = await prisma.user.create({ data: { name, email } });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: (error as Error).message 
    });
  }
});

// Error handler middleware
app.use((
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server error' });
});

app.listen(3000, () => console.log('Server running'));
```

### 10.3. So sánh cùng đoạn code

| Aspect | JavaScript | TypeScript |
|--------|------------|------------|
| Lines | Ít hơn | Nhiều hơn |
| Safety | Runtime errors | Compile-time errors |
| IDE | Autocomplete cơ bản | Autocomplete đầy đủ |
| Refactor | Nguy hiểm | An toàn |

---

## 📚 Tài Nguyên Học Thêm

### JavaScript:
- [MDN JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [JavaScript.info](https://javascript.info/)

### TypeScript:
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

---

## ✅ Checklist Học Tập

### JavaScript Basics:
- [ ] Variables (let, const)
- [ ] Data types
- [ ] Operators
- [ ] Conditionals (if, switch)
- [ ] Loops (for, while, for...of)
- [ ] Functions (arrow, async)
- [ ] Arrays & array methods
- [ ] Objects
- [ ] Classes
- [ ] Modules (import/export)
- [ ] Promises & async/await
- [ ] Error handling

### TypeScript Additions:
- [ ] Type annotations
- [ ] Interfaces vs Types
- [ ] Generics
- [ ] Utility types
- [ ] Type guards
- [ ] Declaration files (.d.ts)
- [ ] tsconfig.json
