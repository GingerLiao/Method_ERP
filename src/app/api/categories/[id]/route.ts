import { updateHandler, deleteHandler } from "@/lib/crud";
export const PATCH = updateHandler("category");
export const DELETE = deleteHandler("category");
