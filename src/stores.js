import { writable } from "svelte/store";

export const newTodo = writable("");
export let todos = writable(parseLocal("todos") || [{title : "some title"}]);
export let currTodo = writable("123");
export let darkmode = writable(BoolLocal("darkmode"));
export let showSetting = writable(true);

function parseLocal (key) {return JSON.parse(localStorage.getItem(key))}
function BoolLocal (key) { return localStorage.getItem(key) === "true"}
console.log(BoolLocal("darkmode"));