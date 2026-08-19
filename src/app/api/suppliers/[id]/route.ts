import { updateHandler, deleteHandler } from "@/lib/crud";
export const PATCH = updateHandler("supplier");
export const DELETE = deleteHandler("supplier");
