import { listHandler, createHandler } from "@/lib/crud";
export const GET = listHandler("category");
export const POST = createHandler("category");
