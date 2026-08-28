export const MODEL_NAMES_ES: Record<string, string> = {
  User: "Usuario",
  Product: "Producto",
  ProductImage: "Imagen de producto",
  Favorite: "Favorito",
  Category: "Categoría",
  Subcategory: "Subcategoría",
  City: "Ciudad",
  Campus: "Campus",
  Conversation: "Conversación",
  Message: "Mensaje",
  MessageAttachment: "Archivo adjunto",
  Transaction: "Transacción",
  Review: "Reseña",
  Notification: "Notificación",
  PushToken: "Token de notificaciones",
  Report: "Reporte",
  AdminAuditLog: "Registro de auditoría",
  Session: "Sesión",
};

export function toSpanishModelName(modelName: string): string {
  return MODEL_NAMES_ES[modelName] ?? "Recurso";
}
