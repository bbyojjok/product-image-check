import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import axios from 'axios';
import cheerio from 'cheerio';
import ProductImageCheck from './models/products.js';

await mongoose
  .connect('mongodb://127.0.0.1:27017', { dbName: 'product-image-check' })
  .then(async () => {
    console.log('[SERVER] Connected to MongoDB');
  })
  .catch((e) => {
    console.error(e);
  });

const delay = (time = 0) => new Promise((res) => setTimeout(res, time));

const getCsv = () => {
  /**
   * csv 상품코드 가져오기
   */
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

  return result;
};

const csvToDb = async () => {
  /**
   * 상품코드 db 저장
   */
  const codes = getCsv();
  try {
    const result = await ProductImageCheck.insertMany(codes).exec();
    console.log(result);
    console.log('csv파일 상품코드 db 저장 완료');
  } catch (e) {
    console.log('[ERROR] db 저장 실패');
  }
};

const imgUrlMaker = (code) => {
  /**
   * 이미지 경로 만들기
   */
  const url = `https://image.thehyundai.com/static/${code.slice(
    code.length - 2,
    code.length - 1,
  )}/${code.slice(code.length - 3, code.length - 2)}/${code.slice(
    code.length - 4,
    code.length - 3,
  )}/${code.slice(code.length - 6, code.length - 4)}/${code.slice(
    code.length - 8,
    code.length - 6,
  )}/${code}_0_600`;
  return [`${url}.jpg`, `${url}.JPG`];
};

const checkImage = async (code) => {
  /**
   * 이미지 체크 후 상태값 db에 저장하기
   */
  const url = imgUrlMaker(code);
  console.log(url);
  const statusArr = [];
  let status = '';
  for (let i = 0; i < url.length; i++) {
    try {
      const result = await axios.get(url[i]);
      statusArr.push(result.status);
      // console.log(`status: ${result.status}`);
    } catch (e) {
      statusArr.push(e.response.status);
      // console.log(`status: ${e.response.status}`);
    }
  }
  if (statusArr.includes(200)) {
    status = '200';
    console.log(`status: 200`);
  } else {
    status = '404';
    console.log(`status: 404`);
  }

  try {
    const doc = await ProductImageCheck.findOneAndUpdate(
      { code },
      { status },
      { new: true },
    ).exec();
    console.log(doc);
  } catch (e) {
    console.log('[ERROR] db 저장 실패');
  }
};

(async () => {
  // csvToDb(); // csv 파일 db에 저장
  // return;

  const rows = await ProductImageCheck.find({ status: null }).exec();
  console.log(rows);
  console.log(`========================================`);

  for (let i = 0; i < rows.length; i++) {
    console.log(`code: ${rows[i].code}`);
    await checkImage(rows[i].code);
    console.log(`----------------------------------------`);
    await delay(1000);
  }
})();

/**
 * 
 * 이미지 리사이징 후 디렉토리 찾아가기
40A0064311_0.jpg 상품의 경우 맨 뒷자리 버림, 뒤에서 두번째자리 한자리/뒤에서 세번째자리 한자리/뒤에서 네번째자리 한자리/뒤에서 여섯번째자리 두자리/뒤에서 여덟번째자리 두자리
1/3/4/06/A0 해당 경로에 리사이징되어 이동됨
홈쇼핑 상품코드는 맨 뒷자리 2 자리 버림
*/

/*
1. csv파일 읽기
2. db에 저장
3. db에 satus: null 인 row 조회
4. img url 체크
5. 체크된 결과 db에 저장
*/
