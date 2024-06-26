import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import axios from 'axios';
import { makeDirectory } from 'make-dir';
import xl from 'excel4node';
import ProductImageCheck from './models/products.js';
import { applyDate } from './models/products.js';

await mongoose
  .connect('mongodb://127.0.0.1:27017', { dbName: 'product-image-check' })
  .then(async () => {
    console.log('[SERVER] Connected to MongoDB');
  })
  .catch((e) => {
    console.error(e);
  });

const fileName = 'productsCode_';
const delay = (time = 0) => new Promise((res) => setTimeout(res, time));

const getCsv = (date) => {
  /**
   * csv 상품코드 가져오기
   */
  const __dirname = path.resolve();
  const FILE_NAME = `${fileName + date}.csv`;
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

const csvToDb = async (date) => {
  /**
   * 상품코드 db 저장
   */
  const codes = getCsv(date);
  console.log(codes);
  // try {
  //   const result = await ProductImageCheck.insertMany(codes).exec();
  //   console.log(result);
  //   console.log('csv파일 상품코드 db 저장 완료');
  // } catch (e) {
  //   console.log('[ERROR] db 저장 실패');
  // }
};

const dbToXlsx = async (date) => {
  /**
   * 엑셀파일로 저장
   */

  // 폴더 생성
  await makeDirectory(`xlsx`);

  // 엑셀
  const wb = new xl.Workbook();
  const ws = wb.addWorksheet(`Sheet 1`);
  const style_head = wb.createStyle({
    font: { bold: true, color: '#000000', size: 13 },
    alignment: { horizontal: ['center'], vertical: ['center'] },
  });
  const style_right = wb.createStyle({ alignment: { horizontal: ['right'] } });

  ws.cell(1, 1).string('code').style(style_head);
  ws.cell(1, 2).string('status').style(style_head);
  ws.column(1).setWidth(15);
  ws.column(2).setWidth(15);

  const data = await ProductImageCheck.find({ status: '404' }).exec();
  data.forEach((v, i) => {
    const num = i + 2;
    const { code, status } = v;
    ws.cell(num, 1).string(code).style(style_right);
    ws.cell(num, 2).string(status).style(style_right);
  });

  // 엑셀 저장
  wb.write(`xlsx/${fileName + date}.xlsx`, (err, stats) => {
    if (err) {
      console.error(err);
    } else {
      console.log('xlsx 파일 저장');
    }
  });
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
      statusArr.push('404');
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
      { status, url: url[0] },
      { new: true },
    ).exec();
    console.log(doc);
  } catch (e) {
    console.log('[ERROR] db 저장 실패');
  }
};

const statusCounting = async () => {
  const statusCount = await ProductImageCheck.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  console.log(statusCount);
};

const check = async () => {
  const rows = await ProductImageCheck.find({ status: null }).exec();
  if (rows.length === 0) {
    console.log(`status: null 체크할 row갯수가 0`);
    return;
  } else {
    console.log(rows);
  }
  console.log(`========================================`);

  for (let i = 0; i < rows.length; i++) {
    console.log(`code: ${rows[i].code}`);
    await checkImage(rows[i].code);
    console.log(`----------------------------------------`);
    if (i === rows.length - 1) {
      console.log('########## 종료 ##########');
    }
    await delay(500);
  }
};

(async () => {
  console.log('applyDate:', applyDate);

  // await csvToDb(applyDate); // csv 파일 db에 저장
  // return;

  // await dbToXlsx(applyDate); // xlsx 파일로 저장
  // return;

  await statusCounting(); // status 카운팅
  // return;

  await check(); // 이미지체크
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
6. db 읽어 엑셀파일로 저장
*/
