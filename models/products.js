import mongoose from 'mongoose';

// export const applyDate = '240131';
// export const applyDate = '240226';
// export const applyDate = '240418';
export const applyDate = '240722';

const { Schema } = mongoose;

const ProductImageCheckSchema = new Schema(
  {
    code: { type: String, required: true },
    status: {
      type: Schema.Types.Mixed,
      default: null,
    },
    url: { type: String },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    test_name: { type: String },
    test_result: { type: String },
  },
  {
    collection: `productimagecheck_${applyDate}`,
  },
);

const ProductImageCheck = mongoose.model(
  `Productimagecheck_${applyDate}`,
  ProductImageCheckSchema,
);

export default ProductImageCheck;
