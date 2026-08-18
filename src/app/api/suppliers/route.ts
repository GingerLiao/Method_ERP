import { listHandler, createHandler } from "@/lib/crud";
export const GET = listHandler("supplier");
export const POST = createHandler("supplier");
