declare module "http" {
  import { Socket } from "net";
  import { EventEmitter } from "events";
  import { Readable, Writable } from "stream";

  export interface IncomingMessage extends Readable {
    headers: { [key: string]: string | string[] | undefined };
    httpVersion: string;
    method?: string;
    url?: string;
    statusCode?: number;
    statusMessage?: string;
    socket: Socket;
  }

  export interface ServerResponse extends Writable {
    statusCode: number;
    statusMessage: string;
    headersSent: boolean;
    sendDate: boolean;
    finished: boolean;

    setHeader(name: string, value: string | string[]): void;
    getHeader(name: string): string | string[] | number | undefined;
    getHeaders(): { [key: string]: string | string[] | number | undefined };
    getHeaderNames(): string[];
    hasHeader(name: string): boolean;
    removeHeader(name: string): void;
    addTrailers(headers: { [key: string]: string | string[] }): void;
    setTimeout(msecs: number, callback?: () => void): this;

    write(
      chunk: any,
      encoding?: string,
      callback?: (error: Error | null | undefined) => void
    ): boolean;
    write(
      chunk: any,
      callback?: (error: Error | null | undefined) => void
    ): boolean;

    end(callback?: () => void): void;
    end(chunk: any, callback?: () => void): void;
    end(chunk: any, encoding?: string, callback?: () => void): void;

    writeContinue(): void;
    writeHead(
      statusCode: number,
      statusMessage?: string,
      headers?: { [key: string]: string | string[] }
    ): this;
    writeHead(
      statusCode: number,
      headers?: { [key: string]: string | string[] }
    ): this;
  }

  export interface Server extends EventEmitter {
    listen(
      port: number,
      hostname?: string,
      backlog?: number,
      callback?: () => void
    ): this;
    listen(port: number, hostname?: string, callback?: () => void): this;
    listen(path: string, callback?: () => void): this;
    listen(handle: any, callback?: () => void): this;
    listen(
      options: {
        port?: number;
        host?: string;
        path?: string;
        backlog?: number;
        exclusive?: boolean;
        readableAll?: boolean;
        writableAll?: boolean;
      },
      callback?: () => void
    ): this;

    close(callback?: (err?: Error) => void): this;
    address():
      | { port: number; family: string; address: string }
      | string
      | null;

    setTimeout(msecs: number, callback?: () => void): this;
    timeout: number;
    keepAliveTimeout: number;
    maxHeadersCount: number | null;
    headersTimeout: number;

    on(event: string, listener: (...args: any[]) => void): this;
  }

  export function createServer(
    requestListener?: (req: IncomingMessage, res: ServerResponse) => void
  ): Server;
}
