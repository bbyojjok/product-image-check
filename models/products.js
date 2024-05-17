import mongoose from 'mongoose';

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
  'productimagecheck_240131_test',
  ProductImageCheckSchema,
);

export default ProductImageCheck;
