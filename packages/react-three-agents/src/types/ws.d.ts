declare module "ws" {
  import { EventEmitter } from "events";
  import { IncomingMessage } from "http";
  import { Duplex } from "stream";

  class WebSocket extends EventEmitter {
    static readonly CONNECTING: number;
    static readonly OPEN: number;
    static readonly CLOSING: number;
    static readonly CLOSED: number;

    binaryType: string;
    readonly bufferedAmount: number;
    readonly extensions: string;
    readonly protocol: string;
    readonly readyState: number;
    readonly url: string;

    constructor(address: string, protocols?: string | string[], options?: any);

    close(code?: number, data?: string | Buffer): void;
    ping(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
    pong(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
    send(data: any, cb?: (err?: Error) => void): void;
    send(
      data: any,
      options: {
        mask?: boolean;
        binary?: boolean;
        compress?: boolean;
        fin?: boolean;
      },
      cb?: (err?: Error) => void
    ): void;
    terminate(): void;

    on(event: "close", listener: (code: number, reason: string) => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "message", listener: (data: WebSocket.Data) => void): this;
    on(event: "open", listener: () => void): this;
    on(event: "ping" | "pong", listener: (data: Buffer) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
  }

  namespace WebSocket {
    type Data = string | Buffer | ArrayBuffer | Buffer[];
  }

  class WebSocketServer extends EventEmitter {
    constructor(options: WebSocketServer.ServerOptions, callback?: () => void);

    close(cb?: (err?: Error) => void): void;
    handleUpgrade(
      request: IncomingMessage,
      socket: Duplex,
      upgradeHead: Buffer,
      callback: (client: WebSocket, request: IncomingMessage) => void
    ): void;
    shouldHandle(request: IncomingMessage): boolean;

    on(event: "close", listener: () => void): this;
    on(
      event: "connection",
      listener: (socket: WebSocket, request: IncomingMessage) => void
    ): this;
    on(event: "error", listener: (error: Error) => void): this;
    on(
      event: "headers",
      listener: (headers: string[], request: IncomingMessage) => void
    ): this;
    on(event: "listening", listener: () => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
  }

  namespace WebSocketServer {
    interface ServerOptions {
      host?: string;
      port?: number;
      backlog?: number;
      server?: any;
      verifyClient?: VerifyClientCallbackAsync | VerifyClientCallbackSync;
      handleProtocols?: (
        protocols: string[],
        request: IncomingMessage
      ) => string | false;
      path?: string;
      noServer?: boolean;
      clientTracking?: boolean;
      perMessageDeflate?: boolean | PerMessageDeflateOptions;
      maxPayload?: number;
    }

    interface VerifyClientCallbackAsync {
      (
        info: { origin: string; secure: boolean; req: IncomingMessage },
        callback: (res: boolean, code?: number, message?: string) => void
      ): void;
    }

    interface VerifyClientCallbackSync {
      (info: {
        origin: string;
        secure: boolean;
        req: IncomingMessage;
      }): boolean;
    }

    interface PerMessageDeflateOptions {
      serverNoContextTakeover?: boolean;
      clientNoContextTakeover?: boolean;
      serverMaxWindowBits?: number;
      clientMaxWindowBits?: number;
      zlibDeflateOptions?: {
        flush?: number;
        finishFlush?: number;
        chunkSize?: number;
        windowBits?: number;
        level?: number;
        memLevel?: number;
        strategy?: number;
        dictionary?: Buffer | Buffer[] | DataView;
        info?: boolean;
      };
      zlibInflateOptions?: {
        flush?: number;
        finishFlush?: number;
        chunkSize?: number;
        windowBits?: number;
        level?: number;
        memLevel?: number;
        strategy?: number;
        dictionary?: Buffer | Buffer[] | DataView;
        info?: boolean;
      };
      threshold?: number;
      concurrencyLimit?: number;
    }
  }

  export { WebSocket, WebSocketServer };
}
