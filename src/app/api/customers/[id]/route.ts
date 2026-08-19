import { updateHandler, deleteHandler } from "@/lib/crud";
export const PATCH = updateHandler("customer");
export const DELETE = deleteHandler("customer");
