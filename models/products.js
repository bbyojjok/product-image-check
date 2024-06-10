import mongoose from 'mongoose';

export const applyDate = '240418';

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
  },
  {
    collection: `productimagecheck_${applyDate}_tests`,
  },
);

const ProductImageCheck = mongoose.model(
  `Productimagecheck_${applyDate}_tests`,
  ProductImageCheckSchema,
);

export default ProductImageCheck;
