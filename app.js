const puppeteer = require('puppeteer');
const _ = require('lodash');
const url = 'http://coinzip.io:9090/';
const Koa = require('Koa');
const app = new Koa();

function delay(t) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, t)
  });
}

function extractPrices () {
  var tbl = document.querySelector('#tickData')
    var rows = tbl.querySelectorAll('tbody > tr')
    var res = {};
    rows.forEach(row => {
      var market = row.querySelector('td:first-child').innerText;
      var prices = {};
      row.querySelectorAll('td:not(:first-child').forEach(col => {
        var symbol = col.id;
        var priceStr = (col.querySelector('#data_p') || {}).innerText
        if (priceStr !== undefined && priceStr !== '') {
            prices[symbol] = parseInt(priceStr.replace(/,/g, ''));
        }
      });
      res[market] = prices;
    });
    return res;
  
}

async function fetchPrices (browser) {
  const page = await browser.newPage();

  console.log('Loading page...');
  await page.goto(url, {waitUntil: 'networkidle2'});

  console.log('Waiting for price socket initialization...');
  await delay(1000);

  console.log('Evaluating...');

  const prices = await page.evaluate(extractPrices);

  console.log('Prices: ', prices);
  return prices;
}



(async () => {
  console.log('Initializing browser...');
  const browser = await puppeteer.launch();
  console.log('Done.');

  app.use(async ctx => {
    if (ctx.path === '/') {
      var prices = await fetchPrices(browser);
      ctx.body = JSON.stringify(prices);
    }
  });  

  await app.listen(3009);
  console.log('Listening on port 3009');
})();

