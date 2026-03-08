import { describe, it, expect } from "vitest";
import { EventEmitter } from "./interfaces";

describe("EventEmitter", () => {
  it("notifies listeners on emit", () => {
    const emitter = new EventEmitter<string>();
    const received: string[] = [];

    emitter.on((data) => received.push(data));
    emitter.emit("hello");
    emitter.emit("world");

    expect(received).toEqual(["hello", "world"]);
  });

  it("supports multiple listeners", () => {
    const emitter = new EventEmitter<number>();
    let sum = 0;
    let count = 0;

    emitter.on((n) => (sum += n));
    emitter.on(() => count++);

    emitter.emit(5);
    emitter.emit(3);

    expect(sum).toBe(8);
    expect(count).toBe(2);
  });

  it("allows unsubscription", () => {
    const emitter = new EventEmitter<string>();
    const received: string[] = [];

    const unsub = emitter.on((data) => received.push(data));
    emitter.emit("a");
    unsub();
    emitter.emit("b");

    expect(received).toEqual(["a"]);
  });

  it("handles errors in listeners without stopping others", () => {
    const emitter = new EventEmitter<string>();
    const received: string[] = [];

    emitter.on(() => {
      throw new Error("fail");
    });
    emitter.on((data) => received.push(data));

    emitter.emit("test");

    expect(received).toEqual(["test"]);
  });

  it("clears all listeners", () => {
    const emitter = new EventEmitter<string>();
    const received: string[] = [];

    emitter.on((data) => received.push(data));
    emitter.clear();
    emitter.emit("after-clear");

    expect(received).toEqual([]);
  });
});
