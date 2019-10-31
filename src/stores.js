import { writable } from "svelte/store";

export const newTodo = writable("");
export let todos = writable([{ id: "123", title: "new todo" }]);
export let currTodo = writable("123");
