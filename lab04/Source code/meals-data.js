// Database: Giá nguyên liệu ước tính tự nấu ăn tại nhà cho 1 người (tiết kiệm, hợp lý).
// Nguyên liệu và cách làm là gợi ý ngắn; gia vị cơ bản tuỳ khẩu vị.
// Chỉnh câu hướng dẫn đã biên soạn sẵn khi bỏ nguyên liệu phụ.
const MEAL_OPTIONAL_STEP_EDITS = {
  'hành lá': [
    [' rồi thêm hành lá', ''], [', thêm hành lá', ''], [', rắc hành lá', ''], [' và hành lá', ''],
    [' rồi rắc hành', ''], [' rồi thêm hành', ''], [' và thêm hành', ''], [' và rắc hành', ''],
    ['thêm hành và nước tương', 'nêm nước tương'], [', thêm hành rồi', ' rồi'], [' và hành', '']
  ],
  'hành tây': [[' cùng hành tây và ', ' cùng '], [' và hành tây', ''], [' với hành tây', ''], ['hành tây và ', '']],
  'hành tím': [['Phi hành, thêm', 'Cho']],
  'tỏi': [[' với tỏi, cho', ', cho'], [' với tỏi, ', ' với '], [' với tỏi', ''], [' cùng tỏi', ''], ['Phi tỏi, xào', 'Xào'], ['thêm tỏi và ', 'thêm ']]
};

const MEAL_DATABASE = [
  ['Cơm gà rau củ', 17000, 30, 'meat', 'gạo,gà,cà rốt,bông cải', 'Nấu cơm, rửa và cắt rau củ.|Cắt gà thành miếng, xào chín kỹ rồi thêm rau củ, nêm vừa ăn và dùng với cơm.'],
  ['Cơm thịt heo kho trứng', 17000, 45, 'meat', 'gạo,thịt heo,trứng,nước mắm', 'Nấu cơm và luộc trứng, bóc vỏ.|Kho thịt heo với nước mắm và nước, thêm trứng rồi đun tới khi thịt chín mềm.'],
  ['Cơm thịt băm cà chua', 14000, 20, 'meat', 'gạo,thịt heo,cà chua,hành lá', 'Nấu cơm, cắt cà chua và hành lá.|Xào chín thịt băm, thêm cà chua và ít nước, đun thành sốt rồi dùng với cơm.'],
  ['Cơm bò xào hành tây', 20000, 25, 'meat', 'gạo,thịt bò,hành tây,ớt chuông', 'Nấu cơm, thái bò và rau củ.|Xào hành tây, ớt chuông rồi thêm bò, đảo đến khi chín và nêm vừa ăn.'],
  ['Cơm gà kho gừng', 14000, 35, 'meat', 'gạo,gà,gừng,nước mắm', 'Nấu cơm, làm sạch gà và thái gừng.|Ướp gà với nước mắm, kho cùng gừng và ít nước tới khi chín kỹ.'],
  ['Cơm thịt heo xào đậu que', 15000, 25, 'meat', 'gạo,thịt heo,đậu que,tỏi', 'Nấu cơm, tước xơ và cắt đậu que.|Xào chín thịt với tỏi, cho đậu que vào đảo đến khi chín.'],
  ['Cơm gà xào nấm', 15000, 25, 'meat', 'gạo,gà,nấm,hành tây', 'Nấu cơm, cắt gà, nấm và hành tây.|Xào gà chín kỹ rồi thêm nấm và hành tây, đảo chín và nêm vừa ăn.'],
  ['Cơm sườn rim', 19000, 40, 'meat', 'gạo,sườn heo,tỏi,nước mắm', 'Nấu cơm, làm sạch và chần sườn.|Rim sườn với tỏi, nước mắm và ít nước đến khi chín mềm, sốt sánh.'],
  ['Mì xào bò rau cải', 20000, 20, 'meat', 'mì,thịt bò,rau cải,tỏi', 'Trụng mì, để ráo; thái bò và rửa rau.|Xào bò chín, thêm rau cải rồi mì, đảo đều với gia vị.'],
  ['Mì gà rau củ', 14000, 25, 'meat', 'mì,gà,cà rốt,rau cải', 'Nấu gà với nước tới khi chín kỹ, vớt ra xé nhỏ.|Cho cà rốt, rau cải và mì vào nước dùng, nấu chín rồi thêm gà.'],
  ['Nui xào thịt băm', 13000, 20, 'meat', 'nui,thịt heo,cà chua,hành tây', 'Luộc nui theo hướng dẫn trên bao bì rồi để ráo.|Xào chín thịt băm cùng hành tây và cà chua, trộn với nui.'],
  ['Mì Ý sốt bò băm', 22000, 30, 'meat', 'mì Ý,thịt bò,cà chua,hành tây', 'Luộc mì Ý, giữ lại ít nước luộc.|Xào chín bò và hành tây, thêm cà chua nấu mềm rồi trộn mì.'],
  ['Cháo gà cà rốt', 11000, 40, 'meat', 'gạo,gà,cà rốt,hành lá', 'Ninh gạo với nước cho mềm, cắt cà rốt nhỏ.|Thêm gà và cà rốt, nấu tới khi gà chín kỹ, xé gà rồi rắc hành.'],
  ['Cháo thịt băm bí đỏ', 10000, 35, 'meat', 'gạo,thịt heo,bí đỏ,hành lá', 'Ninh gạo với bí đỏ cắt nhỏ.|Cho thịt băm vào, khuấy tơi và nấu chín kỹ, nêm rồi thêm hành.'],
  ['Bún thịt heo xào', 15000, 25, 'meat', 'bún,thịt heo,dưa leo,rau xà lách', 'Rửa rau và dưa leo, chuẩn bị bún theo hướng dẫn bao bì.|Xào thịt heo chín kỹ, xếp cùng bún, rau và nước chấm tuỳ khẩu vị.'],
  ['Miến gà nấm', 15000, 30, 'meat', 'miến,gà,nấm,hành lá', 'Nấu gà chín kỹ rồi xé nhỏ; ngâm miến cho mềm.|Cho nấm và miến vào nước dùng, nấu chín rồi thêm gà và hành.'],
  ['Bánh mì trứng thịt', 12000, 15, 'meat', 'bánh mì,trứng,thịt heo,dưa leo', 'Thái dưa leo, xào chín thịt heo thái mỏng.|Chiên trứng chín, kẹp thịt, trứng và dưa leo vào bánh mì.'],
  ['Cơm rang gà trứng', 12000, 20, 'meat', 'gạo,gà,trứng,cà rốt', 'Dùng cơm đã nấu, được bảo quản lạnh đúng cách; cắt nhỏ gà và cà rốt.|Xào gà chín kỹ với cà rốt, thêm trứng rồi cơm, rang nóng đều.'],
  ['Canh bí xanh thịt băm ăn với cơm', 12000, 25, 'meat', 'gạo,bí xanh,thịt heo,hành lá', 'Nấu cơm, gọt và cắt bí xanh.|Nấu thịt băm trong nước sôi, thêm bí và nấu chín, nêm rồi rắc hành.'],
  ['Cơm thịt heo xào bắp cải', 13000, 20, 'meat', 'gạo,thịt heo,bắp cải,tỏi', 'Nấu cơm, thái thịt và bắp cải.|Xào chín thịt với tỏi rồi cho bắp cải vào, đảo chín và dùng với cơm.'],
  ['Cơm cá basa kho', 14000, 35, 'fish', 'gạo,cá basa,nước mắm,hành lá', 'Nấu cơm, làm sạch cá và ướp nước mắm.|Kho cá với ít nước tới khi chín kỹ, thêm hành lá.'],
  ['Cơm cá thu sốt cà', 21000, 30, 'fish', 'gạo,cá thu,cà chua,hành lá', 'Nấu cơm, làm sạch và áp chảo cá.|Nấu cà chua với ít nước thành sốt, thêm cá và đun chín kỹ.'],
  ['Cơm cá rô phi chiên', 14000, 30, 'fish', 'gạo,cá rô phi,dưa leo,nước mắm', 'Nấu cơm, làm sạch cá và thấm khô.|Chiên cá chín kỹ hai mặt, dùng với cơm, dưa leo và nước chấm.'],
  ['Cơm cá nục kho cà', 13000, 40, 'fish', 'gạo,cá nục,cà chua,hành tím', 'Nấu cơm, sơ chế cá và cắt cà chua.|Phi hành, thêm cá, cà chua cùng ít nước, kho tới khi chín kỹ.'],
  ['Cơm tôm xào bông cải', 17000, 25, 'fish', 'gạo,tôm,bông cải,tỏi', 'Nấu cơm, bóc vỏ tôm và cắt bông cải.|Xào tôm cùng tỏi, thêm bông cải và đảo tới khi tất cả chín.'],
  ['Cơm tôm rim', 18000, 25, 'fish', 'gạo,tôm,nước mắm,hành lá', 'Nấu cơm, làm sạch tôm.|Rim tôm với nước mắm và ít nước tới khi chín kỹ, sốt sệt rồi thêm hành.'],
  ['Mì xào tôm', 18000, 20, 'fish', 'mì,tôm,rau cải,cà rốt', 'Trụng mì, sơ chế tôm và rau củ.|Xào chín tôm với rau củ, cho mì vào đảo nóng đều.'],
  ['Cháo cá gừng', 10000, 40, 'fish', 'gạo,cá basa,gừng,hành lá', 'Ninh gạo thành cháo, làm sạch cá và kiểm tra xương.|Cho cá và gừng vào nấu chín kỹ, gỡ xương còn lại rồi thêm hành.'],
  ['Canh chua cá ăn với cơm', 16000, 35, 'fish', 'gạo,cá basa,cà chua,dứa,đậu bắp,me', 'Nấu cơm, sơ chế cá và cắt rau củ; dầm me lấy nước.|Đun nước me với cà chua và dứa, thêm cá rồi đậu bắp, nấu chín kỹ.'],
  ['Cơm mực xào cần tây', 19000, 25, 'fish', 'gạo,mực,cần tây,hành tây', 'Nấu cơm, làm sạch mực và thái rau.|Xào mực với hành tây, thêm cần tây, đảo tới khi chín.'],
  ['Bún cá cà chua', 15000, 30, 'fish', 'bún,cá rô phi,cà chua,rau cải', 'Lọc cá, kiểm tra xương và nấu cá chín kỹ.|Nấu nước dùng với cà chua và rau cải, thêm bún đã chuẩn bị cùng cá.'],
  ['Nui tôm rau củ', 16000, 25, 'fish', 'nui,tôm,cà rốt,bông cải', 'Luộc nui, làm sạch tôm và cắt rau củ.|Nấu cà rốt, bông cải trong nước, cho tôm và nui vào nấu chín.'],
  ['Cơm cá hồi áp chảo', 23000, 25, 'fish', 'gạo,cá hồi,bông cải,chanh', 'Nấu cơm và luộc bông cải.|Áp chảo cá hồi chín kỹ hai mặt, dùng cùng cơm, bông cải và chanh.'],
  ['Cơm trứng hấp tôm', 14000, 30, 'fish', 'gạo,trứng,tôm,hành lá', 'Nấu cơm, làm sạch tôm; đánh trứng với ít nước và gia vị.|Cho tôm vào trứng, hấp đến khi trứng đông và tôm chín kỹ.'],
  ['Miến xào hải sản', 18000, 25, 'fish', 'miến,tôm,mực,cà rốt', 'Ngâm miến theo hướng dẫn bao bì, sơ chế tôm mực và cà rốt.|Xào chín hải sản và cà rốt, thêm miến rồi đảo nóng đều.'],
  ['Cơm cá hấp gừng', 13000, 35, 'fish', 'gạo,cá rô phi,gừng,hành lá', 'Nấu cơm, làm sạch cá, thái gừng và hành.|Hấp cá cùng gừng tới khi chín kỹ, thêm hành rồi dùng với cơm.'],
  ['Canh bí đỏ tôm ăn với cơm', 15000, 30, 'fish', 'gạo,bí đỏ,tôm,hành lá', 'Nấu cơm, cắt bí và làm sạch tôm.|Nấu bí trong nước đến gần mềm, cho tôm vào nấu chín kỹ và thêm hành.'],
  ['Cơm cá ngừ sốt cà', 14000, 25, 'fish', 'gạo,cá ngừ hộp,cà chua,hành tây', 'Nấu cơm, cắt cà chua và hành tây.|Xào hành tây và cà chua thành sốt, thêm cá ngừ hộp và đun nóng đều.'],
  ['Cơm tôm xào bí ngòi', 15000, 20, 'fish', 'gạo,tôm,bí ngòi,tỏi', 'Nấu cơm, làm sạch tôm và thái bí ngòi.|Phi tỏi, xào tôm rồi thêm bí ngòi, đảo đến khi chín.'],
  ['Cháo tôm nấm', 13000, 35, 'fish', 'gạo,tôm,nấm,hành lá', 'Ninh gạo thành cháo, làm sạch và băm tôm.|Cho tôm và nấm vào cháo, nấu chín kỹ rồi thêm hành lá.'],
  ['Cơm đậu hũ sốt cà', 10000, 20, 'vegetarian', 'gạo,đậu hũ,cà chua,hành lá', 'Nấu cơm, cắt đậu hũ và cà chua.|Áp chảo đậu hũ, nấu cà chua thành sốt rồi thêm đậu hũ, nêm nước tương.'],
  ['Cơm nấm xào rau củ', 11000, 25, 'vegetarian', 'gạo,nấm,cà rốt,bông cải', 'Nấu cơm, rửa và cắt nấm, rau củ.|Xào cà rốt và bông cải, thêm nấm, đảo chín và nêm nước tương.'],
  ['Cơm đậu hũ kho nấm', 11000, 30, 'vegetarian', 'gạo,đậu hũ,nấm,nước tương', 'Nấu cơm, cắt đậu hũ và nấm.|Kho đậu hũ với nấm, nước tương và ít nước tới khi ngấm gia vị.'],
  ['Mì xào rau củ', 9000, 20, 'vegetarian', 'mì chay,bắp cải,cà rốt,nấm', 'Trụng mì chay và để ráo, thái rau củ.|Xào rau củ và nấm chín, cho mì vào trộn với nước tương.'],
  ['Bún đậu hũ rau sống', 11000, 20, 'vegetarian', 'bún,đậu hũ,dưa leo,rau xà lách', 'Rửa sạch rau, thái dưa leo, chuẩn bị bún theo hướng dẫn.|Áp chảo đậu hũ, xếp cùng bún và rau, dùng với nước tương.'],
  ['Cháo nấm bí đỏ', 8000, 35, 'vegetarian', 'gạo,nấm,bí đỏ,hành lá', 'Ninh gạo với bí đỏ cắt nhỏ tới khi mềm.|Thêm nấm, nấu chín và nêm muối, rắc hành lá.'],
  ['Cơm cà tím om đậu hũ', 10000, 30, 'vegetarian', 'gạo,cà tím,đậu hũ,nước tương', 'Nấu cơm, cắt cà tím và đậu hũ.|Xào cà tím, thêm đậu hũ, nước tương và ít nước, om đến khi mềm.'],
  ['Nui sốt cà chua nấm', 12000, 25, 'vegetarian', 'nui chay,cà chua,nấm,hành tây', 'Luộc nui chay theo hướng dẫn trên bao bì.|Xào hành tây và nấm, thêm cà chua nấu thành sốt rồi trộn nui.'],
  ['Cơm đậu hũ xào đậu que', 10000, 25, 'vegetarian', 'gạo,đậu hũ,đậu que,tỏi', 'Nấu cơm, tước xơ đậu que và cắt đậu hũ.|Áp chảo đậu hũ, thêm tỏi và đậu que, đảo chín, nêm nước tương.'],
  ['Miến xào nấm', 11000, 20, 'vegetarian', 'miến,nấm,cà rốt,bắp cải', 'Ngâm miến theo hướng dẫn bao bì, thái rau và nấm.|Xào rau củ với nấm chín, thêm miến và nước tương, đảo đều.'],
  ['Cơm đậu hũ sốt sả', 8000, 25, 'vegetarian', 'gạo,đậu hũ,sả,nước tương', 'Nấu cơm, băm sả và cắt đậu hũ.|Áp chảo đậu hũ, phi sả rồi thêm nước tương và ít nước, rim cùng đậu hũ.'],
  ['Canh rau củ đậu hũ ăn với cơm', 10000, 25, 'vegetarian', 'gạo,đậu hũ,cà rốt,bắp cải', 'Nấu cơm, cắt rau củ và đậu hũ.|Nấu cà rốt gần mềm, thêm bắp cải và đậu hũ, đun chín rồi nêm muối.'],
  ['Cơm bí đỏ xào nấm', 10000, 25, 'vegetarian', 'gạo,bí đỏ,nấm,tỏi', 'Nấu cơm, cắt bí đỏ mỏng và sơ chế nấm.|Phi tỏi, xào bí với ít nước tới khi mềm, thêm nấm và đảo chín.'],
  ['Bún nấm nước tương', 10000, 20, 'vegetarian', 'bún,nấm,rau cải,nước tương', 'Chuẩn bị bún theo hướng dẫn bao bì, rửa rau và nấm.|Nấu nước dùng với nấm và rau cải, nêm nước tương rồi chan vào bún.'],
  ['Cơm đậu hũ xào giá', 9000, 15, 'vegetarian', 'gạo,đậu hũ,giá đỗ,hành lá', 'Nấu cơm, cắt đậu hũ và rửa giá.|Áp chảo đậu hũ, cho giá vào xào chín kỹ, thêm hành và nước tương.'],
  ['Mì Ý sốt cà chua chay', 13000, 25, 'vegetarian', 'mì Ý chay,cà chua,hành tây,nấm', 'Luộc mì Ý chay theo hướng dẫn bao bì.|Xào hành tây và nấm, thêm cà chua nấu nhuyễn rồi trộn với mì.'],
  ['Cơm đậu hũ kho củ cải', 10000, 35, 'vegetarian', 'gạo,đậu hũ,củ cải,nước tương', 'Nấu cơm, gọt củ cải và cắt đậu hũ.|Kho củ cải với đậu hũ, nước tương và ít nước đến khi củ cải mềm.'],
  ['Cháo đậu xanh nấm', 9000, 40, 'vegetarian', 'gạo,đậu xanh,nấm,hành lá', 'Vo gạo, rửa đậu xanh cà vỏ và ninh với nước đến khi mềm.|Thêm nấm, nấu chín rồi nêm muối và rắc hành.'],
  ['Cơm bắp cải xào đậu hũ', 10000, 20, 'vegetarian', 'gạo,bắp cải,đậu hũ,cà rốt', 'Nấu cơm, thái bắp cải, cà rốt và đậu hũ.|Áp chảo đậu hũ, thêm rau củ xào chín, nêm nước tương rồi dùng với cơm.'],
  ['Salad đậu gà bánh mì', 14000, 15, 'vegetarian', 'đậu gà hộp,bánh mì chay,dưa leo,cà chua,rau xà lách', 'Rửa và cắt rau củ, để ráo đậu gà hộp đã nấu chín.|Trộn đậu gà và rau với dầu ăn, chanh, muối; dùng cùng bánh mì chay.']
].map(([name, cost, minutes, category, ingredients, steps], index) => ({
  id: `meal-${index + 1}`, name, cost, minutes, category,
  ingredients: ingredients.split(','), steps: steps.split('|'),
  // Hành tây là thành phần chính của món bò xào hành tây, không tự bỏ.
  optionalIngredients: ingredients.split(',').filter(ingredient =>
    Object.hasOwn(MEAL_OPTIONAL_STEP_EDITS, ingredient) &&
    !(name === 'Cơm bò xào hành tây' && ingredient === 'hành tây')),
  optionalStepEdits: MEAL_OPTIONAL_STEP_EDITS
}));

if (typeof module !== 'undefined' && module.exports) module.exports = MEAL_DATABASE;
