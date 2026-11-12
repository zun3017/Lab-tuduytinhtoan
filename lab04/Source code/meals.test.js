const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Tính năng đề xuất có dữ liệu và logic riêng', () => {
  assert.ok(fs.existsSync(path.join(__dirname, 'meals-data.js')));
  assert.ok(fs.existsSync(path.join(__dirname, 'meals.js')));
});

if (fs.existsSync(path.join(__dirname, 'meals.js'))) {
  const meals = require('./meals-data.js');
  const { recommendMeals } = require('./meals.js');

  test('Dữ liệu có ít nhất 60 món riêng biệt và trường hợp lệ', () => {
    assert.ok(meals.length >= 60);
    assert.equal(new Set(meals.map(meal => meal.id)).size, meals.length);
    assert.equal(new Set(meals.map(meal => meal.name)).size, meals.length);
    meals.forEach(meal => {
      assert.ok(meal.name && meal.cost > 0 && meal.minutes > 0);
      assert.ok(meal.ingredients.length >= 3 && meal.steps.length >= 2);
      assert.ok(['meat', 'fish', 'vegetarian'].includes(meal.category));
    });
  });

  test('Tổng chi phí theo số người không vượt ngân sách, đúng giới hạn thời gian', () => {
    const results = recommendMeals(meals, { budget: 60000, people: 3, maxMinutes: 20 });
    assert.ok(results.length > 0);
    results.forEach(meal => {
      assert.ok(meal.totalCost <= 60000);
      assert.equal(meal.totalCost, meal.cost * 3);
      assert.equal(meal.people, 3);
      assert.ok(meal.minutes <= 20);
    });
  });

  test('Nguyên liệu không dấu được ưu tiên, không nhầm cá với cà chua', () => {
    const results = recommendMeals(meals, { budget: 500000, people: 2, ingredients: 'TRUNG, dau phu, trứng' });
    assert.ok(results[0].matchedIngredients.length > 0);
    assert.equal(new Set(results[0].matchedIngredients).size, results[0].matchedIngredients.length);
    const tomato = [{ id: 'tomato', cost: 1000, minutes: 5, category: 'vegetarian', ingredients: ['cà chua'] }];
    assert.equal(recommendMeals(tomato, { budget: 10000, people: 1, ingredients: 'ca' })[0].matchedIngredients.length, 0);
  });

  test('Lọc món chay và xử lý trường hợp không có món phù hợp', () => {
    const results = recommendMeals(meals, { budget: 100000, people: 2, category: 'vegetarian' });
    assert.ok(results.length > 0);
    assert.ok(results.every(meal => meal.category === 'vegetarian'));
    assert.deepEqual(recommendMeals(meals, { budget: 1, people: 2 }), []);
    assert.equal(meals.some(meal => 'totalCost' in meal), false);
  });

  test('Từ chối số người, ngân sách và thời gian không hợp lệ', () => {
    for (const options of [
      { budget: 0, people: 2 }, { budget: -1, people: 2 },
      { budget: 100000, people: 0 }, { budget: 100000, people: 1.5 },
      { budget: NaN, people: 2 }, { budget: Infinity, people: 2 },
      { budget: 100000, people: 2, maxMinutes: -1 }
    ]) assert.throws(() => recommendMeals(meals, options), RangeError);
  });

  test('Không ăn hành: giữ món có hành phụ, bỏ khỏi nguyên liệu, danh sách mua và cách làm', () => {
    const options = { budget: 500000, people: 2, ingredients: 'hành lá, gạo', excludedIngredients: 'HANH, hành' };
    const results = recommendMeals(meals, options);
    const dish = results.find(meal => meal.name === 'Cơm thịt băm cà chua');
    assert.ok(dish);
    assert.deepEqual(dish.omittedIngredients, ['hành lá']);
    assert.ok(dish.ingredients.every(item => !item.includes('hành')));
    assert.ok(dish.shoppingIngredients.every(item => !item.includes('hành') && item !== 'gạo'));
    assert.ok(dish.matchedIngredients.every(item => !item.includes('hành')));
    assert.ok(dish.steps.every(step => !/(^|[\s,])hành([\s,.]|$)/u.test(step)));
    assert.ok(meals.find(meal => meal.id === dish.id).ingredients.includes('hành lá'));
  });

  test('Không ăn thành phần chính thì loại món, kể cả khi nguyên liệu đó cũng đang có', () => {
    const results = recommendMeals(meals, { budget: 500000, people: 2, ingredients: 'đậu hũ', excludedIngredients: 'dau phu, hanh tay' });
    assert.ok(results.length > 0);
    assert.ok(results.every(meal => !meal.ingredients.includes('đậu hũ')));
    assert.ok(results.every(meal => meal.name !== 'Cơm bò xào hành tây'));
    assert.ok(results.some(meal => meal.name === 'Cơm gà xào nấm'));
  });

  test('Từ nhóm cá chỉ loại cá, không nhầm cà chua hoặc mực và tôm', () => {
    const results = recommendMeals(meals, { budget: 500000, people: 2, excludedIngredients: 'ca' });
    assert.ok(results.every(meal => !meal.ingredients.some(item => item.startsWith('cá '))));
    assert.ok(results.some(meal => meal.name === 'Cơm đậu hũ sốt cà'));
    assert.ok(results.some(meal => meal.name === 'Cơm tôm rim'));
  });

  test('Tất cả cách làm đã điều chỉnh đều bỏ hành và tỏi khi không ăn hai nguyên liệu này', () => {
    const results = recommendMeals(meals, { budget: 500000, people: 2, excludedIngredients: 'hành, tỏi' });
    results.forEach(meal => meal.steps.forEach(step => {
      assert.ok(!/(^|[\s,])(hành|tỏi)([\s,.]|$)/u.test(step), `${meal.name}: ${step}`);
      assert.ok(!step.includes('với cho'), step);
    }));
  });
}
