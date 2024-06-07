import mongoose from 'mongoose';

export const applyDate = '240418';

const { Schema } = mongoose;

const ProductImageCheckSchema = new Schema({
  code: { type: String, required: true },
  status: {
    type: Schema.Types.Mixed,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const ProductImageCheck = mongoose.model(
  `productimagecheck_${applyDate}_test`,
  ProductImageCheckSchema,
);

export default ProductImageCheck;
