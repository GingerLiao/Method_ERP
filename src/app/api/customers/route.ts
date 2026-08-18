import { listHandler, createHandler } from "@/lib/crud";
export const GET = listHandler("customer");
export const POST = createHandler("customer");
