import { updateHandler, deleteHandler } from "@/lib/crud";
export const PATCH = updateHandler("warehouse");
export const DELETE = deleteHandler("warehouse");
