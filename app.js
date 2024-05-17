import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import ProductImageCheck from './models/products.js';
import { exec } from 'child_process';

await mongoose
  .connect('mongodb://127.0.0.1:27017', { dbName: 'product-image-check' })
  .then(async () => {
    console.log('[SERVER] Connected to MongoDB');
  })
  .catch((e) => {
    console.error(e);
  });

const __dirname = path.resolve();
const FILE_NAME = 'productsCode_20240417.csv';
const csvPath = path.join(__dirname, './csv', FILE_NAME);
console.log(csvPath);

const csv = fs.readFileSync(csvPath, 'utf-8');
const rows = csv.split('\r\n');
rows.shift();
if (rows[rows.length - 1] === '') {
  rows.pop();
}
const result = rows.reduce((acc, cur) => {
  acc.push({ code: cur });
  return acc;
}, []);

console.log(result);

// const dd = await ProductImageCheck.insertMany(result);
console.log(await ProductImageCheck.find({ code: '2015328190' }).exec());

/**
 * 
 * 이미지 리사이징 후 디렉토리 찾아가기
40A0064311_0.jpg 상품의 경우 맨 뒷자리 버림, 뒤에서 두번째자리 한자리/뒤에서 세번째자리 한자리/뒤에서 네번째자리 한자리/뒤에서 여섯번째자리 두자리/뒤에서 여덟번째자리 두자리
1/3/4/06/A0 해당 경로에 리사이징되어 이동됨
홈쇼핑 상품코드는 맨 뒷자리 2 자리 버림
*/
