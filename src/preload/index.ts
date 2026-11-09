import { contextBridge } from "electron";

contextBridge.exposeInMainWorld(
  "dashboard",
  Object.freeze({ isDesktop: true }),
);
