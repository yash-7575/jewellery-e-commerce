import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

export const doc = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const TABLES = {
  products: process.env.PRODUCTS_TABLE || "aaranya-products",
  categories: process.env.CATEGORIES_TABLE || "aaranya-categories",
  carts: process.env.CARTS_TABLE || "aaranya-carts",
  wishlists: process.env.WISHLISTS_TABLE || "aaranya-wishlists",
  orders: process.env.ORDERS_TABLE || "aaranya-orders",
  reviews: process.env.REVIEWS_TABLE || "aaranya-reviews",
  users: process.env.USERS_TABLE || "aaranya-users",
  contact: process.env.CONTACT_TABLE || "aaranya-contact",
  searchTokens: process.env.SEARCH_TABLE || "aaranya-search-tokens",
} as const;