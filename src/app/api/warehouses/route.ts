import { listHandler, createHandler } from "@/lib/crud";
export const GET = listHandler("warehouse");
export const POST = createHandler("warehouse");
