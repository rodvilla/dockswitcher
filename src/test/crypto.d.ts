declare module "crypto" {
  export function randomFillSync<T extends ArrayBufferView>(
    buffer: T,
  ): T;
}
