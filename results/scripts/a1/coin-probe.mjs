const SB = '/home/user/cell/a1/Story_block';
const { parseAmount, currencyOf, coinValue, isCurrencyName } = await import(`${SB}/src/v2/domains/money.js`);
const C = currencyOf({ coins: [{ name: 'copper', value: 1 }, { name: 'silver', value: 10 }, { name: 'gold', value: 100 }] });
const C2 = currencyOf({ coins: [{ name: 'copper', value: 1 }, { name: 'silver', value: 10 }] }); // currency name left default "gold"
for (const t of ['3 silver', '3 silvers', '3 golds', '3 of silver', 'silver 3', '3 SILVER', '3 silver coin', '3 coins', '3 pieces', '3 coin', '3', 'three silver', '3 silver.', '3 silver!', "3 silver's", '3 sil-ver', '3 silver-', '-3 silver', '3 silver | x', '3 Gold Coins', '3 gold pieces', '3 in', '3 of', '3 piece of copper', '3 copper in silver', '3 silvercoins', '3 sliver']) {
  console.log(JSON.stringify(t).padEnd(22), JSON.stringify(parseAmount(t, C)), '| C2:', JSON.stringify(parseAmount(t, C2)));
}
console.log('isCurrencyName golds', isCurrencyName('golds', C), coinValue('golds', C));
console.log('isCurrencyName silver coins', isCurrencyName('silver coins', C), coinValue('silver coins', C));
