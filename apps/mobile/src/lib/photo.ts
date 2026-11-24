import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export type Shot = { uri: string; base64: string };

/** Foto en JPEG al ancho pedido: suficiente para la IA y liviana para subir con datos móviles. */
export async function prepareShot(uri: string, width = 1024): Promise<Shot> {
  const img = await ImageManipulator.manipulate(uri).resize({ width }).renderAsync();
  const { base64 } = await img.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  return { uri, base64: base64 ?? '' };
}
