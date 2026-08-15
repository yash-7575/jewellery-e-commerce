import type { Metadata } from "next";
import OrderClient from "./OrderClient";

export const metadata: Metadata = {
  title: "Order Confirmed — AARANYA",
  description: "Your order from the AARANYA atelier has been confirmed.",
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderClient orderId={id} />;
}
